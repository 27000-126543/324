import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  MicrobeSpecies,
  ExtracellularEnzyme,
  MetabolicNetwork,
  MetabolicNetworkNode,
  MetabolicNetworkEdge,
  SimulationTimePoint,
  SimulationParameters,
  WarningEvent,
  WarningLevel,
  WarningType,
  CarbonPool,
  SoilPhysicochemicalData,
} from '../../shared/types';

interface ODEState {
  co2Flux: number;
  microbialBiomass: number;
  doc: number;
  poc: number;
  enzymeActivities: Record<string, number>;
  microbeAbundances: Record<string, number>;
  carbonPoolAmounts: Record<string, number>;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildMetabolicNetwork(
  microbes: MicrobeSpecies[],
  enzymes: ExtracellularEnzyme[],
  simulationId: string
): MetabolicNetwork {
  const nodes: MetabolicNetworkNode[] = [];
  const edges: MetabolicNetworkEdge[] = [];
  const compoundIds = new Set<string>();

  microbes.forEach((m) => {
    nodes.push({
      id: `microbe_${m.id}`,
      type: 'microbe',
      label: m.name,
      abundance: m.relativeAbundance,
    });
    m.functions.forEach((func) => {
      compoundIds.add(func);
    });
  });

  enzymes.forEach((e) => {
    nodes.push({
      id: `enzyme_${e.id}`,
      type: 'enzyme',
      label: e.enzymeName,
      abundance: e.activity,
    });
    compoundIds.add(e.substrate);
    compoundIds.add(e.product);
  });

  compoundIds.forEach((cid) => {
    nodes.push({
      id: `compound_${cid}`,
      type: 'compound',
      label: cid,
    });
  });

  microbes.forEach((m) => {
    m.functions.forEach((func) => {
      edges.push({
        source: `microbe_${m.id}`,
        target: `compound_${func}`,
        weight: m.relativeAbundance,
        type: 'metabolize',
      });
    });
  });

  enzymes.forEach((e) => {
    edges.push({
      source: `enzyme_${e.id}`,
      target: `compound_${e.substrate}`,
      weight: e.km,
      type: 'catalyze',
    });
    edges.push({
      source: `compound_${e.substrate}`,
      target: `compound_${e.product}`,
      weight: e.vmax,
      type: 'produce',
    });
    microbes.forEach((m) => {
      const hasFunctionalLink = m.functions.some(
        (func) => func.includes(e.substrate) || func.includes(e.product) || e.encodingGenes.some((g) => func.includes(g))
      );
      if (hasFunctionalLink || Math.random() > 0.7) {
        edges.push({
          source: `microbe_${m.id}`,
          target: `enzyme_${e.id}`,
          weight: m.relativeAbundance * e.activity * 0.1,
          type: 'produce',
        });
      }
    });
  });

  if (edges.length > 10 && Math.random() > 0.5) {
    const randomIdx = Math.floor(Math.random() * (edges.length - 5));
    edges[randomIdx] = {
      ...edges[randomIdx],
      type: 'inhibit',
      weight: edges[randomIdx].weight * 0.5,
    };
  }

  const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);
  nodes.forEach((node, idx) => {
    const radius = node.type === 'microbe' ? 200 : node.type === 'enzyme' ? 140 : 80;
    node.x = radius * Math.cos(idx * angleStep);
    node.y = radius * Math.sin(idx * angleStep);
  });

  return {
    id: uuidv4(),
    simulationId,
    nodes,
    edges,
  };
}

