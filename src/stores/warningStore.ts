import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export type WarningLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type WarningStatus = 'pending' | 'acknowledged' | 'processing' | 'resolved' | 'ignored';

export type WarningCategory =
  | 'parameter_anomaly'
  | 'simulation_error'
  | 'system_alert'
  | 'data_threshold'
  | 'approval_timeout'
  | 'resource_warning';

export interface WarningEvent {
  id: string;
  title: string;
  message: string;
  level: WarningLevel;
  category: WarningCategory;
  status: WarningStatus;
  relatedSimulationId?: string;
  relatedSimulationName?: string;
  source: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionNote?: string;
  processingBy?: string;
  processingByName?: string;
  processingStartedAt?: string;
  metadata?: Record<string, unknown>;
}

interface WarningStore {
  warnings: WarningEvent[];

  fetchWarnings: () => Promise<void>;
  addWarning: (data: Omit<WarningEvent, 'id' | 'status' | 'triggeredAt'> & { status?: WarningStatus }) => WarningEvent;
  acknowledgeWarning: (id: string, userId: string, userName: string) => void;
  startProcessing: (id: string, userId: string, userName: string) => void;
  resolveWarning: (id: string, userId: string, userName: string, note: string) => void;
  ignoreWarning: (id: string, userId: string, userName: string) => void;
  batchAcknowledge: (ids: string[], userId: string, userName: string) => void;
  batchResolve: (ids: string[], userId: string, userName: string, note: string) => void;
  deleteWarning: (id: string) => void;
  clearResolved: () => void;

  getPendingCount: () => number;
  getUnacknowledgedCount: () => number;
  getByLevel: (level: WarningLevel) => WarningEvent[];
  getByStatus: (status: WarningStatus) => WarningEvent[];
  getBySimulation: (simulationId: string) => WarningEvent[];
  getStats: () => {
    total: number;
    pending: number;
    processing: number;
    acknowledged: number;
    resolved: number;
    critical: number;
    high: number;
  };
}

