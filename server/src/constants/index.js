/**
 * Fine-grained permissions that a Super Admin can grant to Admin users.
 * Super Admins implicitly hold every permission, plus the super-admin-only
 * areas (admin accounts, settings, audit logs).
 */
const PERMISSIONS = Object.freeze({
  ANALYTICS_VIEW: 'analytics:view',
  CANDIDATES_VIEW: 'candidates:view',
  CANDIDATES_UPDATE_STATUS: 'candidates:update_status',
  RESUMES_DOWNLOAD: 'resumes:download',
  CANDIDATES_EXPORT: 'candidates:export',
  ROLES_MANAGE: 'roles:manage',
  REFERRALS_MANAGE: 'referrals:manage',
  ENQUIRIES_VIEW: 'enquiries:view',
});

const PERMISSION_META = [
  { key: PERMISSIONS.ANALYTICS_VIEW, label: 'View analytics', description: 'Dashboard statistics, charts and trends' },
  { key: PERMISSIONS.CANDIDATES_VIEW, label: 'View candidate applications', description: 'Candidate list, details and filters' },
  { key: PERMISSIONS.CANDIDATES_UPDATE_STATUS, label: 'Update application status', description: 'Move candidates through the pipeline and add notes' },
  { key: PERMISSIONS.RESUMES_DOWNLOAD, label: 'Download resumes', description: 'Download candidate CV/resume files' },
  { key: PERMISSIONS.CANDIDATES_EXPORT, label: 'Export Excel reports', description: 'Export candidate data to .xlsx' },
  { key: PERMISSIONS.ROLES_MANAGE, label: 'Manage recruitment roles', description: 'Create, edit, activate and delete roles' },
  { key: PERMISSIONS.REFERRALS_MANAGE, label: 'Manage referrals', description: 'View referrers and referrals, adjust points' },
  { key: PERMISSIONS.ENQUIRIES_VIEW, label: 'Manage programme enquiries', description: 'Mentoring, training & coaching enquiries' },
];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const USER_ROLES = Object.freeze({ SUPER_ADMIN: 'superadmin', ADMIN: 'admin' });

/** Ordered recruitment pipeline */
const APPLICATION_STATUSES = ['new', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];

/** Industries this platform serves – recruitment is restricted to these */
const INDUSTRIES = ['hotel', 'restaurant', 'bar', 'banquet'];

const PROGRAM_MODULES = ['mentoring', 'training', 'coaching'];

/** Special role value used when a candidate's role is not in the list */
const OTHER_ROLE = 'other';
const OTHER_ROLE_TITLE = 'Others';

const ENQUIRY_STATUSES = ['new', 'contacted', 'enrolled', 'closed'];

/** Where an enquiry came from: a programme page or the Contact Us page */
const ENQUIRY_SOURCES = [...PROGRAM_MODULES, 'contact'];
const CONTACT_TOPICS = ['Hiring staff', 'Finding a job', 'Mentoring', 'Training', 'Coaching', 'Consulting', 'Franchise', 'Catering & events', 'Something else'];

module.exports = {
  PERMISSIONS,
  PERMISSION_META,
  ALL_PERMISSIONS,
  USER_ROLES,
  APPLICATION_STATUSES,
  INDUSTRIES,
  PROGRAM_MODULES,
  ENQUIRY_STATUSES,
  OTHER_ROLE,
  OTHER_ROLE_TITLE,
  ENQUIRY_SOURCES,
  CONTACT_TOPICS,
};
