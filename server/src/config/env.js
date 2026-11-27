const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('change-me'))) {
  throw new Error('JWT_SECRET must be a strong random value (32+ chars) in production');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 5000,
  siteUrl: (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: 'h369_session',
  /** Feature switches. Referral programme is OFF until its requirements are finalised. */
  features: {
    referrals: process.env.FEATURE_REFERRALS === 'true',
  },
  superAdmin: {
    name: process.env.SUPERADMIN_NAME || 'Super Admin',
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: path.resolve(__dirname, '../..', process.env.LOCAL_STORAGE_DIR || 'storage/resumes'),
    maxResumeBytes: (Number(process.env.MAX_RESUME_MB) || 5) * 1024 * 1024,
    s3: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
    },
  },
};