const now = dayjs();
const initialMockWarnings: WarningEvent[] = [
  {
    id: 'w-001',
    title: 'pH值异常偏离',
    message: '模拟任务 sim-002 中pH值偏离正常范围，当前值5.8，阈值下限6.0',
    level: 'high',
    category: 'parameter_anomaly',
    status: 'pending',
    relatedSimulationId: 'sim-002',
    relatedSimulationName: '不同pH值对大肠杆菌代谢的影响',
    source: '参数监控模块',
    triggeredAt: now.subtract(15, 'minute').toISOString(),
  },
  {
    id: 'w-002',
    title: '模拟执行超时警告',
    message: '模拟任务 sim-002 预计时长36小时，当前进度62%，可能存在性能瓶颈',
    level: 'medium',
    category: 'simulation_error',
    status: 'processing',
    relatedSimulationId: 'sim-002',
    relatedSimulationName: '不同pH值对大肠杆菌代谢的影响',
    source: '调度引擎',
    triggeredAt: now.subtract(1, 'hour').toISOString(),
    processingBy: 'u-003',
    processingByName: '李操作',
    processingStartedAt: now.subtract(30, 'minute').toISOString(),
  },
  {
    id: 'w-003',
    title: '审批待处理提醒',
    message: '您有1条模拟任务审批请求已超过24小时未处理',
    level: 'medium',
    category: 'approval_timeout',
    status: 'acknowledged',
    source: '审批系统',
    triggeredAt: now.subtract(6, 'hour').toISOString(),
    acknowledgedAt: now.subtract(5, 'hour').toISOString(),
    acknowledgedBy: 'u-002',
    acknowledgedByName: '张审核',
  },
  {
    id: 'w-004',
    title: '氧浓度急剧下降',
    message: '模拟任务 sim-006 在执行过程中氧浓度骤降至临界值以下，导致任务失败',
    level: 'critical',
    category: 'parameter_anomaly',
    status: 'resolved',
    relatedSimulationId: 'sim-006',
    relatedSimulationName: '乳酸菌高密度培养模拟',
    source: '参数监控模块',
    triggeredAt: now.subtract(3, 'day').toISOString(),
    acknowledgedAt: now.subtract(3, 'day').add(10, 'minute').toISOString(),
    acknowledgedBy: 'u-002',
    acknowledgedByName: '张审核',
    processingBy: 'u-003',
    processingByName: '李操作',
    processingStartedAt: now.subtract(3, 'day').add(15, 'minute').toISOString(),
    resolvedAt: now.subtract(2, 'day').toISOString(),
    resolvedBy: 'u-003',
    resolvedByName: '李操作',
    resolutionNote: '已优化缓冲体系配方，增加pH自动调节模块，重新验证通过',
  },
  {
    id: 'w-005',
    title: '系统资源使用率偏高',
    message: '计算节点 CPU 使用率达到85%，建议限制并发任务数',
    level: 'low',
    category: 'resource_warning',
    status: 'pending',
    source: '系统监控',
    triggeredAt: now.subtract(2, 'hour').toISOString(),
  },
  {
    id: 'w-006',
    title: '生物量数据阈值突破',
    message: '模拟任务 sim-001 最终生物量超过预期值的120%，请确认结果合理性',
    level: 'info',
    category: 'data_threshold',
    status: 'acknowledged',
    relatedSimulationId: 'sim-001',
    relatedSimulationName: '高温条件下枯草芽孢杆菌生长模拟',
    source: '数据分析模块',
    triggeredAt: now.subtract(12, 'day').toISOString(),
    acknowledgedAt: now.subtract(11, 'day').toISOString(),
    acknowledgedBy: 'u-001',
    acknowledgedByName: '系统管理员',
  },
  {
    id: 'w-007',
    title: '模拟任务异常中断',
    message: '模拟任务 sim-006 执行至35%时异常终止，错误码：ERR_PH_COLLAPSE',
    level: 'critical',
    category: 'simulation_error',
    status: 'resolved',
    relatedSimulationId: 'sim-006',
    relatedSimulationName: '乳酸菌高密度培养模拟',
    source: '计算引擎',
    triggeredAt: now.subtract(5, 'day').toISOString(),
    acknowledgedAt: now.subtract(5, 'day').add(5, 'minute').toISOString(),
    acknowledgedBy: 'u-001',
    acknowledgedByName: '系统管理员',
    resolvedAt: now.subtract(4, 'day').toISOString(),
    resolvedBy: 'u-002',
    resolvedByName: '张审核',
    resolutionNote: '已修复pH控制算法bug，增加突变检测机制',
  },
];

