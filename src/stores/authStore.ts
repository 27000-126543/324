import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '../../shared/types';

export type { UserRole } from '../../shared/types';

export interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Permission {
  key: string;
  name: string;
  description?: string;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  CHIEF_SCIENTIST: [
    'user:manage',
    'threshold:manage',
    'simulation:create',
    'simulation:read',
    'simulation:update',
    'simulation:delete',
    'simulation:approve',
    'simulation:execute',
    'warning:manage',
    'warning:handle',
    'approval:review',
    'approval:finalize',
    'system:config',
    'report:export',
    'network:view',
  ],
  MICROBE_VALIDATOR: [
    'simulation:read',
    'simulation:create',
    'simulation:update',
    'simulation:approve',
    'warning:read',
    'warning:handle',
    'approval:review',
    'report:export',
    'network:view',
  ],
  SOIL_EXPERT: [
    'simulation:read',
    'simulation:create',
    'simulation:update',
    'simulation:approve',
    'warning:read',
    'warning:handle',
    'approval:review',
    'report:export',
    'network:view',
  ],
  ECOLOGIST: [
    'simulation:read',
    'simulation:create',
    'simulation:update',
    'simulation:execute',
    'warning:read',
    'warning:handle',
    'report:export',
    'network:view',
  ],
  FARM_ADMIN: [
    'simulation:read',
    'warning:read',
    'report:export',
  ],
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  updateUser: (updates: Partial<User>) => void;
}

const primaryUsers: Record<string, { password: string; user: User }> = {
  chief_sci: {
    password: 'chief123',
    user: {
      id: 'u-001',
      username: 'chief_sci',
      realName: '陈首席',
      email: 'chen.chief@soil-science.ac.cn',
      phone: '13800138000',
      role: 'CHIEF_SCIENTIST',
      department: '土壤微生物学重点实验室',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-06-01T10:30:00Z',
    },
  },
  soil_expert: {
    password: 'soil123',
    user: {
      id: 'u-003',
      username: 'soil_expert',
      realName: '赵土壤',
      email: 'zhao.expert@soil-science.ac.cn',
      phone: '13800138002',
      role: 'SOIL_EXPERT',
      department: '土壤健康评估中心',
      createdAt: '2024-02-01T00:00:00Z',
      lastLoginAt: '2024-06-03T14:20:00Z',
    },
  },
  microbe_val: {
    password: 'micro123',
    user: {
      id: 'u-002',
      username: 'microbe_val',
      realName: '刘验证',
      email: 'liu.validator@soil-science.ac.cn',
      phone: '13800138001',
      role: 'MICROBE_VALIDATOR',
      department: '微生物验证组',
      createdAt: '2024-01-15T00:00:00Z',
      lastLoginAt: '2024-06-02T09:15:00Z',
    },
  },
  ecologist: {
    password: 'eco123',
    user: {
      id: 'u-004',
      username: 'ecologist',
      realName: '孙生态',
      email: 'sun.eco@soil-science.ac.cn',
      role: 'ECOLOGIST',
      department: '生态模拟研究组',
      createdAt: '2024-03-01T00:00:00Z',
      lastLoginAt: '2024-06-04T16:45:00Z',
    },
  },
  farm: {
    password: 'farm123',
    user: {
      id: 'u-005',
      username: 'farm',
      realName: '周农场',
      email: 'zhou.farm@greenfield-agri.com',
      role: 'FARM_ADMIN',
      department: '绿野农业合作社',
      createdAt: '2024-04-01T00:00:00Z',
      lastLoginAt: '2024-06-05T08:00:00Z',
    },
  },
};

const aliasMap: Record<string, string> = {
  chief: 'chief_sci',
  expert: 'soil_expert',
  validator: 'microbe_val',
};

const mockUsers: Record<string, { password: string; user: User }> = {
  ...primaryUsers,
  chief: { ...primaryUsers.chief_sci, user: { ...primaryUsers.chief_sci.user, username: 'chief' } },
  expert: { ...primaryUsers.soil_expert, user: { ...primaryUsers.soil_expert.user, username: 'expert' } },
  validator: { ...primaryUsers.microbe_val, user: { ...primaryUsers.microbe_val.user, username: 'validator' } },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: [],

      login: async (username: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const key = username.toLowerCase();
        const aliasKey = aliasMap[key];
        const lookupKey = aliasKey || key;

        const entry = mockUsers[lookupKey];
        if (!entry || entry.password !== password) {
          return false;
        }

        const token = `mock-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const originalUser = primaryUsers[aliasKey || key]?.user || entry.user;
        const user = {
          ...originalUser,
          lastLoginAt: new Date().toISOString(),
        };
        const permissions = ROLE_PERMISSIONS[user.role] || [];

        set({ user, token, isAuthenticated: true, permissions });
        return true;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, permissions: [] });
      },

      hasPermission: (permission: string) => {
        const { permissions, user } = get();
        if (user?.role === 'CHIEF_SCIENTIST') return true;
        return permissions.includes(permission);
      },

      hasAnyPermission: (perms: string[]) => {
        return perms.some((p) => get().hasPermission(p));
      },

      hasRole: (role: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        if (Array.isArray(role)) return role.includes(user.role);
        return user.role === role;
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updated = { ...user, ...updates };
          const permissions = ROLE_PERMISSIONS[updated.role] || [];
          set({ user: updated, permissions });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
);

export const ROLE_LABELS: Record<UserRole, string> = {
  CHIEF_SCIENTIST: '首席科学家',
  MICROBE_VALIDATOR: '微生物验证员',
  SOIL_EXPERT: '土壤健康专家',
  ECOLOGIST: '生态研究员',
  FARM_ADMIN: '农场管理员',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  CHIEF_SCIENTIST: 'bg-forest-100 text-forest-700 border-forest-200',
  MICROBE_VALIDATOR: 'bg-purple-100 text-purple-700 border-purple-200',
  SOIL_EXPERT: 'bg-loam-100 text-loam-600 border-loam-200',
  ECOLOGIST: 'bg-blue-100 text-blue-700 border-blue-200',
  FARM_ADMIN: 'bg-amber-100 text-amber-700 border-amber-200',
};
