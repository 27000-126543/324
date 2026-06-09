import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  User,
  UserRole,
  SoilPhysicochemicalData,
  SoilType,
  SimulationTask,
  SimulationStatus,
  SimulationStatusHistoryItem,
  SimulationParameters,
  MicrobeSpecies,
  CarbonPool,
  CarbonPoolName,
  ExtracellularEnzyme,
  WarningEvent,
  ApprovalRecord,
  ApprovalStage,
  ApprovalResult,
  Recommendation,
  DailyDashboardStats,
  AdjustmentLog,
  AdjustmentType,
} from '../../shared/types';
import {
  buildMetabolicNetwork,
  generateTimeSeries,
} from '../utils/simulationEngine';

const USER_ROLE_NAMES: Record<UserRole, string> = {
  FARM_ADMIN: '农场管理员',
  ECOLOGIST: '生态学家',
  MICROBE_VALIDATOR: '微生物验证者',
  SOIL_EXPERT: '土壤健康专家',
  CHIEF_SCIENTIST: '首席科学家',
};

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

export function createMockUsers(): User[] {
  const userDefs: Array<{
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    phone: string;
  }> = [
    {
      username: 'farm',
      fullName: '周农场',
      email: 'zhou.farm@greenfield-agri.com',
      role: 'FARM_ADMIN',
      phone: '13800138005',
    },
    {
      username: 'ecologist',
      fullName: '孙生态',
      email: 'sun.eco@soil-science.ac.cn',
      role: 'ECOLOGIST',
      phone: '13800138004',
    },
    {
      username: 'microbe_val',
      fullName: '刘验证',
      email: 'liu.validator@soil-science.ac.cn',
      role: 'MICROBE_VALIDATOR',
      phone: '13800138002',
    },
    {
      username: 'soil_expert',
      fullName: '赵土壤',
      email: 'zhao.expert@soil-science.ac.cn',
      role: 'SOIL_EXPERT',
      phone: '13800138003',
    },
    {
      username: 'chief_sci',
      fullName: '陈首席',
      email: 'chen.chief@soil-science.ac.cn',
      role: 'CHIEF_SCIENTIST',
      phone: '13800138001',
    },
  ];

  return userDefs.map((u, i) => ({
    id: `u_${u.role.toLowerCase()}_0${i + 1}`,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    passwordHash: `***mock_hash_${i}***`,
    status: 'ACTIVE' as const,
    createdAt: dayjs().subtract(30 + i * 5, 'day').toISOString(),
    lastLoginAt: dayjs().subtract(i + 1, 'hour').toISOString(),
  }));
}

export function createMockSoilData(users: User[]): SoilPhysicochemicalData[] {
  const soilTypes: SoilType[] = ['黑土', '红壤', '黄壤', '褐土', '潮土', '水稻土'];
  const locations: Array<{ lat: number; lng: number; place: string }> = [
    { lat: 45.8, lng: 126.5, place: '黑龙江海伦' },
    { lat: 28.2, lng: 113.0, place: '湖南祁阳' },
    { lat: 30.6, lng: 104.1, place: '四川雅安' },
    { lat: 36.4, lng: 117.0, place: '山东泰安' },
    { lat: 39.3, lng: 116.9, place: '河北沧州' },
    { lat: 31.2, lng: 121.5, place: '上海松江' },
    { lat: 43.8, lng: 125.3, place: '吉林公主岭' },
    { lat: 26.1, lng: 119.3, place: '福建建瓯' },
  ];

  const uploaders = users.filter((u) => u.role === 'FARM_ADMIN' || u.role === 'ECOLOGIST');

  return Array.from({ length: 8 }, (_, i) => {
    const loc = locations[i];
    const basePH = 5.5 + Math.random() * 3.5;
    return {
      id: `soil_${String(i + 1).padStart(3, '0')}`,
      sampleId: `SMP-${dayjs()
        .subtract(20 + i, 'day')
        .format('YYYYMMDD')}-${String(i + 1).padStart(3, '0')}`,
      soilType: pick(soilTypes, i),
      pH: Math.round((basePH + (Math.random() - 0.5) * 0.5) * 100) / 100,
      organicMatter: Math.round((15 + Math.random() * 40) * 10) / 10,
      temperature: Math.round((15 + Math.random() * 15) * 10) / 10,
      moisture: Math.round((35 + Math.random() * 40) * 10) / 10,
      totalNitrogen: Math.round((0.8 + Math.random() * 2.5) * 100) / 100,
      availableP: Math.round((5 + Math.random() * 40) * 10) / 10,
      clayRatio: Math.round((15 + Math.random() * 35) * 10) / 10,
      collectionDate: dayjs()
        .subtract(20 + i * 2, 'day')
        .format('YYYY-MM-DD'),
      location: { lat: loc.lat, lng: loc.lng },
      uploaderId: pick(uploaders, i).id,
    };
  });
}

