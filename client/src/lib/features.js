/**
 * Feature switches for the website and dashboard.
 * The referral programme ("Refer & Earn") is OFF until its requirements are finalised.
 * To switch it back on, set VITE_FEATURE_REFERRALS=true in client/.env and
 * FEATURE_REFERRALS=true in server/.env, then rebuild.
 */
export const REFERRALS_ENABLED = import.meta.env.VITE_FEATURE_REFERRALS === 'true';
