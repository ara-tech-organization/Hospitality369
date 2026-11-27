/* With FEATURE_REFERRALS unset (the default), the referral programme must be fully switched off. */
process.env.NODE_ENV = 'test';
delete process.env.FEATURE_REFERRALS;
process.env.LOCAL_STORAGE_DIR = 'storage/test-resumes-off';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const request = require('supertest');

const { connectDB } = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const JobRole = require('../src/models/JobRole');
const { Referrer, Referral } = require('../src/models/Referral');

const TEST_URI = process.env.TEST_MONGODB_URI_OFF || 'mongodb://127.0.0.1:27017/hospitality369_test_off';
const PDF = Buffer.from('%PDF-1.4\n%test\n%%EOF\n');
let role;
let agent;

before(async () => {
  await connectDB(TEST_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((m) => mongoose.model(m).init()));
  await User.create({ name: 'Super', email: 'super@test.com', password: 'StrongPass123', role: 'superadmin' });
  role = await JobRole.create({ title: 'Chef', slug: 'chef', industry: 'restaurant', positions: ['Head Chef'] });
  agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'super@test.com', password: 'StrongPass123' });
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.rmSync(path.resolve(__dirname, '../storage/test-resumes-off'), { recursive: true, force: true });
});

test('public and admin referral endpoints are not available', async () => {
  // anonymous visitors: route doesn't exist, so it is refused (401/404) – never served
  for (const res of [await request(app).get('/api/public/referrals/leaderboard'), await request(app).post('/api/public/referrals/join').send({ name: 'A B', email: 'a@b.co' })]) {
    assert.ok([401, 404].includes(res.status), `unexpected ${res.status}`);
  }
  // signed-in admin: the route is simply not there
  assert.equal((await agent.get('/api/referrals/summary')).status, 404);
  assert.equal((await agent.get('/api/public/referrals/leaderboard')).status, 404);
});

test('public config reports referrals disabled', async () => {
  const res = await request(app).get('/api/public/config');
  assert.equal(res.body.config.referral.enabled, false);
});

test('applying creates no referral codes or referral records', async () => {
  const res = await request(app)
    .post('/api/public/applications')
    .field({ fullName: 'Test Person', email: 'cand@example.com', mobile: '+447700900123', role: String(role._id), consent: 'true', referralCode: 'H369-AAAAAA' })
    .attach('resume', PDF, { filename: 'cv.pdf', contentType: 'application/pdf' });
  assert.equal(res.status, 201, res.body.message);
  assert.equal(res.body.myReferral, null);
  assert.equal(res.body.referralApplied, false);
  assert.equal(await Referrer.countDocuments(), 0);
  assert.equal(await Referral.countDocuments(), 0);
});

test('referral permission is hidden from the admin permission list, and sitemap omits /referrals', async () => {
  const me = await agent.get('/api/auth/me');
  assert.ok(!me.body.permissionCatalog.some((p) => p.key === 'referrals:manage'));
  const sitemap = await request(app).get('/sitemap.xml');
  assert.ok(!sitemap.text.includes('/referrals'));
});
