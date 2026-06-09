import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  UserPlus,
  Search,
  Edit3,
  Ban,
  KeyRound,
  X,
  Upload,
  Camera,
  ChevronDown,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Crown,
  Lock,
  Eye,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@shared/types';

const ROLE_LABELS: Record<UserRole, string> = {
  FARM_ADMIN: '农场管理员',
  ECOLOGIST: '生态学家',
  MICROBE_VALIDATOR: '微生物验证者',
  SOIL_EXPERT: '土壤健康专家',
  CHIEF_SCIENTIST: '首席科学家',
};

const ROLE_COLORS: Record<UserRole, string> = {
  FARM_ADMIN: 'bg-loam-500/15 text-loam-600 border-loam-500/30',
  ECOLOGIST: 'bg-status-info/10 text-status-info border-status-info/25',
  MICROBE_VALIDATOR: 'bg-status-fallback/10 text-status-fallback border-status-fallback/25',
  SOIL_EXPERT: 'bg-forest-500/15 text-forest-600 border-forest-500/30',
  CHIEF_SCIENTIST: 'bg-status-critical/10 text-status-critical border-status-critical/25',
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  FARM_ADMIN: Users,
  ECOLOGIST: Leaf,
  MICROBE_VALIDATOR: Shield,
  SOIL_EXPERT: Eye,
  CHIEF_SCIENTIST: Crown,
};