export const useWarningStore = create<WarningStore>()(
  persist(
    (set, get) => ({
      warnings: initialMockWarnings,

      fetchWarnings: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      },

      addWarning: (data) => {
        const newWarning: WarningEvent = {
          id: `w-${uuidv4().slice(0, 8)}`,
          status: 'pending',
          triggeredAt: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ warnings: [newWarning, ...state.warnings] }));
        return newWarning;
      },

      acknowledgeWarning: (id: string, userId: string, userName: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id && w.status === 'pending'
              ? {
                  ...w,
                  status: 'acknowledged',
                  acknowledgedAt: now,
                  acknowledgedBy: userId,
                  acknowledgedByName: userName,
                }
              : w
          ),
        }));
      },

      startProcessing: (id: string, userId: string, userName: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id && (w.status === 'pending' || w.status === 'acknowledged')
              ? {
                  ...w,
                  status: 'processing',
                  acknowledgedAt: w.acknowledgedAt || now,
                  acknowledgedBy: w.acknowledgedBy || userId,
                  acknowledgedByName: w.acknowledgedByName || userName,
                  processingBy: userId,
                  processingByName: userName,
                  processingStartedAt: now,
                }
              : w
          ),
        }));
      },

      resolveWarning: (id: string, userId: string, userName: string, note: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'resolved',
                  acknowledgedAt: w.acknowledgedAt || now,
                  acknowledgedBy: w.acknowledgedBy || userId,
                  acknowledgedByName: w.acknowledgedByName || userName,
                  resolvedAt: now,
                  resolvedBy: userId,
                  resolvedByName: userName,
                  resolutionNote: note,
                }
              : w
          ),
        }));
      },

      ignoreWarning: (id: string, userId: string, userName: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          warnings: state.warnings.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'ignored',
                  acknowledgedAt: now,
                  acknowledgedBy: userId,
                  acknowledgedByName: userName,
                }
              : w
          ),
        }));
      },

      batchAcknowledge: (ids: string[], userId: string, userName: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          warnings: state.warnings.map((w) =>
            ids.includes(w.id) && w.status === 'pending'
              ? {
                  ...w,
                  status: 'acknowledged',
                  acknowledgedAt: now,
                  acknowledgedBy: userId,
                  acknowledgedByName: userName,
                }
              : w
          ),
        }));
      },

      batchResolve: (ids: string[], userId: string, userName: string, note: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          warnings: state.warnings.map((w) =>
            ids.includes(w.id)
              ? {
                  ...w,
                  status: 'resolved',
                  acknowledgedAt: w.acknowledgedAt || now,
                  acknowledgedBy: w.acknowledgedBy || userId,
                  acknowledgedByName: w.acknowledgedByName || userName,
                  resolvedAt: now,
                  resolvedBy: userId,
                  resolvedByName: userName,
                  resolutionNote: w.resolutionNote || note,
                }
              : w
          ),
        }));
      },

      deleteWarning: (id: string) => {
        set((state) => ({ warnings: state.warnings.filter((w) => w.id !== id) }));
      },

      clearResolved: () => {
        set((state) => ({
          warnings: state.warnings.filter((w) => w.status !== 'resolved' && w.status !== 'ignored'),
        }));
      },

      getPendingCount: () => {
        return get().warnings.filter((w) => w.status === 'pending').length;
      },

      getUnacknowledgedCount: () => {
        return get().warnings.filter((w) => w.status === 'pending').length;
      },

      getByLevel: (level: WarningLevel) => {
        return get().warnings.filter((w) => w.level === level);
      },

      getByStatus: (status: WarningStatus) => {
        return get().warnings.filter((w) => w.status === status);
      },

      getBySimulation: (simulationId: string) => {
        return get().warnings.filter((w) => w.relatedSimulationId === simulationId);
      },

      getStats: () => {
        const { warnings } = get();
        return {
          total: warnings.length,
          pending: warnings.filter((w) => w.status === 'pending').length,
          processing: warnings.filter((w) => w.status === 'processing').length,
          acknowledged: warnings.filter((w) => w.status === 'acknowledged').length,
          resolved: warnings.filter((w) => w.status === 'resolved').length,
          critical: warnings.filter((w) => w.level === 'critical').length,
          high: warnings.filter((w) => w.level === 'high').length,
        };
      },
    }),
    {
      name: 'warning-storage',
      partialize: (state) => ({ warnings: state.warnings }),
    }
  )
);

export const WARNING_LEVEL_LABELS: Record<WarningLevel, string> = {
  info: '提示',
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const WARNING_LEVEL_COLORS: Record<WarningLevel, string> = {
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export const WARNING_LEVEL_DOT_COLORS: Record<WarningLevel, string> = {
  info: 'bg-blue-500',
  low: 'bg-slate-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export const WARNING_STATUS_LABELS: Record<WarningStatus, string> = {
  pending: '待确认',
  acknowledged: '已确认',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

export const WARNING_STATUS_COLORS: Record<WarningStatus, string> = {
  pending: 'bg-red-100 text-red-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  ignored: 'bg-gray-100 text-gray-600',
};

export const WARNING_CATEGORY_LABELS: Record<WarningCategory, string> = {
  parameter_anomaly: '参数异常',
  simulation_error: '模拟错误',
  system_alert: '系统提醒',
  data_threshold: '数据阈值',
  approval_timeout: '审批超时',
  resource_warning: '资源告警',
};