export function runDecompositionStep(
  state: ODEState,
  params: SimulationParameters,
  soilData: SoilPhysicochemicalData,
  dt: number,
  currentHour: number
): ODEState {
  const tempFactor = Math.exp(-0.06 * Math.abs(soilData.temperature - 25));
  const moistureFactor = soilData.moisture / 100;
  const phFactor = Math.exp(-0.5 * Math.pow((soilData.pH - 7) / 2, 2));
  const envFactor = tempFactor * moistureFactor * phFactor;

  const totalMicrobeAbundance = Object.values(state.microbeAbundances).reduce(
    (sum, v) => sum + v,
    0
  );

  const f = (s: ODEState): ODEState => {
    const docDecomp = 0.08 * s.doc * envFactor * (1 + totalMicrobeAbundance * 0.01);
    const pocDecomp = 0.015 * s.poc * envFactor * (1 + totalMicrobeAbundance * 0.005);
    const docFromPoc = pocDecomp * 0.6;

    const enzymeBoost = Object.values(s.enzymeActivities).reduce(
      (sum, act) => sum + act * 0.0002,
      0
    );
    const effectiveDocDecomp = docDecomp * (1 + enzymeBoost);

    const co2Production = effectiveDocDecomp * 0.55;
    const biomassProduction = effectiveDocDecomp * 0.3;
    const biomassTurnover = s.microbialBiomass * 0.02;
    const docFromBiomass = biomassTurnover * 0.7;

    const dDoc = docFromPoc + docFromBiomass - effectiveDocDecomp;
    const dPoc = -pocDecomp;
    const dBiomass = biomassProduction - biomassTurnover;

    const diurnalMod = params.temperatureModel === 'DIURNAL'
      ? 1 + 0.3 * Math.sin((currentHour / 24) * 2 * Math.PI - Math.PI / 2)
      : 1;
    const dCo2 = co2Production * diurnalMod;

    const newEnzymeActivities: Record<string, number> = {};
    Object.keys(s.enzymeActivities).forEach((key) => {
      const act = s.enzymeActivities[key];
      const synthesis = biomassProduction * act * 0.05;
      const degradation = act * 0.01;
      newEnzymeActivities[key] = Math.max(0, synthesis - degradation);
    });

    const newMicrobeAbundances: Record<string, number> = {};
    Object.keys(s.microbeAbundances).forEach((key) => {
      const ab = s.microbeAbundances[key];
      const growth = ab * biomassProduction * 0.001 * envFactor;
      const death = ab * 0.005;
      newMicrobeAbundances[key] = Math.max(0, ab + (growth - death) * dt);
    });

    const newCarbonPoolAmounts: Record<string, number> = {};
    Object.keys(s.carbonPoolAmounts).forEach((key) => {
      const amt = s.carbonPoolAmounts[key];
      let delta = 0;
      if (key === '活性碳库') {
        delta = -effectiveDocDecomp * 0.4;
      } else if (key === '慢性碳库') {
        delta = -pocDecomp * 0.3;
      } else if (key === '惰性碳库') {
        delta = pocDecomp * 0.05;
      } else if (key === '微生物生物量碳') {
        delta = dBiomass * 10;
      } else if (key === 'DOC') {
        delta = dDoc * 10;
      } else if (key === 'POC') {
        delta = dPoc * 10;
      }
      newCarbonPoolAmounts[key] = Math.max(0, amt + delta * dt);
    });

    return {
      co2Flux: dCo2,
      microbialBiomass: dBiomass,
      doc: dDoc,
      poc: dPoc,
      enzymeActivities: newEnzymeActivities,
      microbeAbundances: newMicrobeAbundances,
      carbonPoolAmounts: newCarbonPoolAmounts,
    };
  };

  const addStates = (a: ODEState, b: ODEState, scale: number): ODEState => {
    const result: ODEState = {
      co2Flux: a.co2Flux + b.co2Flux * scale,
      microbialBiomass: a.microbialBiomass + b.microbialBiomass * scale,
      doc: a.doc + b.doc * scale,
      poc: a.poc + b.poc * scale,
      enzymeActivities: {},
      microbeAbundances: {},
      carbonPoolAmounts: {},
    };
    Object.keys(a.enzymeActivities).forEach((k) => {
      result.enzymeActivities[k] = a.enzymeActivities[k] + (b.enzymeActivities[k] || 0) * scale;
    });
    Object.keys(a.microbeAbundances).forEach((k) => {
      result.microbeAbundances[k] = a.microbeAbundances[k] + (b.microbeAbundances[k] || 0) * scale;
    });
    Object.keys(a.carbonPoolAmounts).forEach((k) => {
      result.carbonPoolAmounts[k] = a.carbonPoolAmounts[k] + (b.carbonPoolAmounts[k] || 0) * scale;
    });
    return result;
  };

  const k1 = f(state);
  const k2 = f(addStates(state, k1, dt / 2));
  const k3 = f(addStates(state, k2, dt / 2));
  const k4 = f(addStates(state, k3, dt));

  const result: ODEState = {
    co2Flux: state.co2Flux + (dt / 6) * (k1.co2Flux + 2 * k2.co2Flux + 2 * k3.co2Flux + k4.co2Flux),
    microbialBiomass:
      state.microbialBiomass +
      (dt / 6) *
        (k1.microbialBiomass + 2 * k2.microbialBiomass + 2 * k3.microbialBiomass + k4.microbialBiomass),
    doc: state.doc + (dt / 6) * (k1.doc + 2 * k2.doc + 2 * k3.doc + k4.doc),
    poc: state.poc + (dt / 6) * (k1.poc + 2 * k2.poc + 2 * k3.poc + k4.poc),
    enzymeActivities: {},
    microbeAbundances: {},
    carbonPoolAmounts: {},
  };

  Object.keys(state.enzymeActivities).forEach((k) => {
    result.enzymeActivities[k] =
      state.enzymeActivities[k] +
      (dt / 6) *
        (k1.enzymeActivities[k] +
          2 * (k2.enzymeActivities[k] || 0) +
          2 * (k3.enzymeActivities[k] || 0) +
          (k4.enzymeActivities[k] || 0));
  });

  Object.keys(state.microbeAbundances).forEach((k) => {
    result.microbeAbundances[k] =
      state.microbeAbundances[k] +
      (dt / 6) *
        (k1.microbeAbundances[k] +
          2 * (k2.microbeAbundances[k] || 0) +
          2 * (k3.microbeAbundances[k] || 0) +
          (k4.microbeAbundances[k] || 0));
  });

  Object.keys(state.carbonPoolAmounts).forEach((k) => {
    result.carbonPoolAmounts[k] =
      state.carbonPoolAmounts[k] +
      (dt / 6) *
        (k1.carbonPoolAmounts[k] +
          2 * (k2.carbonPoolAmounts[k] || 0) +
          2 * (k3.carbonPoolAmounts[k] || 0) +
          (k4.carbonPoolAmounts[k] || 0));
  });

  return result;
}

