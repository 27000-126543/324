import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Dna,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Bell,
  FlaskConical,
  FileBarChart,
  Users,
  HelpCircle,
  Upload,
  Lightbulb,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, ROLE_LABELS, ROLE_COLORS } from '@/stores/authStore';
import type { UserRole } from '@shared/types';
import { useUiStore } from '@/stores/uiStore';
import { useWarningStore } from '@/stores/warningStore';
import { useApprovalStore } from '@/stores/approvalStore';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: UserRole[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: '工作台', icon: LayoutDashboard, path: '/dashboard', roles: ['CHIEF_SCIENTIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'ECOLOGIST', 'FARM_ADMIN'] },
  { label: '数据上传', icon: Upload, path: '/upload', roles: ['CHIEF_SCIENTIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'ECOLOGIST'] },
  { label: '模拟任务', icon: FlaskConical, path: '/simulations', roles: ['CHIEF_SCIENTIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'ECOLOGIST', 'FARM_ADMIN'] },
  { label: '审批中心', icon: ClipboardCheck, path: '/approvals', roles: ['CHIEF_SCIENTIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT'] },
  { label: '推荐方案', icon: Lightbulb, path: '/recommendations', roles: ['CHIEF_SCIENTIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'ECOLOGIST', 'FARM_ADMIN'] },
  { label: '通知中心', icon: Bell, path: '/notifications', roles: ['CHIEF_SCIENTIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'ECOLOGIST', 'FARM_ADMIN'] },
  { label: '用户管理', icon: Users, path: '/admin/users', roles: ['CHIEF_SCIENTIST'] },
  { label: '阈值配置', icon: Gauge, path: '/admin/thresholds', roles: ['CHIEF_SCIENTIST'] },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, theme, setTheme, globalLoading, loadingText } = useUiStore();
  const { user, logout, hasRole } = useAuthStore();
  const { getPendingCount } = useWarningStore();
  const { getStats } = useApprovalStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const pendingWarnings = getPendingCount();
  const approvalStats = getStats();
  const pendingApprovals = approvalStats.pendingFirst + approvalStats.pendingSecond;

  const visibleNavItems = navItems.filter((item) => !item.roles || hasRole(item.roles));

  const itemsWithBadge = visibleNavItems.map((item) => {
    if (item.path === '/warnings') return { ...item, badge: pendingWarnings };
    if (item.path === '/approvals') return { ...item, badge: pendingApprovals };
    return item;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cycleTheme = () => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-900 flex">
      {globalLoading && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-300">{loadingText}</span>
          </div>
        </div>
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 z-40',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Dna className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-slate-800 dark:text-white text-sm truncate">微生模拟平台</span>
              <span className="text-xs text-slate-400 truncate">MicroBio Sim Platform</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {itemsWithBadge.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    )}
                  >
                    {isActive && !sidebarCollapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                    )}
                    <div className={cn(
                      'w-5 h-5 shrink-0',
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    )}>
                      <Icon className="w-full h-full" />
                    </div>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {!sidebarCollapsed && item.badge && item.badge > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {sidebarCollapsed && item.badge && item.badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-2 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-sm"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>收起菜单</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-60')}>
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-sm bg-white/95 dark:bg-slate-800/95">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <Home className="w-4 h-4" />
              </Link>
              {visibleNavItems
                .filter((item) => location.pathname.startsWith(item.path))
                .sort((a, b) => b.path.length - a.path.length)
                .slice(0, 1)
                .map((item) => (
                  <span key={item.path} className="flex items-center gap-2">
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
                  </span>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-64"
            >
              <Search className="w-4 h-4" />
              <span>搜索... (Ctrl+K)</span>
            </button>

            <button
              onClick={cycleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={`当前：${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}`}
            >
              {theme === 'light' && <Sun className="w-4 h-4" />}
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'system' && (
                <span className="text-xs font-medium">
                  <span className="hidden dark:inline"><Moon className="w-4 h-4" /></span>
                  <span className="dark:hidden"><Sun className="w-4 h-4" /></span>
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setUserMenuOpen(false);
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {pendingWarnings > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
                    {pendingWarnings > 9 ? '9+' : pendingWarnings}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">通知中心</h3>
                    <span className="text-xs text-slate-500">{pendingWarnings} 条待处理</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {pendingWarnings === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>暂无新通知</p>
                      </div>
                    ) : (
                      <Link
                        to="/warnings"
                        onClick={() => setNotificationOpen(false)}
                        className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                              您有 {pendingWarnings} 条预警待处理
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">点击查看预警中心详情</p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                    <Link
                      to="/warnings"
                      onClick={() => setNotificationOpen(false)}
                      className="block text-center text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium py-1.5"
                    >
                      查看全部预警
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotificationOpen(false);
                }}
                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {user?.realName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                    {user?.realName || '未登录'}
                  </div>
                  {user && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border inline-block mt-0.5', ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{user?.realName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                    {user?.department && (
                      <p className="text-xs text-slate-400 mt-0.5">{user.department}</p>
                    )}
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人中心
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      系统设置
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      帮助文档
                    </Link>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {(notificationOpen || userMenuOpen || searchOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setNotificationOpen(false);
            setUserMenuOpen(false);
            setSearchOpen(false);
          }}
        />
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="搜索模拟任务、预警、用户..."
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
              />
              <kbd className="hidden sm:block px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs text-slate-500">
                ESC
              </kbd>
            </div>
            <div className="p-2">
              <p className="text-xs text-slate-400 px-3 py-2">快速操作</p>
              <Link to="/simulations/new" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <Dna className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">新建模拟任务</p>
                  <p className="text-xs text-slate-500">创建新的微生物生长模拟实验</p>
                </div>
              </Link>
              <Link to="/simulations" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">查看模拟任务列表</p>
                  <p className="text-xs text-slate-500">浏览所有已创建的模拟任务</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
