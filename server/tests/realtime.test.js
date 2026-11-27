/* Live dashboard updates over WebSockets: authentication and permission-scoped delivery. */
process.env.NODE_ENV = 'test';
process.env.LOCAL_STORAGE_DIR = 'storage/test-resumes-rt';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const request = require('supertest');
const { io: connect } = require('socket.io-client');

const { connectDB } = require('../src/config/db');
const app = require('../src/app');
const realtime = require('../src/realtime');
const User = require('../src/models/User');
const JobRole = require('../src/models/JobRole');
const { PERMISSIONS } = require('../src/constants');

const TEST_URI = process.env.TEST_MONGODB_URI_RT || 'mongodb://127.0.0.1:27017/hospitality369_test_rt';
const PDF = Buffer.from('%PDF-1.4\n%test\n%%EOF\n');
let server;
let base;
let role;
const sockets = [];

async function cookieFor(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123' });
  return res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
}

function open(cookie) {
  const s = connect(base, { path: '/socket.io', transports: ['websocket'], extraHeaders: cookie ? { Cookie: cookie } : {}, reconnection: false });
  sockets.push(s);
  s.ready = new Promise((resolve) => s.once('ready', resolve)); // listen from the start
  return s;
}

const once = (s, event, ms = 3000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    s.once(event, (v) => { clearTimeout(t); resolve(v); });
  });

const never = (s, event, ms = 700) =>
  new Promise((resolve, reject) => {
    const h = () => reject(new Error(`unexpected ${event}`));
    s.once(event, h);
    setTimeout(() => { s.off(event, h); resolve(); }, ms);
  });

before(async () => {
  await connectDB(TEST_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((m) => mongoose.model(m).init()));
  await User.create({ name: 'Super', email: 'super@test.com', password: 'StrongPass123', role: 'superadmin' });
  await User.create({ name: 'Analyst', email: 'analyst@test.com', password: 'StrongPass123', role: 'admin', permissions: [PERMISSIONS.ANALYTICS_VIEW] });
  role = await JobRole.create({ title: 'Chef', slug: 'chef', industry: 'restaurant', positions: ['Head Chef'] });
  server = http.createServer(app);
  realtime.init(server);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  sockets.forEach((s) => s.close());
  await new Promise((r) => server.close(r));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.rmSync(path.resolve(__dirname, '../storage/test-resumes-rt'), { recursive: true, force: true });
});

test('connections without a valid session are refused', async () => {
  const s = open(null);
  const err = await once(s, 'connect_error');
  assert.equal(err.message, 'unauthorized');
});

test('new application: refresh for all staff, candidate name only for candidate viewers', async () => {
  const sup = open(await cookieFor('super@test.com'));
  const analyst = open(await cookieFor('analyst@test.com'));
  await Promise.all([sup.ready, analyst.ready]);

  const supChanged = once(sup, 'dashboard:changed');
  const supToast = once(sup, 'application:created');
  const analystChanged = once(analyst, 'dashboard:changed');
  const analystNoToast = never(analyst, 'application:created');

  const res = await request(app)
    .post('/api/public/applications')
    .field({ fullName: 'Live Candidate', email: 'live@example.com', mobile: '+447700900123', role: String(role._id), consent: 'true' })
    .attach('resume', PDF, { filename: 'cv.pdf', contentType: 'application/pdf' });
  assert.equal(res.status, 201, res.body.message);

  assert.deepEqual((await supChanged).scopes, ['applications']);
  assert.equal((await supToast).name, 'Live Candidate');
  assert.deepEqual((await analystChanged).scopes, ['applications']);
  await analystNoToast;
});

test('changing an admin’s permissions disconnects their live session to re-check access', async () => {
  const analystCookie = await cookieFor('analyst@test.com');
  const analyst = open(analystCookie);
  await analyst.ready;
  const dropped = once(analyst, 'disconnect');
  const supAgent = request.agent(app);
  await supAgent.post('/api/auth/login').send({ email: 'super@test.com', password: 'StrongPass123' });
  const target = await User.findOne({ email: 'analyst@test.com' });
  const r = await supAgent.patch(`/api/admins/${target._id}`).send({ permissions: [PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.CANDIDATES_VIEW] });
  assert.equal(r.status, 200);
  assert.equal(await dropped, 'io server disconnect');
});
