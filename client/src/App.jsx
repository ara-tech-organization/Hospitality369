import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import { RequireAuth, RequirePermission } from './routes/guards';
import { PageLoader } from './components/ui/Feedback';
import { useAuth } from './context/AuthContext';
import { useVisibleNav } from './layouts/dashboardNav';
import { PERMISSIONS as P } from './lib/constants';

import Home from './pages/public/Home';
import Recruiting from './pages/public/Recruiting';
import ProgramPage from './pages/public/ProgramPage';
import Referrals from './pages/public/Referrals';
import Privacy from './pages/public/Privacy';
import Contact from './pages/public/Contact';
import NotFound from './pages/public/NotFound';
import { REFERRALS_ENABLED } from './lib/features';

// Dashboard is code-split so public pages stay fast
const Login = lazy(() => import('./pages/auth/Login'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Candidates = lazy(() => import('./pages/dashboard/Candidates'));
const Roles = lazy(() => import('./pages/dashboard/Roles'));
const ReferralAdmin = lazy(() => import('./pages/dashboard/ReferralAdmin'));
const Enquiries = lazy(() => import('./pages/dashboard/Enquiries'));
const Admins = lazy(() => import('./pages/dashboard/Admins'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const AuditLogs = lazy(() => import('./pages/dashboard/AuditLogs'));
const Account = lazy(() => import('./pages/dashboard/Account'));

/** Admins without analytics land on the first page they are allowed to see */
function DashboardHome() {
  const { can } = useAuth();
  const nav = useVisibleNav();
  if (can(P.ANALYTICS_VIEW)) return <Overview />;
  const first = nav[0]?.items[0]?.to;
  return first ? <Navigate to={first} replace /> : <Navigate to="/admin/account" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="recruiting" element={<Recruiting />} />
          <Route path="mentoring" element={<ProgramPage key="mentoring" module="mentoring" />} />
          <Route path="training" element={<ProgramPage key="training" module="training" />} />
          <Route path="coaching" element={<ProgramPage key="coaching" module="coaching" />} />
          {REFERRALS_ENABLED && <Route path="referrals" element={<Referrals />} />}
          <Route path="privacy" element={<Privacy />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />

        <Route path="admin" element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="candidates" element={<RequirePermission perm={P.CANDIDATES_VIEW}><Candidates /></RequirePermission>} />
            <Route path="roles" element={<RequirePermission perm={P.ROLES_MANAGE}><Roles /></RequirePermission>} />
            {REFERRALS_ENABLED && <Route path="referrals" element={<RequirePermission perm={P.REFERRALS_MANAGE}><ReferralAdmin /></RequirePermission>} />}
            <Route path="enquiries" element={<RequirePermission perm={P.ENQUIRIES_VIEW}><Enquiries /></RequirePermission>} />
            <Route path="admins" element={<RequirePermission superAdmin><Admins /></RequirePermission>} />
            <Route path="settings" element={<RequirePermission superAdmin><Settings /></RequirePermission>} />
            <Route path="audit-logs" element={<RequirePermission superAdmin><AuditLogs /></RequirePermission>} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
