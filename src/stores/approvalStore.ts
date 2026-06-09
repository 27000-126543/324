import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export type ApprovalStatus =
  | 'pending_first'
  | 'rejected_first'
  | 'approved_first'
  | 'pending_second'
  | 'rejected_second'
  | 'approved_second'
  | 'withdrawn';

export type ApprovalLevel = 'first' | 'second';

export interface ApprovalRecord {
  id: string;
  simulationId: string;
  simulationName: string;
  simulationParams: Record<string, unknown>;
  description?: string;
  status: ApprovalStatus;
  submitterId: string;
  submitterName: string;
  submittedAt: string;
  firstApproverId?: string;
  firstApproverName?: string;
  firstApprovedAt?: string;
  firstRejectedAt?: string;
  firstComment?: string;
  secondApproverId?: string;
  secondApproverName?: string;
  secondApprovedAt?: string;
  secondRejectedAt?: string;
  secondComment?: string;
  withdrawnAt?: string;
  withdrawnBy?: string;
  withdrawnByName?: string;
  withdrawReason?: string;
}

interface ApprovalStore {
  approvals: ApprovalRecord[];

  fetchApprovals: () => Promise<void>;
  submitApproval: (
    data: Omit<ApprovalRecord, 'id' | 'status' | 'submitterId' | 'submitterName' | 'submittedAt'> & {
      submitterId: string;
      submitterName: string;
    }
  ) => ApprovalRecord;
  approveFirst: (
    id: string,
    approverId: string,
    approverName: string,
    comment?: string
  ) => void;
  rejectFirst: (
    id: string,
    approverId: string,
    approverName: string,
    comment: string
  ) => void;
  approveSecond: (
    id: string,
    approverId: string,
    approverName: string,
    comment?: string
  ) => void;
  rejectSecond: (
    id: string,
    approverId: string,
    approverName: string,
    comment: string
  ) => void;
  withdraw: (
    id: string,
    userId: string,
    userName: string,
    reason: string
  ) => void;

  getById: (id: string) => ApprovalRecord | undefined;
  getBySimulation: (simulationId: string) => ApprovalRecord | undefined;
  getPendingFirst: () => ApprovalRecord[];
  getPendingSecond: () => ApprovalRecord[];
  getBySubmitter: (submitterId: string) => ApprovalRecord[];
  getByApprover: (approverId: string) => ApprovalRecord[];
  canApproveFirst: (id: string, userId: string) => boolean;
  canApproveSecond: (id: string, userId: string) => boolean;
  getCurrentLevel: (id: string) => ApprovalLevel | null;
  getStats: () => {
    total: number;
    pendingFirst: number;
    pendingSecond: number;
    approved: number;
    rejected: number;
  };
}

