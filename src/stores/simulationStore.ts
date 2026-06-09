import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export type SimulationStatus =
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

export interface SimulationTask {
  id: string;
  name: string;
  description?: string;
  status: SimulationStatus;
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
  tasks: SimulationTask[];
  currentTask: SimulationTask | null;
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => SimulationTask | undefined;
  createTask: (data: Omit<SimulationTask, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'progress'> & { status?: SimulationStatus }) => SimulationTask;
  updateTask: (id: string, updates: Partial<SimulationTask>) => void;
  deleteTask: (id: string) => void;
  setCurrentTask: (task: SimulationTask | null) => void;
  fetchDetail: (id: string) => Promise<SimulationTask | null>;

  submitForApproval: (id: string) => void;
  startSimulation: (id: string) => Promise<void>;
  cancelSimulation: (id: string) => void;
  resetSimulation: (id: string) => void;

  filterByStatus: (status: SimulationStatus | SimulationStatus[]) => SimulationTask[];
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

const initialMockTasks: SimulationTask[] = [
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
        const newTask: SimulationTask = {
          id: `sim-${uuidv4().slice(0, 8)}`,
          status: 'draft',
          progress: 0,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      updateTask: (id: string, updates: Partial<SimulationTask>) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          currentTask: state.currentTask?.id === id ? null : state.currentTask,
        }));
      },

      setCurrentTask: (task: SimulationTask | null) => {
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
        get().updateTask(id, { status: 'pending_approval' });
      },

      startSimulation: async (id: string) => {
        const task = get().getTaskById(id);
        if (!task || (task.status !== 'approved' && task.status !== 'draft')) return;

        get().updateTask(id, {
          status: 'running',
          startedAt: new Date().toISOString(),
          progress: 0,
        });

        const totalDuration = 3000;
        const interval = 100;
        const steps = totalDuration / interval;
        let step = 0;

        const timer = setInterval(() => {
          step++;
          const current = get().getTaskById(id);
          if (!current || current.status !== 'running') {
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
              });
            } else {
              get().updateTask(id, {
                status: 'completed',
                progress: 100,
                completedAt: new Date().toISOString(),
                result: generateMockResult(current.params),
              });
            }
          } else {
            get().updateTask(id, { progress });
          }
        }, interval);
      },

      cancelSimulation: (id: string) => {
        const task = get().getTaskById(id);
        if (!task) return;
        const updates: Partial<SimulationTask> = { status: 'cancelled' };
        if (task.status === 'running') {
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
        });
      },

      filterByStatus: (status: SimulationStatus | SimulationStatus[]) => {
        const statuses = Array.isArray(status) ? status : [status];
        return get().tasks.filter((t) => statuses.includes(t.status));
      },

      getStats: () => {
        const { tasks } = get();
        return {
          total: tasks.length,
          draft: tasks.filter((t) => t.status === 'draft').length,
          running: tasks.filter((t) => t.status === 'running').length,
          completed: tasks.filter((t) => t.status === 'completed').length,
          failed: tasks.filter((t) => t.status === 'failed').length,
          pending: tasks.filter((t) => t.status === 'pending_approval').length,
        };
      },
    }),
    {
      name: 'simulation-storage',
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

export const SIMULATION_STATUS_LABELS: Record<SimulationStatus, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  running: '运行中',
  completed: '已完成',
  failed: '已失败',
  cancelled: '已取消',
};

export const SIMULATION_STATUS_COLORS: Record<SimulationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  running: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const SIMULATION_STATUS_DOT_COLORS: Record<SimulationStatus, string> = {
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
