import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  SimulationTask,
  SimulationParameters,
  MicrobeSpecies,
  CarbonPool,
  ExtracellularEnzyme,
  ApprovalRecord,
  CarbonPoolName,
} from '@shared/types';

export type { SimulationTask } from '@shared/types';

export type LegacySimulationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface SimulationParams {
  temperature: number;
  humidity: number;
  ph: number;
  oxygenLevel: number;
  carbonSource: string;
  nitrogenSource: string;
  duration: number;
  strainType: string;
  initialConcentration: number;
}

export interface SimulationResult {
  finalBiomass: number;
  growthRate: number;
  metaboliteProduction: number;
  phChange: number;
  oxygenConsumption: number;
  durationHours: number;
  dataPoints: { time: number; biomass: number; ph: number; oxygen: number }[];
}

export interface LegacySimulationTask {
  id: string;
  name: string;
  description?: string;
  status: LegacySimulationStatus;
  params: SimulationParams;
  result?: SimulationResult;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
  approvalFirstId?: string;
  approvalSecondId?: string;
}

interface SimulationStore {
  tasks: (SimulationTask | LegacySimulationTask)[];
  currentTask: SimulationTask | LegacySimulationTask | null;
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => SimulationTask | LegacySimulationTask | undefined;
  createTask: (data: {
    soilData: {
      sampleId: string;
      ph: number;
      organicMatter: number;
      temperature: number;
      moisture: number;
      soilType: string;
      notes?: string;
    };
    metagenomicsFileId: string;
    fileName?: string;
    name?: string;
    createdBy: string;
    createdByName?: string;
    parameters?: Partial<SimulationParameters>;
  }) => SimulationTask;
  updateTask: (id: string, updates: Partial<SimulationTask | LegacySimulationTask>) => void;
  deleteTask: (id: string) => void;
  setCurrentTask: (task: SimulationTask | LegacySimulationTask | null) => void;
  fetchDetail: (id: string) => Promise<SimulationTask | LegacySimulationTask | null>;

  submitForApproval: (id: string) => void;
  startSimulation: (id: string) => Promise<void>;
  cancelSimulation: (id: string) => void;
  resetSimulation: (id: string) => void;