export function detectWarnings(
  timeSeries: SimulationTimePoint[],
  params: SimulationParameters,
  simulationId: string,
  windowSize: number = 24
): WarningEvent[] {
  const warnings: WarningEvent[] = [];
  const co2Baseline = (params.co2BaselineUpper + params.co2BaselineLower) / 2;
  const enzymeDropThreshold = params.enzymeDropThreshold / 100;

  for (let i = windowSize; i < timeSeries.length; i++) {
    const current = timeSeries[i];
    const window = timeSeries.slice(i - windowSize, i);

    const avgCo2 = window.reduce((s, p) => s + p.co2Flux, 0) / window.length;
    const co2Std = Math.sqrt(
      window.reduce((s, p) => s + Math.pow(p.co2Flux - avgCo2, 2), 0) / window.length
    );
    const co2Deviation = Math.abs(current.co2Flux - co2Baseline) / co2Baseline;

    if (co2Deviation > 0.3 || Math.abs(current.co2Flux - avgCo2) > 2.5 * co2Std) {
      const level: WarningLevel = co2Deviation > 0.5 ? 'CRITICAL' : 'WARNING';
      const type: WarningType = 'CO2_DEVIATION';
      warnings.push({
        id: uuidv4(),
        simulationId,
        level,
        type,
        title: level === 'CRITICAL' ? 'CO2通量严重偏离基线' : 'CO2通量异常波动',
        description: `在第${current.timeHour}小时，CO2通量为${current.co2Flux.toFixed(3)} μmol/m²/s，偏离基线${(co2Deviation * 100).toFixed(1)}%`,
        triggeredAt: dayjs().subtract(timeSeries.length - i, 'hour').toISOString(),
        hourPoint: current.timeHour,
        metricName: 'CO2通量',
        baselineValue: co2Baseline,
        actualValue: current.co2Flux,
        deviationPercent: co2Deviation * 100,
        resolved: false,
      });
    }

    const enzymeKeys = Object.keys(current.enzymeActivities);
    for (const key of enzymeKeys) {
      const avgAct = window.reduce((s, p) => s + (p.enzymeActivities[key] || 0), 0) / window.length;
      const currentAct = current.enzymeActivities[key] || 0;
      if (avgAct > 0 && (avgAct - currentAct) / avgAct > enzymeDropThreshold) {
        const dropPct = ((avgAct - currentAct) / avgAct) * 100;
        warnings.push({
          id: uuidv4(),
          simulationId,
          level: dropPct > 50 ? 'CRITICAL' : 'WARNING',
          type: 'ENZYME_DROP',
          title: `${key}活性显著下降`,
          description: `酶${key}活性从滚动均值${avgAct.toFixed(2)}下降至${currentAct.toFixed(2)}，降幅${dropPct.toFixed(1)}%`,
          triggeredAt: dayjs().subtract(timeSeries.length - i, 'hour').toISOString(),
          hourPoint: current.timeHour,
          metricName: `${key}活性`,
          baselineValue: avgAct,
          actualValue: currentAct,
          deviationPercent: dropPct,
          resolved: false,
        });
      }
    }

    const avgBiomass = window.reduce((s, p) => s + p.microbialBiomass, 0) / window.length;
    if (avgBiomass > 0 && (avgBiomass - current.microbialBiomass) / avgBiomass > 0.4) {
      const dropPct = ((avgBiomass - current.microbialBiomass) / avgBiomass) * 100;
      warnings.push({
        id: uuidv4(),
        simulationId,
        level: dropPct > 60 ? 'CRITICAL' : 'WARNING',
        type: 'BIOMASS_COLLAPSE',
        title: '微生物生物量骤降',
        description: `微生物生物量从${avgBiomass.toFixed(2)} mg/kg下降至${current.microbialBiomass.toFixed(2)} mg/kg，降幅${dropPct.toFixed(1)}%`,
        triggeredAt: dayjs().subtract(timeSeries.length - i, 'hour').toISOString(),
        hourPoint: current.timeHour,
        metricName: '微生物生物量',
        baselineValue: avgBiomass,
        actualValue: current.microbialBiomass,
        deviationPercent: dropPct,
        resolved: false,
      });
    }

    if (i > windowSize * 2 && i % windowSize === 0) {
      const recent = timeSeries.slice(i - windowSize, i);
      const earlier = timeSeries.slice(i - windowSize * 2, i - windowSize);
      const recentVar =
        recent.reduce((s, p) => s + Math.pow(p.co2Flux - avgCo2, 2), 0) / recent.length;
      const earlierVar =
        earlier.reduce((s, p) => s + Math.pow(p.co2Flux - avgCo2, 2), 0) / earlier.length;
      if (earlierVar > 0 && recentVar / earlierVar > 3) {
        warnings.push({
          id: uuidv4(),
          simulationId,
          level: 'WARNING',
          type: 'CONVERGENCE_FAIL',
          title: '数值收敛性警告',
          description: `CO2通量方差比${(recentVar / earlierVar).toFixed(2)}超过阈值3，可能存在数值不稳定`,
          triggeredAt: dayjs().subtract(timeSeries.length - i, 'hour').toISOString(),
          hourPoint: current.timeHour,
          metricName: 'CO2通量方差比',
          baselineValue: 3,
          actualValue: recentVar / earlierVar,
          deviationPercent: ((recentVar / earlierVar - 3) / 3) * 100,
          resolved: false,
        });
      }
    }
  }

  return warnings;
}