function createMicrobesForSimulation(simId: string, count: number = 8): MicrobeSpecies[] {
  const phyla = ['Actinobacteria', 'Proteobacteria', 'Firmicutes', 'Bacteroidetes', 'Acidobacteria', 'Verrucomicrobia'];
  const genera = [
    'Streptomyces',
    'Pseudomonas',
    'Bacillus',
    'Flavobacterium',
    'Arthrobacter',
    'Rhizobium',
    'Azotobacter',
    'Sphingomonas',
    'Lysobacter',
    'Paenibacillus',
  ];
  const functions = ['cellulose_degradation', 'hemicellulose_degradation', 'lignin_degradation', 'nitrogen_fixation', 'phosphorus_solubilization', 'chitin_degradation'];

  const species: MicrobeSpecies[] = [];
  let totalAbundance = 0;
  const rawAbundances = Array.from({ length: count }, () => Math.random() * 5 + 1);
  const sum = rawAbundances.reduce((a, b) => a + b, 0);

  for (let i = 0; i < count; i++) {
    const genus = pick(genera, i + simId.length);
    const relativeAbundance = Math.round((rawAbundances[i] / sum) * 10000) / 100;
    totalAbundance += relativeAbundance;
    species.push({
      id: `mic_${simId.slice(-6)}_${i + 1}`,
      taxId: `tax_${100000 + Math.floor(Math.random() * 900000)}`,
      name: `${genus} sp. ${String.fromCharCode(65 + i)}`,
      kingdom: 'Bacteria',
      phylum: pick(phyla, i),
      class: `${pick(phyla, i)}_Class${i + 1}`,
      order: `Order_${String.fromCharCode(65 + i)}${i + 1}`,
      family: `${genus}aceae`,
      genus,
      species: `${genus.toLowerCase()} sp. ${String.fromCharCode(65 + i)}`,
      relativeAbundance,
      functions: functions.filter(() => Math.random() > 0.4).slice(0, 3),
      simulationId: simId,
    });
  }

  if (species.length > 0) {
    species[species.length - 1].relativeAbundance =
      Math.round((100 - totalAbundance + species[species.length - 1].relativeAbundance) * 100) / 100;
  }

  return species;
}