  filterByStatus: (status: LegacySimulationStatus | LegacySimulationStatus[]) => (SimulationTask | LegacySimulationTask)[];
  getStats: () => {
    total: number;
    draft: number;
    running: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

const defaultParams: SimulationParams = {
  temperature: 37,
  humidity: 85,
  ph: 7.2,
  oxygenLevel: 21,
  carbonSource: '葡萄糖',
  nitrogenSource: '蛋白胨',
  duration: 72,
  strainType: '大肠杆菌',
  initialConcentration: 0.5,
};

const defaultNewParams: SimulationParameters = {
  simulationDays: 30,
  timeStepHours: 4,
  temperatureModel: 'CONSTANT',
  moistureModel: 'CONSTANT',
  co2BaselineUpper: 420,
  co2BaselineLower: 380,
  enzymeDropThreshold: 30,
};

const generateMockResult = (params: SimulationParams): SimulationResult => {
  const dataPoints: { time: number; biomass: number; ph: number; oxygen: number }[] = [];
  const hours = params.duration;
  for (let i = 0; i <= hours; i += Math.max(1, Math.floor(hours / 50))) {
    const t = i / hours;
    const biomass = params.initialConcentration * (1 + 5 * (1 - Math.exp(-4 * t)));
    const ph = params.ph - 0.8 * t + 0.3 * Math.sin(t * Math.PI);
    const oxygen = params.oxygenLevel * (1 - 0.4 * (1 - Math.exp(-3 * t)));
    dataPoints.push({ time: i, biomass: +biomass.toFixed(3), ph: +ph.toFixed(2), oxygen: +oxygen.toFixed(1) });
  }
  const lastPoint = dataPoints[dataPoints.length - 1];
  return {
    finalBiomass: +lastPoint.biomass.toFixed(3),
    growthRate: +((lastPoint.biomass - params.initialConcentration) / hours).toFixed(4),
    metaboliteProduction: +(lastPoint.biomass * 0.65).toFixed(3),
    phChange: +(params.ph - lastPoint.ph).toFixed(2),
    oxygenConsumption: +(params.oxygenLevel - lastPoint.oxygen).toFixed(1),
    durationHours: hours,
    dataPoints,
  };
};

const initialMockTasks: LegacySimulationTask[] = [
  {
    id: 'sim-001',
    name: '高温条件下枯草芽孢杆菌生长模拟',
    description: '测试45℃高温对枯草芽孢杆菌生长速率的影响',
    status: 'completed',
    params: { ...defaultParams, temperature: 45, strainType: '枯草芽孢杆菌', duration: 48 },
    result: generateMockResult({ ...defaultParams, temperature: 45, strainType: '枯草芽孢杆菌', duration: 48 }),
    createdBy: 'u-002',
    createdByName: '张审核',
    createdAt: '2024-05-20T09:00:00Z',
    updatedAt: '2024-05-21T10:30:00Z',
    startedAt: '2024-05-20T10:00:00Z',
    completedAt: '2024-05-21T10:30:00Z',
    progress: 100,
    priority: 'high',
    tags: ['高温', '枯草芽孢杆菌', '生长速率'],
  },
  {
    id: 'sim-002',
    name: '不同pH值对大肠杆菌代谢的影响',
    description: '梯度pH条件下大肠杆菌代谢产物分析',
    status: 'running',
    params: { ...defaultParams, ph: 6.5, duration: 36 },
    createdBy: 'u-003',
    createdByName: '李操作',
    createdAt: '2024-06-05T14:00:00Z',
    updatedAt: '2024-06-06T02:00:00Z',
    startedAt: '2024-06-05T15:00:00Z',
    progress: 62,
    priority: 'medium',
    tags: ['pH', '大肠杆菌', '代谢'],
  },
  {
    id: 'sim-003',
    name: '氮源优化实验 - 酵母提取物 vs 蛋白胨',
    description: '对比不同氮源对菌体生物量的影响',
    status: 'pending_approval',
    params: { ...defaultParams, nitrogenSource: '酵母提取物', duration: 60 },
    createdBy: 'u-003',
    createdByName: '李操作',
    createdAt: '2024-06-08T10:15:00Z',
    updatedAt: '2024-06-08T10:15:00Z',
    progress: 0,
    priority: 'medium',
    tags: ['氮源', '优化'],
  },
  {
    id: 'sim-004',
    name: '低氧环境酵母菌发酵模拟',
    description: '模拟微氧条件下酵母菌乙醇发酵过程',
    status: 'draft',
    params: { ...defaultParams, oxygenLevel: 5, strainType: '酿酒酵母', carbonSource: '蔗糖', duration: 96 },
    createdBy: 'u-003',
    createdByName: '李操作',
    createdAt: '2024-06-09T08:30:00Z',
    updatedAt: '2024-06-09T09:00:00Z',
    progress: 0,
    priority: 'low',
    tags: ['酵母菌', '发酵', '低氧'],
  },
  {
    id: 'sim-005',
    name: '青霉素发酵过程参数优化',
    description: '产黄青霉青霉素合成最优条件探索',
    status: 'approved',
    params: { ...defaultParams, strainType: '产黄青霉', temperature: 25, ph: 6.8, duration: 120 },
    createdBy: 'u-002',
    createdByName: '张审核',
    createdAt: '2024-06-07T16:00:00Z',
    updatedAt: '2024-06-08T11:00:00Z',
    progress: 0,
    priority: 'high',
    tags: ['青霉素', '发酵', '优化'],
  },
  {
    id: 'sim-006',
    name: '乳酸菌高密度培养模拟',
    description: '分批补料策略下乳酸菌高密度培养',
    status: 'failed',
    params: { ...defaultParams, strainType: '乳酸菌', temperature: 42, ph: 5.5, duration: 24 },
    createdBy: 'u-003',
    createdByName: '李操作',
    createdAt: '2024-06-03T11:00:00Z',
    updatedAt: '2024-06-03T13:20:00Z',
    startedAt: '2024-06-03T11:30:00Z',
    completedAt: '2024-06-03T13:20:00Z',
    progress: 35,
    priority: 'high',
    tags: ['乳酸菌', '高密度培养', '失败案例'],
    notes: 'pH骤降导致菌体自溶，需优化缓冲体系',
  },
];

const DEFAULT_MICROBES: Omit<MicrobeSpecies, 'id' | 'simulationId'>[] = [
  {
    taxId: 'txid28901',
    name: 'Pseudomonas putida',
    kingdom: 'Bacteria',
    phylum: 'Proteobacteria',
    class: 'Gammaproteobacteria',
    order: 'Pseudomonadales',
    family: 'Pseudomonadaceae',
    genus: 'Pseudomonas',
    species: 'Pseudomonas putida',
    relativeAbundance: 0.28,
    functions: ['芳香族化合物降解', '铁载体分泌', '根际促生'],
  },
  {
    taxId: 'txid135621',
    name: 'Rhizobium leguminosarum',
    kingdom: 'Bacteria',
    phylum: 'Proteobacteria',
    class: 'Alphaproteobacteria',
    order: 'Hyphomicrobiales',
    family: 'Rhizobiaceae',
    genus: 'Rhizobium',
    species: 'Rhizobium leguminosarum',
    relativeAbundance: 0.22,
    functions: ['生物固氮', '结瘤因子合成', '植物激素调节'],
  },
  {
    taxId: 'txid546',
    name: 'Bacillus subtilis',
    kingdom: 'Bacteria',
    phylum: 'Firmicutes',
    class: 'Bacilli',
    order: 'Bacillales',
    family: 'Bacillaceae',
    genus: 'Bacillus',
    species: 'Bacillus subtilis',
    relativeAbundance: 0.18,
    functions: ['抗生素合成', '有机质分解', '生物膜形成'],
  },
  {
    taxId: 'txid1280',
    name: 'Streptomyces coelicolor',
    kingdom: 'Bacteria',
    phylum: 'Actinobacteria',
    class: 'Actinomycetes',
    order: 'Streptomycetales',
    family: 'Streptomycetaceae',
    genus: 'Streptomyces',
    species: 'Streptomyces coelicolor',
    relativeAbundance: 0.15,
    functions: ['放线菌酮合成', '几丁质降解', '纤维素分解'],
  },
  {
    taxId: 'txid2678',
    name: 'Aspergillus niger',
    kingdom: 'Fungi',
    phylum: 'Ascomycota',
    class: 'Eurotiomycetes',
    order: 'Eurotiales',
    family: 'Aspergillaceae',
    genus: 'Aspergillus',
    species: 'Aspergillus niger',
    relativeAbundance: 0.10,
    functions: ['果胶酶分泌', '有机酸生成', '多糖分解'],
  },
];

const DEFAULT_CARBON_POOLS: Omit<CarbonPool, 'id' | 'simulationId'>[] = [
  { poolName: '活性碳库', initialAmount: 420, currentAmount: 420, decompositionRate: 0.025, turnoverTime: 40 },
  { poolName: '慢性碳库', initialAmount: 2800, currentAmount: 2800, decompositionRate: 0.0035, turnoverTime: 286 },
  { poolName: '惰性碳库', initialAmount: 11200, currentAmount: 11200, decompositionRate: 0.00012, turnoverTime: 22800 },
  { poolName: '微生物生物量碳', initialAmount: 180, currentAmount: 180, decompositionRate: 0.018, turnoverTime: 56 },
  { poolName: 'DOC', initialAmount: 58, currentAmount: 58, decompositionRate: 0.04, turnoverTime: 25 },
  { poolName: 'POC', initialAmount: 210, currentAmount: 210, decompositionRate: 0.012, turnoverTime: 83 },
];

const DEFAULT_ENZYMES: Omit<ExtracellularEnzyme, 'id' | 'simulationId'>[] = [
  { enzymeName: 'β-葡萄糖苷酶', ecNumber: '3.2.1.21', substrate: '纤维二糖', product: '葡萄糖', activity: 4.2, km: 0.8, vmax: 8.5, optimalPH: 5.5, optimalTemp: 35, encodingGenes: ['bgl1', 'bgl4'] },
  { enzymeName: '几丁质酶', ecNumber: '3.2.1.14', substrate: '几丁质', product: 'N-乙酰氨基葡萄糖', activity: 2.8, km: 1.2, vmax: 6.3, optimalPH: 6.2, optimalTemp: 30, encodingGenes: ['chiA', 'chiC'] },
  { enzymeName: '蛋白酶', ecNumber: '3.4.21.-', substrate: '蛋白质肽键', product: '氨基酸/寡肽', activity: 3.6, km: 0.5, vmax: 9.1, optimalPH: 7.0, optimalTemp: 37, encodingGenes: ['serP1', 'metP'] },
  { enzymeName: '酸性磷酸酶', ecNumber: '3.1.3.2', substrate: '有机磷单酯', product: '磷酸根', activity: 5.1, km: 0.3, vmax: 11.8, optimalPH: 5.2, optimalTemp: 33, encodingGenes: ['phoA', 'phoD'] },
  { enzymeName: '脲酶', ecNumber: '3.5.1.5', substrate: '尿素', product: '氨+CO2', activity: 3.9, km: 0.7, vmax: 8.2, optimalPH: 6.8, optimalTemp: 38, encodingGenes: ['ureA', 'ureC'] },
  { enzymeName: '木质素过氧化物酶', ecNumber: '1.11.1.14', substrate: '木质素单体', product: '自由基中间体', activity: 1.4, km: 0.9, vmax: 3.2, optimalPH: 4.8, optimalTemp: 28, encodingGenes: ['lipA', 'lipH'] },
  { enzymeName: '脱氢酶', ecNumber: '1.1.1.-', substrate: '呼吸链底物', product: '还原当量', activity: 2.2, km: 0.6, vmax: 5.4, optimalPH: 7.2, optimalTemp: 35, encodingGenes: ['sdhA', 'mdh1'] },
  { enzymeName: '纤维素酶', ecNumber: '3.2.1.4', substrate: '纤维素', product: '纤维寡糖', activity: 3.1, km: 1.5, vmax: 7.6, optimalPH: 5.8, optimalTemp: 32, encodingGenes: ['celA', 'celE'] },
];

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      tasks: initialMockTasks,
      currentTask: null,
      loading: false,
      error: null,

      fetchTasks: async () => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ loading: false });
      },

      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id);
      },

      createTask: (data) => {
        const now = new Date().toISOString();
        const id = `sim-${uuidv4().slice(0, 8)}`;
        const taskNo = `SS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const dateStr = dayjs(now).format('YYYYMMDD');
        const taskName = data.name || `${data.soilData.sampleId}-${dateStr}`;

        const parameters: SimulationParameters = {
          ...defaultNewParams,
          ...data.parameters,
        };

        const microbes: MicrobeSpecies[] = DEFAULT_MICROBES.map((m) => ({
          id: `mic-${uuidv4().slice(0, 8)}`,
          simulationId: id,
          ...m,
        }));

        const carbonPoolNames: CarbonPoolName[] = ['活性碳库', '慢性碳库', '惰性碳库', '微生物生物量碳', 'DOC', 'POC'];
        const carbonPools: CarbonPool[] = DEFAULT_CARBON_POOLS.map((p, idx) => ({
          id: `cpl-${uuidv4().slice(0, 8)}`,
          poolName: carbonPoolNames[idx] || p.poolName,
          simulationId: id,
          initialAmount: p.initialAmount + (Math.random() - 0.5) * p.initialAmount * 0.1,
          currentAmount: p.currentAmount + (Math.random() - 0.5) * p.currentAmount * 0.1,
          decompositionRate: p.decompositionRate,
          turnoverTime: p.turnoverTime,
        }));

        const enzymes: ExtracellularEnzyme[] = DEFAULT_ENZYMES.map((e) => ({
          id: `enz-${uuidv4().slice(0, 8)}`,
          simulationId: id,
          ...e,
          activity: e.activity * (0.85 + Math.random() * 0.3),
        }));

        const approvals: ApprovalRecord[] = [
          {
            id: `apv-${uuidv4().slice(0, 8)}`,
            simulationId: id,
            stage: 'MICROBE_VALIDATION',
            result: 'PENDING',
            approverId: 'u-microbe',
            approverName: '刘验证',
            approverRole: 'MICROBE_VALIDATOR',
            submittedAt: now,
          },
          {
            id: `apv-${uuidv4().slice(0, 8)}`,
            simulationId: id,
            stage: 'SOIL_HEALTH_EXPERT',
            result: 'PENDING',
            approverId: 'u-soil',
            approverName: '赵土壤',
            approverRole: 'SOIL_EXPERT',
            submittedAt: now,
          },
        ];

        const newTask: SimulationTask = {
          id,
          taskNo,
          name: taskName,
          soilDataId: `soil-${uuidv4().slice(0, 8)}`,
          metagenomicsFileId: data.metagenomicsFileId,
          status: 'PENDING_VALIDATION',
          statusHistory: [
            {
              status: 'PENDING_VALIDATION',
              timestamp: now,
              operatorId: data.createdBy,
              remark: '任务创建，等待双级审批',
            },
          ],
          parameters,
          currentProgress: 0,
          microbes,
          carbonPools,
          enzymes,
          timeSeriesData: [],
          warnings: [],
          adjustmentLogs: [],
          approvals,
          createdAt: now,
          createdBy: data.createdBy,
        };

        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      updateTask: (id: string, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } as SimulationTask | LegacySimulationTask : t
          ),
        }));
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          currentTask: state.currentTask?.id === id ? null : state.currentTask,
        }));
      },

      setCurrentTask: (task) => {
        set({ currentTask: task });
      },

      fetchDetail: async (id: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));
        const task = get().tasks.find((t) => t.id === id) || null;
        set({ currentTask: task, loading: false });
        return task;
      },

      submitForApproval: (id: string) => {
        get().updateTask(id, { status: 'pending_approval' as LegacySimulationStatus });
      },

      startSimulation: async (id: string) => {
        const task = get().getTaskById(id);
        if (!task) return;
        const isLegacy = 'params' in task;
        if (!isLegacy || (task.status !== 'approved' && task.status !== 'draft')) return;

        get().updateTask(id, {
          status: 'running',
          startedAt: new Date().toISOString(),
          progress: 0,
        } as Partial<LegacySimulationTask>);

        const totalDuration = 3000;
        const interval = 100;
        const steps = totalDuration / interval;
        let step = 0;

        const timer = setInterval(() => {
          step++;
          const current = get().getTaskById(id);
          if (!current || ('params' in current && current.status !== 'running')) {
            clearInterval(timer);
            return;
          }

          const progress = Math.min(100, Math.round((step / steps) * 100));

          if (progress >= 100) {
            clearInterval(timer);
            const shouldFail = Math.random() < 0.08;
            if (shouldFail) {
              get().updateTask(id, {
                status: 'failed',
                progress: Math.floor(Math.random() * 40) + 30,
                completedAt: new Date().toISOString(),
                notes: '模拟过程异常终止，请检查参数设置',
              } as Partial<LegacySimulationTask>);
            } else {
              const leg = current as LegacySimulationTask;
              get().updateTask(id, {
                status: 'completed',
                progress: 100,
                completedAt: new Date().toISOString(),
                result: generateMockResult(leg.params),
              } as Partial<LegacySimulationTask>);
            }
          } else {
            get().updateTask(id, { progress });
          }
        }, interval);
      },

      cancelSimulation: (id: string) => {
        const task = get().getTaskById(id);
        if (!task) return;
        const isLegacy = 'params' in task;
        const updates: Partial<LegacySimulationTask> = { status: 'cancelled' };
        if (isLegacy && task.status === 'running') {
          updates.completedAt = new Date().toISOString();
        }
        get().updateTask(id, updates);
      },

      resetSimulation: (id: string) => {
        get().updateTask(id, {
          status: 'draft',
          progress: 0,
          startedAt: undefined,
          completedAt: undefined,
          result: undefined,
        } as Partial<LegacySimulationTask>);
      },

      filterByStatus: (status) => {
        const statuses = Array.isArray(status) ? status : [status];
        return get().tasks.filter((t) => {
          const isLegacy = 'params' in t;
          return isLegacy && statuses.includes(t.status as LegacySimulationStatus);
        });
      },

      getStats: () => {
        const { tasks } = get();
        return {
          total: tasks.length,
          draft: tasks.filter((t) => 'params' in t && t.status === 'draft').length,
          running: tasks.filter((t) => 'params' in t && t.status === 'running').length,
          completed: tasks.filter((t) => 'params' in t && t.status === 'completed').length,
          failed: tasks.filter((t) => 'params' in t && t.status === 'failed').length,
          pending: tasks.filter((t) => 'params' in t && t.status === 'pending_approval').length,
        };
      },
    }),
    {
      name: 'simulation-storage',
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

export const SIMULATION_STATUS_LABELS: Record<LegacySimulationStatus, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  running: '运行中',
  completed: '已完成',
  failed: '已失败',
  cancelled: '已取消',
};

export const SIMULATION_STATUS_COLORS: Record<LegacySimulationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  running: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const SIMULATION_STATUS_DOT_COLORS: Record<LegacySimulationStatus, string> = {
  draft: 'bg-gray-400',
  pending_approval: 'bg-yellow-400',
  approved: 'bg-blue-400',
  running: 'bg-green-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
  cancelled: 'bg-slate-400',
};

export const PRIORITY_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export const PRIORITY_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-orange-100 text-orange-600',
  high: 'bg-red-100 text-red-600',
};
