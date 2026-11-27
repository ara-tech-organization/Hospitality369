/* Integration tests – run with `npm test` (uses a separate *_test database) */
process.env.NODE_ENV = 'test';
process.env.FEATURE_REFERRALS = 'true'; // this suite also covers the (currently switched-off) referral programme
process.env.LOCAL_STORAGE_DIR = 'storage/test-resumes';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const request = require('supertest');

const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const JobRole = require('../src/models/JobRole');
const Application = require('../src/models/Application');
const { Referrer } = require('../src/models/Referral');
const { PERMISSIONS } = require('../src/constants');

// Tests never touch the real database: local MongoDB by default, override with TEST_MONGODB_URI
const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/hospitality369_test';
const PDF = Buffer.from('%PDF-1.4\n%test\n%%EOF\n');
const PASSWORD = 'StrongPass123';

let role;
let superAgent;
let limitedAgent;

async function login(email) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200, res.body.message);
  return agent;
}

const apply = (fields, file = PDF, filename = 'cv.pdf') => {
  const req = request(app).post('/api/public/applications');
  Object.entries(fields).forEach(([k, v]) => req.field(k, v));
  return req.attach('resume', file, { filename, contentType: filename.endsWith('.pdf') ? 'application/pdf' : 'application/msword' });
};

const base = () => ({ fullName: 'Test Candidate', email: 'cand@example.com', mobile: '+44 7700 900123', role: String(role._id), position: 'Head Chef', consent: 'true' });

before(async () => {
  await connectDB(TEST_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((m) => mongoose.model(m).init()));
  await User.create({ name: 'Super', email: 'super@test.com', password: PASSWORD, role: 'superadmin' });
  await User.create({ name: 'Limited', email: 'limited@test.com', password: PASSWORD, role: 'admin', permissions: [PERMISSIONS.CANDIDATES_VIEW] });
  role = await JobRole.create({ title: 'Chef', slug: 'chef', industry: 'restaurant', positions: ['Head Chef', 'Commis Chef'] });
  await JobRole.create({ title: 'Old Role', slug: 'old-role', industry: 'bar', active: false });
  superAgent = await login('super@test.com');
  limitedAgent = await login('limited@test.com');
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.rmSync(path.resolve(__dirname, '../storage/test-resumes'), { recursive: true, force: true });
});

describe('public', () => {
  test('lists only active roles', async () => {
    const res = await request(app).get('/api/public/roles');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.roles.map((r) => r.title), ['Chef']);
  });

  test('validates application fields', async () => {
    const res = await apply({ ...base(), email: 'not-an-email', mobile: '12' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.fields.email);
    assert.ok(res.body.details.fields.mobile);
  });

  test('rejects fake PDF (magic bytes)', async () => {
    const res = await apply(base(), Buffer.from('not really a pdf at all'), 'cv.pdf');
    assert.equal(res.status, 400);
    assert.match(res.body.message, /not a genuine/);
  });

  test('rejects disallowed file types', async () => {
    const res = await request(app)
      .post('/api/public/applications')
      .field(base())
      .attach('resume', Buffer.from('MZ...'), { filename: 'cv.exe', contentType: 'application/octet-stream' });
    assert.equal(res.status, 400);
  });

  test('rejects position not belonging to role', async () => {
    const res = await apply({ ...base(), position: 'Astronaut' });
    assert.equal(res.status, 400);
  });

  test('accepts a valid application and blocks duplicates', async () => {
    const ok = await apply(base());
    assert.equal(ok.status, 201, ok.body.message);
    assert.ok(ok.body.myReferral.code);
    const dup = await apply(base());
    assert.equal(dup.status, 409);
  });

  test('position is optional for listed roles', async () => {
    const res = await apply({ ...base(), email: 'nopos@example.com', mobile: '+447700900201', position: '' });
    assert.equal(res.status, 201, res.body.message);
  });

  test('"Others" requires a typed role and is stored without a role id', async () => {
    const missing = await apply({ ...base(), email: 'other1@example.com', mobile: '+447700900301', role: 'other', position: '' });
    assert.equal(missing.status, 400);
    assert.ok(missing.body.details.fields.position);

    const ok = await apply({ ...base(), email: 'other2@example.com', mobile: '+447700900302', role: 'other', position: 'Sommelier' });
    assert.equal(ok.status, 201, ok.body.message);
    assert.match(ok.body.message, /Sommelier/);
    const doc = await Application.findOne({ email: 'other2@example.com' });
    assert.equal(doc.role, null);
    assert.equal(doc.roleTitle, 'Others');
    assert.equal(doc.position, 'Sommelier');

    // same person + same typed role is a duplicate; a different typed role is fine
    const dup = await apply({ ...base(), email: 'other2@example.com', mobile: '+447700900302', role: 'other', position: 'sommelier' });
    assert.equal(dup.status, 409);
    const other = await apply({ ...base(), email: 'other2@example.com', mobile: '+447700900302', role: 'other', position: 'Barista' });
    assert.equal(other.status, 201);
  });

  test('rejects an unknown role value', async () => {
    const res = await apply({ ...base(), email: 'bad@example.com', role: 'not-a-role' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.fields.role);
  });

  test('contact form validates and stores a contact enquiry', async () => {
    const bad = await request(app).post('/api/public/contact').send({ name: 'A', email: 'x', topic: 'Nope', message: 'hi' });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.details.fields.topic && bad.body.details.fields.message && bad.body.details.fields.email);
    const ok = await request(app).post('/api/public/contact').send({ name: 'Meera Nair', email: 'meera@example.com', company: 'Lotus Hotels', topic: 'Hiring staff', message: 'We need 12 banquet servers for December.' });
    assert.equal(ok.status, 201);
    const list = await superAgent.get('/api/enquiries').query({ module: 'contact' });
    assert.equal(list.status, 200);
    assert.equal(list.body.items[0].topic, 'Hiring staff');
    assert.equal(list.body.items[0].company, 'Lotus Hotels');
  });

  test('awards referral points and blocks self-referral', async () => {
    const join = await request(app).post('/api/public/referrals/join').send({ name: 'Ref Errer', email: 'ref@example.com' });
    assert.equal(join.status, 201);
    const { code } = join.body.referrer;

    const res = await apply({ ...base(), email: 'friend@example.com', mobile: '+447700900999', referralCode: code });
    assert.equal(res.status, 201);
    assert.equal(res.body.referralApplied, true);

    const self = await apply({ ...base(), email: 'ref@example.com', mobile: '+447700900555', referralCode: code });
    assert.equal(self.body.referralApplied, false);

    const r = await Referrer.findOne({ code });
    assert.equal(r.totalPoints, 10);

    const lookup = await request(app).post('/api/public/referrals/lookup').send({ email: 'ref@example.com', code });
    assert.equal(lookup.status, 200);
    assert.equal(lookup.body.referrer.totalPoints, 10);
  });
});