const now = dayjs();
const initialMockApprovals: ApprovalRecord[] = [
  {
    id: 'app-001',
    simulationId: 'sim-003',
    simulationName: '氮源优化实验 - 酵母提取物 vs 蛋白胨',
    simulationParams: {
      temperature: 37,
      humidity: 85,
      ph: 7.2,
      oxygenLevel: 21,
      nitrogenSource: '酵母提取物',
      duration: 60,
      strainType: '大肠杆菌',
    },
    description: '对比酵母提取物与蛋白胨两种氮源对菌体生物量的影响，为后续发酵工艺优化提供数据支持',
    status: 'pending_first',
    submitterId: 'u-003',
    submitterName: '李操作',
    submittedAt: now.subtract(2, 'day').hour(10).minute(15).toISOString(),
  },
  {
    id: 'app-002',
    simulationId: 'sim-005',
    simulationName: '青霉素发酵过程参数优化',
    simulationParams: {
      strainType: '产黄青霉',
      temperature: 25,
      ph: 6.8,
      duration: 120,
      carbonSource: '乳糖',
    },
    description: '产黄青霉青霉素合成最优条件探索，包含温度、pH、碳源浓度三因素三水平正交实验设计',
    status: 'approved_second',
    submitterId: 'u-002',
    submitterName: '张审核',
    submittedAt: now.subtract(7, 'day').hour(16).minute(0).toISOString(),
    firstApproverId: 'u-002',
    firstApproverName: '张审核',
    firstApprovedAt: now.subtract(6, 'day').hour(9).minute(30).toISOString(),
    firstComment: '实验设计合理，参数设置规范，同意进入二审',
    secondApproverId: 'u-001',
    secondApproverName: '系统管理员',
    secondApprovedAt: now.subtract(5, 'day').hour(14).minute(0).toISOString(),
    secondComment: '资源评估通过，准予执行，请确保实验过程记录完整',
  },
  {
    id: 'app-003',
    simulationId: 'sim-998',
    simulationName: '极端嗜热菌酶活表达测试',
    simulationParams: {
      strainType: '嗜热脂肪芽孢杆菌',
      temperature: 65,
      ph: 7.5,
      duration: 48,
    },
    description: '极端嗜热条件下酶活表达特性研究',
    status: 'rejected_first',
    submitterId: 'u-003',
    submitterName: '李操作',
    submittedAt: now.subtract(10, 'day').hour(11).minute(0).toISOString(),
    firstApproverId: 'u-002',
    firstApproverName: '张审核',
    firstRejectedAt: now.subtract(9, 'day').hour(16).minute(30).toISOString(),
    firstComment: '温度设置超出系统安全阈值（最高60℃），请调整参数或补充风险评估报告后重新提交',
  },
  {
    id: 'app-004',
    simulationId: 'sim-999',
    simulationName: '光合细菌固碳效率模拟',
    simulationParams: {
      strainType: '沼泽红假单胞菌',
      lightIntensity: 5000,
      co2Concentration: 5,
      duration: 96,
    },
    description: '不同光照强度下光合细菌固碳效率优化实验',
    status: 'approved_first',
    submitterId: 'u-003',
    submitterName: '李操作',
    submittedAt: now.subtract(3, 'day').hour(15).minute(0).toISOString(),
    firstApproverId: 'u-002',
    firstApproverName: '张审核',
    firstApprovedAt: now.subtract(2, 'day').hour(10).minute(0).toISOString(),
    firstComment: '参数合理，具有研究价值，提请终审',
  },
  {
    id: 'app-005',
    simulationId: 'sim-997',
    simulationName: '重组蛋白表达条件优化',
    simulationParams: {
      strainType: '毕赤酵母',
      temperature: 30,
      methanolConcentration: 1,
      duration: 144,
    },
    description: '毕赤酵母表达系统甲醇诱导条件优化',
    status: 'rejected_second',
    submitterId: 'u-002',
    submitterName: '张审核',
    submittedAt: now.subtract(14, 'day').hour(9).minute(0).toISOString(),
    firstApproverId: 'u-002',
    firstApproverName: '张审核',
    firstApprovedAt: now.subtract(13, 'day').hour(14).minute(0).toISOString(),
    firstComment: '实验方案完整，预计时长6天可接受',
    secondApproverId: 'u-001',
    secondApproverName: '系统管理员',
    secondRejectedAt: now.subtract(12, 'day').hour(11).minute(0).toISOString(),
    secondComment: '当前计算资源紧张，建议缩短至96小时或排队等待，请调整后重新提交',
  },
];

