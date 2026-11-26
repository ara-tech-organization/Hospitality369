export const PERMISSIONS = {
  ANALYTICS_VIEW: 'analytics:view',
  CANDIDATES_VIEW: 'candidates:view',
  CANDIDATES_UPDATE_STATUS: 'candidates:update_status',
  RESUMES_DOWNLOAD: 'resumes:download',
  CANDIDATES_EXPORT: 'candidates:export',
  ROLES_MANAGE: 'roles:manage',
  REFERRALS_MANAGE: 'referrals:manage',
  ENQUIRIES_VIEW: 'enquiries:view',
};

export const STATUSES = [
  { value: 'new', label: 'New', tone: 'blue' },
  { value: 'reviewing', label: 'Reviewing', tone: 'violet' },
  { value: 'shortlisted', label: 'Shortlisted', tone: 'brand' },
  { value: 'interview', label: 'Interview', tone: 'amber' },
  { value: 'offered', label: 'Offered', tone: 'teal' },
  { value: 'hired', label: 'Hired', tone: 'green' },
  { value: 'rejected', label: 'Rejected', tone: 'red' },
];
export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

export const INDUSTRIES = [
  { value: 'hotel', label: 'Hotels' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'bar', label: 'Bars' },
  { value: 'banquet', label: 'Banquet Halls' },
];
export const INDUSTRY_LABEL = { hotel: 'Hotel', restaurant: 'Restaurant', bar: 'Bar', banquet: 'Banquet' };

export const ENQUIRY_STATUSES = [
  { value: 'new', label: 'New', tone: 'blue' },
  { value: 'contacted', label: 'Contacted', tone: 'violet' },
  { value: 'enrolled', label: 'Enrolled', tone: 'green' },
  { value: 'closed', label: 'Closed', tone: 'slate' },
];

export const REJECTION_REASONS = {
  self_referral: 'Self-referral',
  already_referred: 'Candidate already referred',
  daily_limit: 'Daily limit reached',
  inactive_referrer: 'Referrer suspended',
  manual: 'Rejected by admin',
};
