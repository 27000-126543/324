import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  ListTodo,
  Menu,
  X,
  Leaf,
  LogOut,
  Bell,
  Search,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: '综合看板', icon: LayoutDashboard },
  { path: '/data-upload', label: '数据上传', icon: Upload },
  { path: '/simulation', label: '模拟任务', icon: ListTodo },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-white/95 backdrop-blur-xl border-r border-forest-600/10 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20 overflow-hidden'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-forest-600/10">
          <div className="w-10 h-10 rounded-xl bg-forest-gradient flex items-center justify-center shadow-card flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <div className="font-display font-semibold text-forest-800 text-lg whitespace-nowrap">
                  SoilSim
                </div>
                <div className="text-xs text-forest-600/60 whitespace-nowrap">
                  土壤微生物模拟平台
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(isActive ? 'nav-item-active' : 'nav-item')}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && sidebarOpen && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-forest-600/10">
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl bg-forest-50/60',
              !sidebarOpen && 'justify-center'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-forest-gradient flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-medium text-forest-800 truncate">
                    研究员
                  </div>
                  <div className="text-xs text-forest-600/60 truncate">
                    admin@soilsim.cn
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-8 py-4 bg-cream/80 backdrop-blur-xl border-b border-forest-600/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 rounded-xl border border-forest-600/10 bg-white/70 flex items-center justify-center text-forest-700 hover:bg-forest-50 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/40" />
              <input
                type="text"
                placeholder="搜索数据、任务、样本..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-forest-600/10 bg-white/70 text-sm text-forest-800 placeholder:text-forest-600/40 focus:outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-600/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative w-10 h-10 rounded-xl border border-forest-600/10 bg-white/70 flex items-center justify-center text-forest-700 hover:bg-forest-50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-critical" />
            </button>
            <button className="w-10 h-10 rounded-xl border border-forest-600/10 bg-white/70 flex items-center justify-center text-forest-700 hover:bg-forest-50 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