export function generateTimeSeries(
  params: SimulationParameters,
  soilData: SoilPhysicochemicalData,
  microbes: MicrobeSpecies[],
  enzymes: ExtracellularEnzyme[],
  carbonPools: CarbonPool[],
  anomalySeed?: number
): { timeSeries: SimulationTimePoint[]; generatedWarnings: WarningEvent[] } {
  const rand = seededRandom(anomalySeed ?? Date.now() % 100000);
  const totalHours = params.simulationDays * 24;
  const stepHours = params.timeStepHours;
  const steps = Math.floor(totalHours / stepHours);

  const initialEnzymeActivities: Record<string, number> = {};
  enzymes.forEach((e) => {
    initialEnzymeActivities[e.enzymeName] = e.activity;
  });

  const initialMicrobeAbundances: Record<string, number> = {};
  microbes.forEach((m) => {
    initialMicrobeAbundances[m.id] = m.relativeAbundance * 100;
  });

  const initialCarbonPoolAmounts: Record<string, number> = {};
  carbonPools.forEach((cp) => {
    initialCarbonPoolAmounts[cp.poolName] = cp.initialAmount;
  });

  let state: ODEState = {
    co2Flux: (params.co2BaselineUpper + params.co2BaselineLower) / 2,
    microbialBiomass: soilData.organicMatter * 0.02,
    doc: soilData.organicMatter * 0.05,
    poc: soilData.organicMatter * 0.3,
    enzymeActivities: { ...initialEnzymeActivities },
    microbeAbundances: { ...initialMicrobeAbundances },
    carbonPoolAmounts: { ...initialCarbonPoolAmounts },
  };

  const timeSeries: SimulationTimePoint[] = [];
  const anomalyHours: number[] = [];

  const anomalyCount = 2 + Math.floor(rand() * 3);
  for (let a = 0; a < anomalyCount; a++) {
    anomalyHours.push(Math.floor((totalHours * 0.2 + rand() * totalHours * 0.7) / stepHours) * stepHours);
  }

  for (let step = 0; step <= steps; step++) {
    const currentHour = step * stepHours;
    const isAnomaly = anomalyHours.includes(currentHour);

    if (step > 0) {
      state = runDecompositionStep(state, params, soilData, stepHours, currentHour);
    }

    if (isAnomaly && step > 0) {
      const anomalyType = Math.floor(rand() * 4);
      if (anomalyType === 0) {
        state.co2Flux *= 1 + (rand() > 0.5 ? 1 : -1) * (0.5 + rand() * 0.5);
      } else if (anomalyType === 1) {
        const keys = Object.keys(state.enzymeActivities);
        if (keys.length > 0) {
          const targetKey = keys[Math.floor(rand() * keys.length)];
          state.enzymeActivities[targetKey] *= 0.2 + rand() * 0.3;
        }
      } else if (anomalyType === 2) {
        state.microbialBiomass *= 0.3 + rand() * 0.2;
        Object.keys(state.microbeAbundances).forEach((k) => {
          state.microbeAbundances[k] *= 0.3 + rand() * 0.3;
        });
      } else {
        state.co2Flux *= 2 + rand() * 1.5;
      }
    }

    const tempMod = params.temperatureModel === 'DIURNAL'
      ? soilData.temperature + 5 * Math.sin((currentHour / 24) * 2 * Math.PI - Math.PI / 2)
      : soilData.temperature;
    const moistureMod = params.moistureModel === 'RAINFALL'
      ? Math.max(
          20,
          soilData.moisture - (currentHour % (24 * 5)) * 0.1 + (currentHour % (24 * 5) < 24 ? 15 : 0)
        )
      : soilData.moisture;

    timeSeries.push({
      timeHour: currentHour,
      co2Flux: Math.max(0.01, state.co2Flux + (rand() - 0.5) * 0.2),
      microbialBiomass: Math.max(0.01, state.microbialBiomass + (rand() - 0.5) * 0.5),
      dissolvedOrganicC: Math.max(0.01, state.doc + (rand() - 0.5) * 0.3),
      particulateOrganicC: Math.max(0.01, state.poc + (rand() - 0.5) * 0.3),
      enzymeActivities: { ...state.enzymeActivities },
      microbeAbundances: { ...state.microbeAbundances },
      carbonPoolAmounts: { ...state.carbonPoolAmounts },
      temperature: tempMod,
      moisture: moistureMod,
    });
  }

  const generatedWarnings = detectWarnings(timeSeries, params, 'pending');

  return { timeSeries, generatedWarnings };
}
