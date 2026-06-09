import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, ROLE_LABELS } from '@/stores/authStore';
import type { UserRole } from '../../../shared/types';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-2">
            无访问权限
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            此页面需要以下角色之一：
            <span className="block mt-2">
              {allowedRoles.map((r, i) => (
                <span key={r}>
                  <span className="inline-block px-2 py-0.5 mx-0.5 rounded-md bg-forest-50 dark:bg-forest-500/10 text-forest-700 dark:text-forest-400 text-sm font-medium">
                    {ROLE_LABELS[r]}
                  </span>
                  {i < allowedRoles.length - 1 && <span className="text-slate-400">或</span>}
                </span>
              ))}
            </span>
          </p>
          {user && (
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
              您当前的角色是：
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {ROLE_LABELS[user.role]}
              </span>
            </p>
          )}
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-gradient text-white font-medium hover:shadow-lg hover:shadow-forest-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