export const useApprovalStore = create<ApprovalStore>()(
  persist(
    (set, get) => ({
      approvals: initialMockApprovals,

      fetchApprovals: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      },

      submitApproval: (data) => {
        const newApproval: ApprovalRecord = {
          id: `app-${uuidv4().slice(0, 8)}`,
          status: 'pending_first',
          submittedAt: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ approvals: [newApproval, ...state.approvals] }));
        return newApproval;
      },

      approveFirst: (id: string, approverId: string, approverName: string, comment?: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          approvals: state.approvals.map((a) =>
            a.id === id && a.status === 'pending_first'
              ? {
                  ...a,
                  status: 'approved_first',
                  firstApproverId: approverId,
                  firstApproverName: approverName,
                  firstApprovedAt: now,
                  firstComment: comment,
                }
              : a
          ),
        }));
      },

      rejectFirst: (id: string, approverId: string, approverName: string, comment: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          approvals: state.approvals.map((a) =>
            a.id === id && a.status === 'pending_first'
              ? {
                  ...a,
                  status: 'rejected_first',
                  firstApproverId: approverId,
                  firstApproverName: approverName,
                  firstRejectedAt: now,
                  firstComment: comment,
                }
              : a
          ),
        }));
      },

      approveSecond: (id: string, approverId: string, approverName: string, comment?: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          approvals: state.approvals.map((a) =>
            a.id === id && a.status === 'approved_first'
              ? {
                  ...a,
                  status: 'approved_second',
                  secondApproverId: approverId,
                  secondApproverName: approverName,
                  secondApprovedAt: now,
                  secondComment: comment,
                }
              : a
          ),
        }));
      },

      rejectSecond: (id: string, approverId: string, approverName: string, comment: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          approvals: state.approvals.map((a) =>
            a.id === id && a.status === 'approved_first'
              ? {
                  ...a,
                  status: 'rejected_second',
                  secondApproverId: approverId,
                  secondApproverName: approverName,
                  secondRejectedAt: now,
                  secondComment: comment,
                }
              : a
          ),
        }));
      },

      withdraw: (id: string, userId: string, userName: string, reason: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          approvals: state.approvals.map((a) =>
            a.id === id &&
            (a.status === 'pending_first' || a.status === 'approved_first')
              ? {
                  ...a,
                  status: 'withdrawn',
                  withdrawnAt: now,
                  withdrawnBy: userId,
                  withdrawnByName: userName,
                  withdrawReason: reason,
                }
              : a
          ),
        }));
      },

      getById: (id: string) => {
        return get().approvals.find((a) => a.id === id);
      },

      getBySimulation: (simulationId: string) => {
        return get().approvals.find((a) => a.simulationId === simulationId);
      },

      getPendingFirst: () => {
        return get().approvals.filter((a) => a.status === 'pending_first');
      },

      getPendingSecond: () => {
        return get().approvals.filter((a) => a.status === 'approved_first');
      },

      getBySubmitter: (submitterId: string) => {
        return get().approvals.filter((a) => a.submitterId === submitterId);
      },

      getByApprover: (approverId: string) => {
        return get().approvals.filter(
          (a) => a.firstApproverId === approverId || a.secondApproverId === approverId
        );
      },

      canApproveFirst: (id: string, userId: string) => {
        const approval = get().getById(id);
        if (!approval) return false;
        return approval.status === 'pending_first' && approval.submitterId !== userId;
      },

      canApproveSecond: (id: string, userId: string) => {
        const approval = get().getById(id);
        if (!approval) return false;
        return (
          approval.status === 'approved_first' &&
          approval.firstApproverId !== userId
        );
      },

      getCurrentLevel: (id: string): ApprovalLevel | null => {
        const approval = get().getById(id);
        if (!approval) return null;
        if (approval.status === 'pending_first' || approval.status === 'rejected_first') {
          return 'first';
        }
        if (
          approval.status === 'approved_first' ||
          approval.status === 'pending_second' ||
          approval.status === 'rejected_second'
        ) {
          return 'second';
        }
        return null;
      },

      getStats: () => {
        const { approvals } = get();
        return {
          total: approvals.length,
          pendingFirst: approvals.filter((a) => a.status === 'pending_first').length,
          pendingSecond: approvals.filter((a) => a.status === 'approved_first').length,
          approved: approvals.filter((a) => a.status === 'approved_second').length,
          rejected: approvals.filter(
            (a) => a.status === 'rejected_first' || a.status === 'rejected_second'
          ).length,
        };
      },
    }),
    {
      name: 'approval-storage',
      partialize: (state) => ({ approvals: state.approvals }),
    }
  )
);

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending_first: '待一级审批',
  rejected_first: '一级驳回',
  approved_first: '待二级审批',
  pending_second: '待二级审批',
  rejected_second: '二级驳回',
  approved_second: '审批通过',
  withdrawn: '已撤回',
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending_first: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected_first: 'bg-red-100 text-red-700 border-red-200',
  approved_first: 'bg-blue-100 text-blue-700 border-blue-200',
  pending_second: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected_second: 'bg-red-100 text-red-700 border-red-200',
  approved_second: 'bg-green-100 text-green-700 border-green-200',
  withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const APPROVAL_LEVEL_LABELS: Record<ApprovalLevel, string> = {
  first: '一级审批',
  second: '二级审批',
};