function createCarbonPoolsForSimulation(simId: string, organicMatter: number): CarbonPool[] {
  const poolDefs: Array<{
    name: CarbonPoolName;
    initialRatio: number;
    decompRate: number;
    turnover: number;
  }> = [
    { name: '活性碳库', initialRatio: 0.12, decompRate: 0.08, turnover: 30 },
    { name: '慢性碳库', initialRatio: 0.35, decompRate: 0.015, turnover: 300 },
    { name: '惰性碳库', initialRatio: 0.25, decompRate: 0.001, turnover: 5000 },
    { name: '微生物生物量碳', initialRatio: 0.04, decompRate: 0.05, turnover: 60 },
    { name: 'DOC', initialRatio: 0.08, decompRate: 0.1, turnover: 15 },
    { name: 'POC', initialRatio: 0.16, decompRate: 0.02, turnover: 180 },
  ];

  return poolDefs.map((pd, i) => {
    const initial = organicMatter * 1000 * pd.initialRatio;
    return {
      id: `cp_${simId.slice(-6)}_${i + 1}`,
      poolName: pd.name,
      initialAmount: Math.round(initial * 100) / 100,
      currentAmount: Math.round(initial * (0.7 + Math.random() * 0.3) * 100) / 100,
      decompositionRate: pd.decompRate,
      turnoverTime: pd.turnover,
      simulationId: simId,
    };
  });
}

function createEnzymesForSimulation(simId: string): ExtracellularEnzyme[] {
  const enzymeDefs = [
    { name: 'β-葡萄糖苷酶', ec: '3.2.1.21', substrate: 'cellobiose', product: 'glucose', optPH: 5.5, optTemp: 30 },
    { name: '纤维二糖水解酶', ec: '3.2.1.91', substrate: 'cellulose', product: 'cellobiose', optPH: 5.0, optTemp: 28 },
    { name: 'β-木糖苷酶', ec: '3.2.1.37', substrate: 'xylobiose', product: 'xylose', optPH: 6.0, optTemp: 35 },
    { name: '几丁质酶', ec: '3.2.1.14', substrate: 'chitin', product: 'NAG', optPH: 5.8, optTemp: 32 },
    { name: '酸性磷酸酶', ec: '3.1.3.2', substrate: 'phytate', product: 'phosphate', optPH: 4.5, optTemp: 37 },
    { name: '亮氨酸氨基肽酶', ec: '3.4.11.1', substrate: 'peptide', product: 'amino_acid', optPH: 7.0, optTemp: 35 },
  ];

  return enzymeDefs.map((ed, i) => {
    const activity = 20 + Math.random() * 180;
    return {
      id: `enz_${simId.slice(-6)}_${i + 1}`,
      enzymeName: ed.name,
      ecNumber: ed.ec,
      substrate: ed.substrate,
      product: ed.product,
      activity: Math.round(activity * 100) / 100,
      km: Math.round((0.1 + Math.random() * 2) * 1000) / 1000,
      vmax: Math.round(activity * (2 + Math.random() * 3) * 100) / 100,
      optimalPH: ed.optPH,
      optimalTemp: ed.optTemp,
      encodingGenes: [`gene_${ed.ec.replace(/\./g, '_')}_${i + 1}a`, `gene_${ed.ec.replace(/\./g, '_')}_${i + 1}b`],
      simulationId: simId,
    };
  });
}

function createStatusHistory(
  finalStatus: SimulationStatus,
  operatorId: string
): SimulationStatusHistoryItem[] {
  const allStatuses: SimulationStatus[] = [
    'PENDING_VALIDATION',
    'NETWORK_BUILDING',
    'COMPONENT_INITIALIZING',
    'DECOMPOSITION_CALCULATING',
    'FLUX_ANALYZING',
    'COMPLETED',
    'EXCEPTION_FALLBACK',
  ];

  const finalIdx = allStatuses.indexOf(finalStatus);
  const history: SimulationStatusHistoryItem[] = [];
  const baseTime = dayjs().subtract(5, 'hour');

  for (let i = 0; i <= finalIdx; i++) {
    const status = allStatuses[i];
    const isLast = i === finalIdx;
    const duration = isLast ? undefined : 15 * 60 * 1000 + Math.random() * 45 * 60 * 1000;
    history.push({
      status,
      timestamp: baseTime.add(i * (i === 0 ? 0 : 30), 'minute').toISOString(),
      operatorId: i === 0 ? operatorId : undefined,
      remark:
        status === 'EXCEPTION_FALLBACK'
          ? '检测到异常波动，启动备用参数方案'
          : status === 'COMPLETED'
          ? '模拟计算完成'
          : undefined,
      durationMs: duration ? Math.round(duration) : undefined,
    });
  }

  return history;
}

