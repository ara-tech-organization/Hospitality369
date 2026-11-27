import {
  LayoutDashboard, Users, Briefcase, Gift, ShieldCheck, Settings, ScrollText, MessageSquareText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS as P } from '../lib/constants';
import { REFERRALS_ENABLED } from '../lib/features';

export const DASHBOARD_NAV = [
  { group: 'Recruitment', items: [
    { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard, perm: P.ANALYTICS_VIEW },
    { to: '/admin/candidates', label: 'Candidates', icon: Users, perm: P.CANDIDATES_VIEW },
    { to: '/admin/roles', label: 'Recruitment roles', icon: Briefcase, perm: P.ROLES_MANAGE },
    ...(REFERRALS_ENABLED ? [{ to: '/admin/referrals', label: 'Referrals', icon: Gift, perm: P.REFERRALS_MANAGE }] : []),
    { to: '/admin/enquiries', label: 'Enquiries & messages', icon: MessageSquareText, perm: P.ENQUIRIES_VIEW },
  ] },
  { group: 'Administration', items: [
    { to: '/admin/admins', label: 'Admins & permissions', icon: ShieldCheck, superAdmin: true },
    { to: '/admin/settings', label: 'Settings', icon: Settings, superAdmin: true },
    { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText, superAdmin: true },
  ] },
];

export function useVisibleNav() {
  const { can, isSuperAdmin } = useAuth();
  return DASHBOARD_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => (i.superAdmin ? isSuperAdmin : !i.perm || can(i.perm))),
  })).filter((g) => g.items.length);
}

