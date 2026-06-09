import { useState } from 'react';
import { Users, Search, Plus, MoreHorizontal, UserPlus, Shield, Edit2, Trash2, Mail, Phone, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROLE_LABELS, ROLE_COLORS, useAuthStore } from '@/stores/authStore';
import type { UserRole } from '../../../shared/types';

interface MockUser {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt: string;
}

const mockUsers: MockUser[] = [
  { id: 'u-001', username: 'chief', realName: '陈首席', email: 'chen.chief@soil-science.ac.cn', phone: '138****8000', role: 'CHIEF_SCIENTIST', department: '土壤微生物学重点实验室', status: 'ACTIVE', lastLoginAt: '2024-06-09 10:30' },
  { id: 'u-002', username: 'validator', realName: '刘验证', email: 'liu.validator@soil-science.ac.cn', phone: '138****8001', role: 'MICROBE_VALIDATOR', department: '微生物验证组', status: 'ACTIVE', lastLoginAt: '2024-06-08 09:15' },
  { id: 'u-003', username: 'expert', realName: '赵土壤', email: 'zhao.expert@soil-science.ac.cn', phone: '138****8002', role: 'SOIL_EXPERT', department: '土壤健康评估中心', status: 'ACTIVE', lastLoginAt: '2024-06-07 14:20' },
  { id: 'u-004', username: 'ecologist', realName: '孙生态', email: 'sun.eco@soil-science.ac.cn', phone: '138****8003', role: 'ECOLOGIST', department: '生态模拟研究组', status: 'ACTIVE', lastLoginAt: '2024-06-06 16:45' },
  { id: 'u-005', username: 'farm', realName: '周农场', email: 'zhou.farm@greenfield-agri.com', phone: '138****8004', role: 'FARM_ADMIN', department: '绿野农业合作社', status: 'ACTIVE', lastLoginAt: '2024-06-05 08:00' },
  { id: 'u-006', username: 'zhang.wei', realName: '张维', email: 'zhang.wei@soil-science.ac.cn', phone: '139****2345', role: 'ECOLOGIST', department: '生态模拟研究组', status: 'INACTIVE', lastLoginAt: '2024-05-20 11:30' },
];

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      u.realName.includes(search) ||
      u.username.includes(search) ||
      u.email.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-gradient flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800 dark:text-white">
              用户管理
            </h1>
            <p className="text-sm text-slate-500 mt-1">管理系统用户、角色和权限配置</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-gradient text-white font-medium hover:shadow-lg hover:shadow-forest-500/20 transition-all">
          <UserPlus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户名、姓名、邮箱..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all"
            >
              <option value="all">全部角色</option>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  部门
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  最近登录
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-teal-600 flex items-center justify-center text-white font-semibold shrink-0">
                        {user.realName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                          {user.realName}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${ROLE_COLORS[user.role]}`}>
                      <Shield className="w-3 h-3" />
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {user.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-600/50 text-slate-500 dark:text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      {user.status === 'ACTIVE' ? '活跃' : '已停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {user.lastLoginAt}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-forest-600 hover:bg-forest-50 dark:hover:bg-forest-500/10 transition-all" title="编辑">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>共 {filtered.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">上一页</button>
            <button className="px-3 py-1.5 rounded-lg bg-forest-50 dark:bg-forest-500/10 text-forest-600 dark:text-forest-400 font-medium">1</button>
            <button className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