describe('auth & RBAC', () => {
  test('dashboard requires authentication', async () => {
    const res = await request(app).get('/api/applications');
    assert.equal(res.status, 401);
  });

  test('wrong password gives generic error', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'super@test.com', password: 'nope' });
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  test('limited admin can list but not download, export or manage', async () => {
    const list = await limitedAgent.get('/api/applications');
    assert.equal(list.status, 200);
    const id = list.body.items[0]._id;
    assert.equal((await limitedAgent.get(`/api/applications/${id}/resume`)).status, 403);
    assert.equal((await limitedAgent.get('/api/applications/export')).status, 403);
    assert.equal((await limitedAgent.post('/api/roles').send({ title: 'X', industry: 'bar' })).status, 403);
    assert.equal((await limitedAgent.get('/api/admins')).status, 403);
    assert.equal((await limitedAgent.patch(`/api/applications/${id}/status`).send({ status: 'hired' })).status, 403);
  });

  test('permission changes apply immediately', async () => {
    const limited = await User.findOne({ email: 'limited@test.com' });
    const res = await superAgent.patch(`/api/admins/${limited._id}`).send({ permissions: [PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.RESUMES_DOWNLOAD] });
    assert.equal(res.status, 200);
    const list = await limitedAgent.get('/api/applications');
    const dl = await limitedAgent.get(`/api/applications/${list.body.items[0]._id}/resume`);
    assert.equal(dl.status, 200);
    assert.match(dl.headers['content-disposition'], /attachment/);
  });

  test('deactivating an admin revokes their session', async () => {
    const limited = await User.findOne({ email: 'limited@test.com' });
    await superAgent.patch(`/api/admins/${limited._id}`).send({ active: false });
    assert.equal((await limitedAgent.get('/api/auth/me')).status, 401);
  });
});

describe('management', () => {
  test('filters, searches and paginates', async () => {
    const res = await superAgent.get('/api/applications').query({ search: 'friend@', limit: 1 });
    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].email, 'friend@example.com');
    const bad = await superAgent.get('/api/applications').query({ status: 'bogus' });
    assert.equal(bad.status, 400);
  });

  test('filters candidates who chose "Others"', async () => {
    const res = await superAgent.get('/api/applications').query({ role: 'other', limit: 50 });
    assert.equal(res.status, 200);
    assert.ok(res.body.items.length >= 2);
    assert.ok(res.body.items.every((a) => a.roleTitle === 'Others' && a.position));
  });

  test('status change pays shortlist referral bonus once', async () => {
    const appDoc = await Application.findOne({ email: 'friend@example.com' });
    await superAgent.patch(`/api/applications/${appDoc._id}/status`).send({ status: 'shortlisted' });
    await superAgent.patch(`/api/applications/${appDoc._id}/status`).send({ status: 'interview' });
    const r = await Referrer.findOne({ email: 'ref@example.com' });
    assert.equal(r.totalPoints, 35);
  });

  test('exports Excel', async () => {
    const res = await superAgent.get('/api/applications/export').query({ scope: 'all' }).buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.subarray(0, 2).toString(), 'PK');
  });

  test('exports PDF and returns per-status counts', async () => {
    const pdf = await superAgent.get('/api/applications/export.pdf').query({ scope: 'all' }).buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers['content-type'], 'application/pdf');
    assert.equal(pdf.body.subarray(0, 5).toString(), '%PDF-');
    const list = await superAgent.get('/api/applications').query({ status: 'hired' });
    assert.equal(typeof list.body.statusCounts.new, 'number');
    assert.ok(list.body.statusCounts.new > 0, 'counts ignore the active status filter');
  });

  test('new roles appear on the public form; roles with applications cannot be deleted', async () => {
    const created = await superAgent.post('/api/roles').send({ title: 'Sommelier', industry: 'restaurant', positions: ['Head Sommelier'] });
    assert.equal(created.status, 201);
    const pub = await request(app).get('/api/public/roles');
    assert.ok(pub.body.roles.some((r) => r.title === 'Sommelier'));
    assert.equal((await superAgent.delete(`/api/roles/${role._id}`)).status, 409);
    assert.equal((await superAgent.delete(`/api/roles/${created.body.role._id}`)).status, 200);
  });

  test('audit log records admin actions', async () => {
    const res = await superAgent.get('/api/audit-logs');
    const actions = res.body.items.map((i) => i.action);
    assert.ok(actions.includes('candidates.exported'));
    assert.ok(actions.includes('application.status_changed'));
    assert.ok(actions.includes('admin.updated'));
  });

  test('NoSQL operator injection is neutralised on login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });
});