function createDefaultParams(): SimulationParameters {
  return {
    simulationDays: 30,
    timeStepHours: 4,
    temperatureModel: 'DIURNAL',
    moistureModel: 'RAINFALL',
    co2BaselineUpper: 4.5,
    co2BaselineLower: 2.0,
    enzymeDropThreshold: 30,
    substrateAddition: [
      { type: '秸秆', amount: 5, day: 0 },
      { type: '有机肥', amount: 3, day: 7 },
    ],
    microbeInoculation: [
      { speciesId: 'mic_inoc_001', ratio: 0.05, day: 3 },
    ],
  };
}

function createApprovals(
  simId: string,
  users: User[],
  hasApproval: boolean,
  stage: 'both' | 'first' | 'second' = 'both'
): ApprovalRecord[] {
  if (!hasApproval) return [];

  const validators = users.filter((u) => u.role === 'MICROBE_VALIDATOR');
  const experts = users.filter((u) => u.role === 'SOIL_EXPERT');
  const approvals: ApprovalRecord[] = [];
  const baseTime = dayjs().subtract(2, 'day');

  if (stage === 'both' || stage === 'first') {
    const validator = pick(validators, simId.length);
    const result: ApprovalResult = Math.random() > 0.15 ? 'APPROVED' : 'REJECTED';
    approvals.push({
      id: `app_${simId.slice(-6)}_mv`,
      simulationId: simId,
      stage: 'MICROBE_VALIDATION' as ApprovalStage,
      result,
      approverId: validator.id,
      approverName: validator.fullName,
      approverRole: USER_ROLE_NAMES[validator.role],
      comment:
        result === 'APPROVED'
          ? '微生物群落组成合理，物种丰度分布符合预期，通过验证'
          : '检测到低丰度物种比例异常，建议复核测序数据质量',
      submittedAt: baseTime.toISOString(),
      decidedAt: baseTime.add(4, 'hour').toISOString(),
      attachments: result === 'REJECTED' ? ['seq_quality_report.pdf'] : undefined,
    });
  }

  if (stage === 'both' || stage === 'second') {
    const expert = pick(experts, simId.length + 1);
    const secondResult: ApprovalResult = stage === 'second' ? 'PENDING' : Math.random() > 0.1 ? 'APPROVED' : 'PENDING';
    approvals.push({
      id: `app_${simId.slice(-6)}_se`,
      simulationId: simId,
      stage: 'SOIL_HEALTH_EXPERT' as ApprovalStage,
      result: secondResult,
      approverId: expert.id,
      approverName: expert.fullName,
      approverRole: USER_ROLE_NAMES[expert.role],
      comment:
        secondResult === 'APPROVED'
          ? '碳库动态与酶活指标在合理区间，综合评估通过'
          : secondResult === 'PENDING'
          ? '待综合评估模拟结果与推荐方案'
          : undefined,
      submittedAt: baseTime.add(6, 'hour').toISOString(),
      decidedAt: secondResult !== 'PENDING' ? baseTime.add(12, 'hour').toISOString() : undefined,
    });
  }

  return approvals;
}