const PERMISSION_GROUPS = [
  {
    group: '数据管理',
    permissions: [
      { key: 'data:upload', label: '数据上传', desc: '上传土壤理化/宏基因组数据' },
      { key: 'data:edit', label: '数据编辑', desc: '修改已上传数据' },
      { key: 'data:delete', label: '数据删除', desc: '永久删除数据记录' },
    ],
  },
  {
    group: '模拟任务',
    permissions: [
      { key: 'sim:create', label: '发起模拟', desc: '创建新的模拟任务' },
      { key: 'sim:execute', label: '执行模拟', desc: '启动/暂停模拟计算' },
      { key: 'sim:read', label: '查看模拟', desc: '浏览模拟结果详情' },
      { key: 'sim:edit', label: '编辑参数', desc: '修改模拟参数配置' },
    ],
  },
  {
    group: '审批与复核',
    permissions: [
      { key: 'app:microbe', label: '微生物审批', desc: '审批微生物组成验证' },
      { key: 'app:soil', label: '土壤健康审批', desc: '审批土壤健康专家评估' },
      { key: 'warn:review', label: '复核预警', desc: '复核处理异常预警事件' },
    ],
  },
  {
    group: '报告与系统',
    permissions: [
      { key: 'report:export', label: '导出报告', desc: '导出模拟报告PDF/Excel' },
      { key: 'system:config', label: '系统设置', desc: '阈值配置/系统参数' },
      { key: 'user:manage', label: '用户管理', desc: '增删改用户与角色权限' },
    ],
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  FARM_ADMIN: ['data:upload', 'sim:read', 'report:export'],
  ECOLOGIST: ['data:upload', 'data:edit', 'sim:create', 'sim:execute', 'sim:read', 'sim:edit', 'warn:review', 'report:export'],
  MICROBE_VALIDATOR: ['sim:read', 'app:microbe', 'warn:review', 'report:export'],
  SOIL_EXPERT: ['sim:read', 'app:soil', 'warn:review', 'report:export'],
  CHIEF_SCIENTIST: [
    'data:upload', 'data:edit', 'data:delete',
    'sim:create', 'sim:execute', 'sim:read', 'sim:edit',
    'app:microbe', 'app:soil', 'warn:review',
    'report:export', 'system:config', 'user:manage',
  ],
};

interface NewUserForm {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    fullName: '',
    email: '',
    password: '',
    role: 'ECOLOGIST',
  });
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>({ ...DEFAULT_ROLE_PERMISSIONS });
  const [expandedPermGroup, setExpandedPermGroup] = useState<string | null>(null);

  const users: User[] = useMemo(() => [
    {
      id: 'u_chief_01', username: 'qianxf', fullName: '钱学峰', email: 'qianxf@acad.cn',
      phone: '13800138005', role: 'CHIEF_SCIENTIST', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2025-01-15T08:00:00Z',
      lastLoginAt: '2026-06-09T08:42:00Z',
    },
    {
      id: 'u_soil_01', username: 'zhaodl', fullName: '赵德利', email: 'zhaodl@soil.cn',
      phone: '13800138004', role: 'SOIL_EXPERT', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2025-03-10T09:00:00Z',
      lastLoginAt: '2026-06-09T07:15:00Z',
    },
    {
      id: 'u_micro_01', username: 'zhangxw', fullName: '张晓薇', email: 'zhangxw@lab.cn',
      phone: '13800138003', role: 'MICROBE_VALIDATOR', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2025-04-22T10:30:00Z',
      lastLoginAt: '2026-06-08T16:30:00Z',
    },
    {
      id: 'u_eco_01', username: 'limy', fullName: '李明远', email: 'limy@eco.cn',
      phone: '13800138002', role: 'ECOLOGIST', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2025-06-01T08:00:00Z',
      lastLoginAt: '2026-06-09T09:20:00Z',
    },
    {
      id: 'u_eco_02', username: 'sunhy', fullName: '孙海洋', email: 'sunhy@eco.cn',
      phone: '13800138006', role: 'ECOLOGIST', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2025-08-15T09:00:00Z',
      lastLoginAt: '2026-06-07T14:08:00Z',
    },
    {
      id: 'u_eco_03', username: 'zhouml', fullName: '周美玲', email: 'zhouml@eco.cn',
      phone: '13800138007', role: 'ECOLOGIST', passwordHash: '***',
      status: 'INACTIVE', createdAt: '2025-09-20T10:00:00Z',
      lastLoginAt: '2026-05-20T11:45:00Z',
    },
    {
      id: 'u_farm_01', username: 'wangjg', fullName: '王建国', email: 'wangjg@farm.cn',
      phone: '13800138001', role: 'FARM_ADMIN', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2025-11-01T08:30:00Z',
      lastLoginAt: '2026-06-08T19:22:00Z',
    },
    {
      id: 'u_farm_02', username: 'liuqy', fullName: '刘庆远', email: 'liuqy@farm.cn',
      phone: '13800138008', role: 'FARM_ADMIN', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2026-02-14T09:00:00Z',
      lastLoginAt: '2026-06-06T10:30:00Z',
    },
    {
      id: 'u_farm_03', username: 'chenbx', fullName: '陈宝鑫', email: 'chenbx@farm.cn',
      phone: '13800138009', role: 'FARM_ADMIN', passwordHash: '***',
      status: 'ACTIVE', createdAt: '2026-04-01T08:00:00Z',
      lastLoginAt: '2026-06-09T06:10:00Z',
    },
  ], []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = search === ''
        || u.fullName.includes(search)
        || u.email.toLowerCase().includes(search.toLowerCase())
        || u.username.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const roleStats = useMemo(() => {
    const roles: UserRole[] = ['FARM_ADMIN', 'ECOLOGIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'CHIEF_SCIENTIST'];
    return roles.map((role) => {
      const roleUsers = users.filter((u) => u.role === role);
      const active = roleUsers.filter((u) => u.status === 'ACTIVE').length;
      const thisMonth = roleUsers.filter((u) => {
        const created = new Date(u.createdAt);
        return created.getFullYear() === 2026 && created.getMonth() === 5;
      }).length;
      return { role, total: roleUsers.length, active, thisMonth };
    });
  }, [users]);

  const allPermissions = useMemo(
    () => PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key)),
    []
  );

  const togglePermission = (role: UserRole, permKey: string) => {
    setRolePermissions((prev) => {
      const current = prev[role];
      const has = current.includes(permKey);
      return {
        ...prev,
        [role]: has ? current.filter((k) => k !== permKey) : [...current, permKey],
      };
    });
  };

  const formatLoginTime = (iso?: string) => {
    if (!iso) return '从未';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">
                用户与角色管理
              </h1>
              <span className="badge-critical">
                <Crown className="w-3.5 h-3.5" />
                仅首席科学家
              </span>
            </div>
            <p className="mt-1 text-forest-600/70 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              管理系统用户、分配角色权限 · 共 {users.length} 位成员
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowNewUserModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            新建用户
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {roleStats.map((stat, i) => {
            const RoleIcon = ROLE_ICONS[stat.role];
            return (
              <motion.div
                key={stat.role}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="kpi-card bg-card-texture bg-white/90"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', ROLE_COLORS[stat.role])}>
                      <RoleIcon className="w-5.5 h-5.5" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success/10 text-status-success text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      +{stat.thisMonth}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-forest-600/70 font-medium">{ROLE_LABELS[stat.role]}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold text-forest-800 tracking-tight">
                        {stat.total}
                      </span>
                      <span className="text-xs text-forest-600/60">人</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-forest-600/70">
                        <UserCheck className="w-3.5 h-3.5 text-status-success" />
                        <span>活跃 {stat.active}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-forest-600/70">
                        <Calendar className="w-3.5 h-3.5 text-loam-600" />
                        <span>本月 +{stat.thisMonth}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title">用户列表</div>
              <div className="section-subtitle">显示 {filteredUsers.length} / {users.length} 位用户</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索姓名/邮箱/账号..."
                  className="input-field pl-10 !py-2 text-sm w-60"
                />
              </div>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                  className="input-field !py-2 text-sm pr-10 appearance-none min-w-[140px]"
                >
                  <option value="all">全部角色</option>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/50 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-600/10 bg-forest-50/40">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-forest-700/80 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-forest-700/80 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-forest-700/80 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-forest-700/80 uppercase tracking-wider">
                    最近登录
                  </th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-forest-700/80 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-600/8">
                {filteredUsers.map((user, idx) => {
                  const RoleIcon = ROLE_ICONS[user.role];
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="hover:bg-forest-600/4 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-card',
                            user.role === 'CHIEF_SCIENTIST' && 'bg-gradient-to-br from-status-critical to-status-warning',
                            user.role === 'SOIL_EXPERT' && 'bg-gradient-to-br from-forest-500 to-forest-600',
                            user.role === 'MICROBE_VALIDATOR' && 'bg-gradient-to-br from-status-fallback to-status-info',
                            user.role === 'ECOLOGIST' && 'bg-gradient-to-br from-status-info to-forest-400',
                            user.role === 'FARM_ADMIN' && 'bg-gradient-to-br from-loam-500 to-loam-400',
                          )}>
                            {user.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-forest-800">{user.fullName}</div>
                            <div className="text-xs text-forest-600/60 mt-0.5 flex items-center gap-2">
                              <span className="font-mono">{user.username}</span>
                              <span>·</span>
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', ROLE_COLORS[user.role])}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          user.status === 'ACTIVE'
                            ? 'bg-status-success/10 text-status-success'
                            : 'bg-forest-600/10 text-forest-600/70'
                        )}>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            user.status === 'ACTIVE' ? 'bg-status-success animate-pulse' : 'bg-forest-600/40'
                          )} />
                          {user.status === 'ACTIVE' ? '正常' : '已禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-forest-700/80">{formatLoginTime(user.lastLoginAt)}</div>
                        <div className="text-xs text-forest-600/50 mt-0.5 font-mono">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN') : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-forest-600/60 hover:text-forest-700 hover:bg-forest-600/10 transition-colors" title="编辑用户">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                              user.status === 'ACTIVE'
                                ? 'text-status-warning/70 hover:text-status-warning hover:bg-status-warning/10'
                                : 'text-status-success/70 hover:text-status-success hover:bg-status-success/10'
                            )}
                            title={user.status === 'ACTIVE' ? '禁用用户' : '启用用户'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-status-fallback/70 hover:text-status-fallback hover:bg-status-fallback/10 transition-colors" title="重置密码">
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title flex items-center gap-2">
                <Lock className="w-5 h-5 text-status-fallback" />
                权限矩阵配置
              </div>
              <div className="section-subtitle">勾选各角色对应的功能权限，配置自动保存</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-forest-600/70">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              {allPermissions.length} 项权限 · 5 个角色
            </div>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-forest-600/10 bg-forest-50/50 sticky top-0">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-forest-700/80 uppercase tracking-wider w-64">
                      功能权限
                    </th>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                      const RoleIcon = ROLE_ICONS[role];
                      return (
                        <th
                          key={role}
                          className="px-4 py-3.5 text-center"
                        >
                          <div className={cn(
                            'inline-flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl border',
                            ROLE_COLORS[role]
                          )}>
                            <RoleIcon className="w-4 h-4" />
                            <span className="text-xs font-semibold whitespace-nowrap">
                              {ROLE_LABELS[role]}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-600/8">
                  {PERMISSION_GROUPS.map((group) => {
                    const isExpanded = expandedPermGroup === group.group || expandedPermGroup === null;
                    return (
                      <>
                        <tr
                          key={group.group}
                          className="bg-forest-50/30 cursor-pointer hover:bg-forest-50/60 transition-colors"
                          onClick={() => setExpandedPermGroup(isExpanded ? group.group : null)}
                        >
                          <td className="px-5 py-3" colSpan={6}>
                            <div className="flex items-center gap-2">
                              <ChevronDown className={cn(
                                'w-4 h-4 text-forest-600/60 transition-transform',
                                !isExpanded && '-rotate-90'
                              )} />
                              <span className="font-display font-semibold text-forest-800 text-sm">
                                {group.group}
                              </span>
                              <span className="text-xs text-forest-600/50">
                                ({group.permissions.length} 项)
                              </span>
                            </div>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && group.permissions.map((perm) => (
                            <tr
                              key={perm.key}
                              className="hover:bg-forest-600/3 transition-colors"
                            >
                              <td className="px-5 py-3.5">
                                <div className="font-medium text-sm text-forest-800">{perm.label}</div>
                                <div className="text-xs text-forest-600/60 mt-0.5">{perm.desc}</div>
                              </td>
                              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                                const checked = rolePermissions[role].includes(perm.key);
                                const isChiefScientist = role === 'CHIEF_SCIENTIST';
                                return (
                                  <td key={role} className="px-4 py-3.5 text-center">
                                    <label className={cn(
                                      'inline-flex items-center justify-center',
                                      isChiefScientist && 'cursor-not-allowed'
                                    )}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => !isChiefScientist && togglePermission(role, perm.key)}
                                        disabled={isChiefScientist}
                                        className={cn(
                                          'w-4.5 h-4.5 rounded-md border-2 transition-all cursor-pointer accent-forest-500',
                                          isChiefScientist && 'opacity-80 cursor-not-allowed'
                                        )}
                                      />
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </AnimatePresence>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-forest-600/10 bg-loam-500/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-forest-600/70">
                <AlertTriangle className="w-4 h-4 text-loam-600" />
                首席科学家默认拥有全部权限，不可修改
              </div>
              <button className="btn-primary text-xs !py-2">
                保存权限配置
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showNewUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm"
              onClick={() => setShowNewUserModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-cardHover overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-forest-600/10 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-forest-800 tracking-tight">
                    新建系统用户
                  </h2>
                  <p className="text-sm text-forest-600/60 mt-0.5">填写基本信息并分配角色</p>
                </div>
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-forest-600/50 hover:text-forest-700 hover:bg-forest-600/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-forest-gradient/10 border-2 border-dashed border-forest-500/30 flex items-center justify-center group-hover:border-forest-500/50 transition-colors cursor-pointer">
                      <Camera className="w-8 h-8 text-forest-500/50 group-hover:text-forest-500/70 transition-colors" />
                    </div>
                    <button className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-forest-gradient text-white shadow-card flex items-center justify-center">
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-forest-800">头像上传</div>
                    <div className="text-xs text-forest-600/60 mt-1">支持 JPG/PNG，建议正方形 200x200 以上</div>
                    <div className="mt-2 text-xs text-forest-600/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-400" />
                      暂不上传将使用首字母占位
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">姓名 <span className="text-status-critical">*</span></label>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      placeholder="请输入真实姓名"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">邮箱地址 <span className="text-status-critical">*</span></label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="name@example.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">初始密码 <span className="text-status-critical">*</span></label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="至少8位，包含字母和数字"
                    className="input-field"
                  />
                  <div className="input-hint flex items-center justify-between">
                    <span>首次登录后强制修改密码</span>
                    <button className="text-forest-500 hover:text-forest-600 font-medium">
                      随机生成
                    </button>
                  </div>
                </div>

                <div>
                  <label className="input-label">分配角色 <span className="text-status-critical">*</span></label>
                  <div className="relative">
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="input-field pr-10 appearance-none"
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/50 pointer-events-none" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-status-success/5 border border-status-success/15">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-forest-800">邀请通知</div>
                      <div className="text-forest-600/70 mt-1">
                        创建后将自动向 <span className="font-mono text-forest-700">{newUser.email || '指定邮箱'}</span> 发送包含初始密码的登录邀请邮件。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-forest-600/10 bg-forest-50/30 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button className="btn-primary">
                  <UserPlus className="w-4 h-4" />
                  创建用户
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
