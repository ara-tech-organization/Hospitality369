/**
 * Real-time dashboard updates over WebSockets (Socket.IO).
 *
 * - Sockets authenticate with the same httpOnly session cookie as the REST API.
 * - Each socket joins rooms for the user's permissions, so events (and any personal
 *   data inside them) only reach staff who are allowed to see them.
 * - `changed(scopes, perm)` tells dashboards to re-fetch; `notify(...)` sends toasts.
 * - When an admin's access changes, `refreshUser(id)` drops their sockets; the client
 *   reconnects and rooms are re-evaluated from the database.
 * All emit helpers are no-ops until `init()` runs (e.g. during tests).
 */
const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/User');

let io = null;

const room = {
  staff: 'staff',
  perm: (p) => `perm:${p}`,
  superadmin: 'superadmin',
  user: (id) => `user:${id}`,
};

async function authenticate(socket, next) {
  try {
    const token = cookie.parse(socket.handshake.headers.cookie || '')[env.cookieName];
    if (!token) return next(new Error('unauthorized'));
    const payload = jwt.verify(token, env.jwtSecret, { issuer: 'hospitality369' });
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || !user.active || (user.tokenVersion || 0) !== payload.tv) return next(new Error('unauthorized'));
    socket.data.user = user;
    return next();
  } catch {
    return next(new Error('unauthorized'));
  }
}

function init(httpServer) {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: env.clientOrigins, credentials: true },
    serveClient: false,
  });
  io.use(authenticate);
  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join([room.staff, room.user(String(user._id)), ...user.effectivePermissions().map(room.perm)]);
    if (user.isSuperAdmin()) socket.join(room.superadmin);
    socket.emit('ready', { at: Date.now() });
  });
  if (!env.isTest) console.log('[realtime] WebSocket server ready on /socket.io');
  return io;
}

/** Tell dashboards that data in these scopes changed (they re-fetch). */
function changed(scopes, perm) {
  if (!io) return;
  const target = perm ? io.to(room.perm(perm)) : io.to(room.staff);
  target.emit('dashboard:changed', { scopes: [].concat(scopes), at: Date.now() });
}

/** Changes only super admins should hear about (admins, settings, audit log). */
function changedForSuperAdmins(scopes) {
  if (!io) return;
  io.to(room.superadmin).emit('dashboard:changed', { scopes: [].concat(scopes), at: Date.now() });
}

/** Toast-style notification to holders of a permission. */
function notify(perm, event, payload) {
  if (!io) return;
  io.to(room.perm(perm)).emit(event, payload);
}

/** Force a user's sockets to reconnect so their rooms reflect new permissions. */
function refreshUser(userId) {
  if (!io) return;
  io.in(room.user(String(userId))).disconnectSockets(true);
}

module.exports = { init, changed, changedForSuperAdmins, notify, refreshUser };