function createAdjustmentLogs(
  simId: string,
  users: User[],
  warnings: WarningEvent[]
): AdjustmentLog[] {
  if (warnings.length === 0) return [];

  const operators = users.filter(
    (u) => u.role === 'ECOLOGIST' || u.role === 'CHIEF_SCIENTIST'
  );
  const logs: AdjustmentLog[] = [];
  const adjTypes: AdjustmentType[] = ['PARAMETER_TWEAK', 'SUBSTRATE_ADD', 'INOCULUM_RATIO'];

  warnings.slice(0, Math.min(warnings.length, 2)).forEach((w, i) => {
    const op = pick(operators, i);
    const adjType = pick(adjTypes, i);
    logs.push({
      id: `adj_${simId.slice(-6)}_${i + 1}`,
      simulationId: simId,
      warningId: w.id,
      adjustmentType: adjType,
      beforeState: {
        [w.metricName]: w.baselineValue,
        timestamp: w.triggeredAt,
      },
      afterState: {
        [w.metricName]: w.actualValue,
        adjustment: adjType,
        timestamp: dayjs(w.triggeredAt).add(30, 'minute').toISOString(),
      },
      operatorId: op.id,
      operatorName: op.fullName,
      comment: `针对${w.title}，调整参数后重新模拟`,
      appliedAt: dayjs(w.triggeredAt).add(30, 'minute').toISOString(),
      reSimulationCount: i + 1,
    });
  });

  return logs;
}

export function createMockSimulations(
  users: User[],
  soilDataList: SoilPhysicochemicalData[]
): { simulations: SimulationTask[]; allWarnings: WarningEvent[] } {
  const allStatuses: SimulationStatus[] = [
    'PENDING_VALIDATION',
    'NETWORK_BUILDING',
    'COMPONENT_INITIALIZING',
    'DECOMPOSITION_CALCULATING',
    'FLUX_ANALYZING',
    'COMPLETED',
    'EXCEPTION_FALLBACK',
  ];

  const creators = users.filter(
    (u) => u.role === 'ECOLOGIST' || u.role === 'FARM_ADMIN' || u.role === 'CHIEF_SCIENTIST'
  );

  const simNames = [
    '东北黑土玉米秸秆还田碳动态模拟',
    '红壤水稻有机肥配施微生物响应',
    '黄壤茶园保护性耕作固碳潜力评估',
    '褐土农田生物炭改良剂长期效应',
    '潮土小麦-玉米轮作体系碳周转',
    '水稻土绿肥翻压微生物群落演替',
    '黑土长期定位试验酶活季节变化',
    '红壤旱地接种解磷菌效果验证',
    '黄壤坡耕地水土流失区碳修复',
    '褐土菜地氮肥减施微生物缓冲机制',
    '潮土盐碱地改良剂协同效应',
    '水稻土稻虾共作模式碳汇评估',
  ];

  const simulations: SimulationTask[] = [];
  const allWarnings: WarningEvent[] = [];

  const warningSimulationIndices = new Set([4, 6, 10]);
  const approvalSimulationIndices = new Set([1, 5]);

  for (let i = 0; i < 12; i++) {
    const id = `sim_${dayjs().format('YYYYMM')}_${String(i + 1).padStart(4, '0')}`;
    const status = i < 7 ? allStatuses[i] : pick(allStatuses, i + 3);
    const soilData = pick(soilDataList, i);
    const creator = pick(creators, i);
    const hasWarnings = warningSimulationIndices.has(i);
    const hasApprovals = approvalSimulationIndices.has(i);

    const microbes = createMicrobesForSimulation(id, 8 + (i % 4));
    const carbonPools = createCarbonPoolsForSimulation(id, soilData.organicMatter);
    const enzymes = createEnzymesForSimulation(id);
    const params = createDefaultParams();
    const network = buildMetabolicNetwork(microbes, enzymes, id);

    const { timeSeries, generatedWarnings } = generateTimeSeries(
      params,
      soilData,
      microbes,
      enzymes,
      carbonPools,
      1000 + i * 137
    );

    let warnings: WarningEvent[] = [];
    if (hasWarnings) {
      warnings = generatedWarnings.slice(0, Math.min(generatedWarnings.length, 4 + (i % 3))).map((w) => ({
        ...w,
        simulationId: id,
      }));
      allWarnings.push(...warnings);
    }

    const approvals = hasApprovals
      ? createApprovals(id, users, true, i === 5 ? 'second' : 'both')
      : [];

    const adjustmentLogs = createAdjustmentLogs(id, users, warnings);

    const progressMap: Record<SimulationStatus, number> = {
      PENDING_VALIDATION: 5,
      NETWORK_BUILDING: 20,
      COMPONENT_INITIALIZING: 40,
      DECOMPOSITION_CALCULATING: 65,
      FLUX_ANALYZING: 85,
      COMPLETED: 100,
      EXCEPTION_FALLBACK: 100,
    };

    simulations.push({
      id,
      taskNo: `TASK-${dayjs().format('YYYYMMDD')}-${String(i + 1).padStart(3, '0')}`,
      name: simNames[i],
      soilDataId: soilData.id,
      metagenomicsFileId: i % 3 === 0 ? `mg_${String(i + 1).padStart(3, '0')}` : undefined,
      status,
      statusHistory: createStatusHistory(status, creator.id),
      parameters: params,
      currentProgress: progressMap[status],
      microbes,
      carbonPools,
      enzymes,
      network: status !== 'PENDING_VALIDATION' ? network : undefined,
      timeSeriesData: status !== 'PENDING_VALIDATION' && status !== 'NETWORK_BUILDING' ? timeSeries : [],
      warnings,
      adjustmentLogs,
      approvals,
      reportId: status === 'COMPLETED' ? `rpt_${id.slice(-8)}` : undefined,
      farmPushedAt: status === 'COMPLETED' && i % 4 === 0 ? dayjs().subtract(1, 'day').toISOString() : undefined,
      createdAt: dayjs().subtract(3 + i, 'day').subtract(i * 2, 'hour').toISOString(),
      createdBy: creator.id,
      soilId: soilData.id,
    });
  }

  return { simulations, allWarnings };
}

