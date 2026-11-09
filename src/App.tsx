import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersTab } from './pages/tabs/UsersTab';
import { PaymentsTab } from './pages/tabs/PaymentsTab';
import { SubscriptionsTab } from './pages/tabs/SubscriptionsTab';
import { PlansTab } from './pages/tabs/PlansTab';
import { RevenueTab } from './pages/tabs/RevenueTab';
import { ManualPaymentsTab } from './pages/tabs/ManualPaymentsTab';
import { OverviewTab } from './pages/tabs/OverviewTab';

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        >
          <Route index element={<OverviewTab />} />
          <Route path="users" element={<UsersTab />} />
          <Route path="payments" element={<PaymentsTab />} />
          <Route path="subscriptions" element={<SubscriptionsTab />} />
          <Route path="plans" element={<PlansTab />} />
          <Route path="revenue" element={<RevenueTab />} />
          <Route path="manual-payments" element={<ManualPaymentsTab />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
