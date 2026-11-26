import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageLoader, EmptyState } from '../components/ui/Feedback';
import Button from '../components/ui/Button';

/** Redirects to /login when there is no session */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function Forbidden() {
  return (
    <EmptyState
      icon={ShieldOff}
      title="You don't have access to this area"
      description="Your account doesn't include the permission needed for this page. Ask your Super Admin if you need access."
      action={<Button to="/admin" variant="outline">Back to dashboard</Button>}
      className="min-h-[60vh]"
    />
  );
}

/**
 * UI-level guard. NOTE: this only improves UX – every API endpoint enforces the same
 * permission on the server.
 */
export function RequirePermission({ perm, any, superAdmin, children }) {
  const { can, canAny, isSuperAdmin } = useAuth();
  if (superAdmin && !isSuperAdmin) return <Forbidden />;
  if (perm && !can(...[].concat(perm))) return <Forbidden />;
  if (any && !canAny(...any)) return <Forbidden />;
  return children;
}