export function createMockRecommendations(
  soilDataList: SoilPhysicochemicalData[],
  simulations: SimulationTask[]
): Recommendation[] {
  const tillageMethods: Array<'免耕' | '少耕' | '深松' | '翻耕' | '旋耕'> = [
    '免耕',
    '少耕',
    '深松',
    '翻耕',
    '旋耕',
    '免耕',
  ];

  const amendmentsPool = [
    { name: '秸秆还田', unit: 't/ha' },
    { name: '有机肥', unit: 't/ha' },
    { name: '生物炭', unit: 't/ha' },
    { name: '绿肥', unit: 't/ha' },
    { name: '石灰', unit: 'kg/ha' },
    { name: '腐殖酸', unit: 'kg/ha' },
  ];

  const cropRotations = [
    ['玉米', '大豆', '小麦'],
    ['水稻', '紫云英', '油菜'],
    ['小麦', '夏玉米', '冬闲覆盖'],
    ['茶园间作大豆', '茶园清耕'],
    ['蔬菜-水稻轮作', '稻-菜-紫云英'],
  ];

  const completedSimIds = simulations
    .filter((s) => s.status === 'COMPLETED')
    .map((s) => s.id);

  return soilDataList.slice(0, 6).map((soil, i) => {
    const evidenceCount = 1 + (i % 3);
    const evidence = completedSimIds.slice(i, i + evidenceCount);
    const amendmentCount = 2 + (i % 3);
    const amendmentMix = amendmentsPool.slice(i, i + amendmentCount).map((a, j) => ({
      name: a.name,
      ratio: Math.round((1.5 + Math.random() * 5 + j * 2) * 10) / 10,
      unit: a.unit,
    }));

    const carbonSeq = Math.round((2.5 + Math.random() * 6 + i * 0.3) * 100) / 100;
    const estimatedCost = Math.round((800 + Math.random() * 2500 + amendmentCount * 300) * 100) / 100;

    return {
      id: `rec_${soil.id.slice(-6)}_${i + 1}`,
      soilId: soil.id,
      soilType: soil.soilType,
      amendmentMix,
      tillageMethod: pick(tillageMethods, i),
      cropRotation: i % 2 === 0 ? pick(cropRotations, i) : undefined,
      estimatedCarbonSequestration: carbonSeq,
      estimatedCost,
      evidenceSimulations: evidence.length > 0 ? evidence : completedSimIds.slice(0, 2),
      confidenceScore: Math.round((0.65 + Math.random() * 0.3) * 100) / 100,
      createdAt: dayjs().subtract(i + 1, 'day').toISOString(),
    };
  });
}

