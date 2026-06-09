import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { UserRole } from '../shared/types';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import DataUpload from '@/pages/DataUpload';
import SimulationList from '@/pages/SimulationList';
import SimulationDetail from '@/pages/SimulationDetail';
import MetabolicNetwork from '@/pages/MetabolicNetwork';
import ReportPreview from '@/pages/ReportPreview';
import Recommendations from '@/pages/Recommendations';
import ApprovalsCenter from '@/pages/ApprovalsCenter';
import Notifications from '@/pages/Notifications';
import UserManagement from '@/pages/admin/UserManagement';
import ThresholdManagement from '@/pages/admin/ThresholdManagement';
import NotFound from '@/pages/NotFound';

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/upload" element={<DataUpload />} />

        <Route path="/simulations" element={<SimulationList />} />
        <Route path="/simulations/:id" element={<SimulationDetail />} />
        <Route path="/simulations/:id/network" element={<MetabolicNetwork />} />

        <Route path="/reports/:id" element={<ReportPreview />} />

        <Route path="/recommendations" element={<Recommendations />} />

        <Route
          path="/approvals"
          element={
            <ProtectedRoute allowedRoles={['MICROBE_VALIDATOR', 'SOIL_EXPERT', 'CHIEF_SCIENTIST'] as UserRole[]}>
              <ApprovalsCenter />
            </ProtectedRoute>
          }
        />

        <Route path="/notifications" element={<Notifications />} />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['CHIEF_SCIENTIST'] as UserRole[]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/thresholds"
          element={
            <ProtectedRoute allowedRoles={['CHIEF_SCIENTIST'] as UserRole[]}>
              <ThresholdManagement />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