export function createMockDashboardStats(
  simulations: SimulationTask[],
  warnings: WarningEvent[],
  approvals: ApprovalRecord[]
): DailyDashboardStats[] {
  const days = 7;
  const stats: DailyDashboardStats[] = [];

  const radarDimensions = ['C循环', 'N循环', 'P循环', 'S循环', '胁迫耐受', '生长速率'];

  for (let d = days - 1; d >= 0; d--) {
    const dayStr = dayjs().subtract(d, 'day').format('YYYY-MM-DD');
    const dayFactor = 1 - d * 0.05;
    const total = 10 + Math.floor(Math.random() * 6 + (days - d) * 2);
    const completed = Math.floor(total * (0.55 + Math.random() * 0.35));
    const failed = Math.floor(total * (0.03 + Math.random() * 0.08));
    const warningCount = 2 + Math.floor(Math.random() * 8 + (days - d));
    const critical = Math.floor(warningCount * (0.1 + Math.random() * 0.2));
    const pendingApprovals = approvals.filter((a) => a.result === 'PENDING').length + Math.floor(Math.random() * 3);

    const radar = radarDimensions.map((dim) => ({
      dimension: dim,
      value: Math.round((0.5 + Math.random() * 0.45 + dayFactor * 0.05) * 100) / 100,
    }));

    const suspendedIds = d % 3 === 0
      ? simulations
          .filter((s) => s.status === 'EXCEPTION_FALLBACK')
          .slice(0, 2)
          .map((s) => s.soilId || s.soilDataId)
      : [];

    stats.push({
      date: dayStr,
      totalSimulations: total,
      completedSimulations: completed,
      completionRate: Math.round((completed / total) * 1000) / 10,
      failedSimulations: failed,
      warningCount,
      criticalWarningCount: critical,
      avgWarningResponseMinutes: Math.round(15 + Math.random() * 45 - d * 2),
      totalCarbonGainKg: Math.round((200 + Math.random() * 600 + (days - d) * 80) * 10) / 10,
      pendingApprovals,
      suspendedSoils: suspendedIds.filter((v, idx, arr) => arr.indexOf(v) === idx),
      functionalRedundancyRadar: radar,
    });
  }

  return stats;
}

export interface MockDataBundle {
  users: User[];
  soilData: SoilPhysicochemicalData[];
  simulations: SimulationTask[];
  warnings: WarningEvent[];
  recommendations: Recommendation[];
  dashboardStats: DailyDashboardStats[];
}

export function createAllMockData(): MockDataBundle {
  const users = createMockUsers();
  const soilData = createMockSoilData(users);
  const { simulations, allWarnings } = createMockSimulations(users, soilData);
  const approvalsFromSims = simulations.flatMap((s) => s.approvals);
  const recommendations = createMockRecommendations(soilData, simulations);
  const dashboardStats = createMockDashboardStats(simulations, allWarnings, approvalsFromSims);

  return {
    users,
    soilData,
    simulations,
    warnings: allWarnings,
    recommendations,
    dashboardStats,
  };
}

export const MockDataFactory = {
  createUsers: createMockUsers,
  createSoilData: createMockSoilData,
  createSimulations: createMockSimulations,
  createRecommendations: createMockRecommendations,
  createDashboardStats: createMockDashboardStats,
  createAll: createAllMockData,
};
