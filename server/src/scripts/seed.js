/**
 * Seed baseline data.
 *   npm run seed        -> settings, Super Admin, starter roles & programmes (idempotent)
 *   npm run seed:demo   -> also creates a demo Admin and sample candidates/referrals for charts
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const JobRole = require('../models/JobRole');
const Setting = require('../models/Setting');
const Application = require('../models/Application');
const { Referrer, Referral } = require('../models/Referral');
const { Program } = require('../models/Program');
const storage = require('../services/storage');
const referralService = require('../services/referral.service');
const { slugify } = require('../utils/helpers');
const { USER_ROLES, PERMISSIONS } = require('../constants');

const DEMO = process.argv.includes('--demo');

const ROLES = [
  ['Hotel Manager', 'hotel', 'Lead hotel operations, revenue and guest satisfaction across departments.', ['General Manager', 'Hotel Manager', 'Assistant Hotel Manager', 'Duty Manager']],
  ['Front Office Executive', 'hotel', 'Deliver a flawless arrival-to-departure guest journey.', ['Front Office Manager', 'Front Office Supervisor', 'Front Office Executive', 'Guest Relations Executive']],
  ['Receptionist', 'hotel', 'Welcome guests, manage reservations and handle check-in/out.', ['Senior Receptionist', 'Receptionist', 'Night Receptionist']],
  ['Housekeeping Staff', 'hotel', 'Keep rooms and public areas immaculate to brand standards.', ['Executive Housekeeper', 'Housekeeping Supervisor', 'Room Attendant', 'Public Area Attendant', 'Laundry Attendant']],
  ['Restaurant Manager', 'restaurant', 'Run service, people and profitability for a busy restaurant.', ['Restaurant Manager', 'Assistant Restaurant Manager', 'Floor Manager']],
  ['Chef', 'restaurant', 'Create outstanding food and lead a disciplined kitchen brigade.', ['Executive Chef', 'Head Chef', 'Chef de Partie', 'Demi Chef de Partie', 'Commis Chef', 'Pastry Chef']],
  ['Sous Chef', 'restaurant', 'Second-in-command of the kitchen, owning prep, quality and rota.', ['Executive Sous Chef', 'Sous Chef', 'Junior Sous Chef']],
  ['Waiter/Waitress', 'restaurant', 'Deliver warm, knowledgeable table service.', ['Head Waiter', 'Senior Waiter/Waitress', 'Waiter/Waitress', 'Runner']],
  ['Bartender', 'bar', 'Craft drinks, run the bar and create a memorable atmosphere.', ['Bar Manager', 'Head Bartender', 'Bartender', 'Mixologist', 'Barback']],
  ['Banquet Manager', 'banquet', 'Plan and execute weddings, conferences and large-scale events.', ['Banquet Manager', 'Banquet Supervisor', 'Event Coordinator', 'Banquet Server']],
];

const PROGRAMS = [
  ['mentoring', 'Rising Leaders Mentorship', 'Pair with a senior hotel or F&B leader for structured monthly guidance.', '1:1 · 6 months', 'Supervisors & new managers', ['Monthly 1:1 sessions', 'Personal development plan', 'Industry network introductions']],
  ['mentoring', 'Kitchen Career Mentoring', 'Learn from experienced head chefs how to progress from commis to sous chef.', '1:1 · 3 months', 'Commis & CDP chefs', ['Kitchen leadership', 'Menu & costing basics', 'Career mapping']],
  ['mentoring', 'First Job in Hospitality', 'Friendly mentors for students and career changers entering hospitality.', 'Group · 6 weeks', 'Entry-level & graduates', ['CV & interview clinic', 'Workplace etiquette', 'Shadow shifts']],
  ['training', 'Front Office Excellence', 'Reservations, PMS essentials, upselling and complaint handling.', 'Blended · 4 weeks', 'Receptionists & FO agents', ['PMS hands-on', 'Service recovery', 'Certificate of completion']],
  ['training', 'F&B Service & Wine Basics', 'Table service standards, menu knowledge and wine fundamentals.', 'Classroom · 2 weeks', 'Waiters, runners & hosts', ['Silver service', 'Allergen awareness', 'Wine pairing basics']],
  ['training', 'Bartending & Mixology', 'Classic cocktails, speed techniques, stock control and responsible service.', 'Practical · 3 weeks', 'Aspiring & junior bartenders', ['25 classic cocktails', 'Bar set-up & stock', 'Responsible service']],
  ['training', 'Banquet & Events Operations', 'Event planning, function sheets, set-ups and large-scale service.', 'Blended · 3 weeks', 'Banquet staff & coordinators', ['BEO mastery', 'Room set-ups', 'Wedding operations']],
  ['coaching', 'Hospitality Leadership Coaching', 'Executive coaching for managers leading teams and P&Ls.', '1:1 · 8 sessions', 'Managers & department heads', ['360° feedback', 'Team performance', 'Commercial acumen']],
  ['coaching', 'Interview & Career Coaching', 'Targeted coaching to land your next hospitality role.', '1:1 · 3 sessions', 'All hospitality professionals', ['Mock interviews', 'CV rewrite', 'Salary negotiation']],
  ['coaching', 'Guest Experience Coaching for Teams', 'On-site coaching that lifts service culture and review scores.', 'Team · flexible', 'Hotels, restaurants & bars', ['Service audits', 'Team workshops', 'Review score tracking']],
];

const FIRST = ['Aarav', 'Priya', 'Liam', 'Sofia', 'Mateo', 'Amara', 'Noah', 'Isla', 'Arjun', 'Chloe', 'Kwame', 'Mei', 'Lucas', 'Fatima', 'Ethan', 'Zara', 'Omar', 'Hannah', 'Diego', 'Ananya', 'Oliver', 'Leila', 'Rohan', 'Grace'];
const LAST = ['Sharma', 'Patel', "O'Connor", 'Rossi', 'Garcia', 'Okafor', 'Smith', 'Chen', 'Nair', 'Dubois', 'Mensah', 'Wong', 'Silva', 'Khan', 'Brown', 'Ali', 'Haddad', 'Fischer', 'Lopez', 'Iyer'];

// Minimal valid PDF used for demo resumes
const DEMO_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 58>>stream\nBT /F1 18 Tf 72 760 Td (Demo CV - Hospitality369 sample) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
);

const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function seedBase() {
  await Setting.get();
  console.log('✓ settings');

  if (!(await User.exists({ role: USER_ROLES.SUPER_ADMIN }))) {
    if (!env.superAdmin.email || !env.superAdmin.password) throw new Error('Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env');
    await User.create({ name: env.superAdmin.name, email: env.superAdmin.email, password: env.superAdmin.password, role: USER_ROLES.SUPER_ADMIN });
    console.log(`✓ super admin created: ${env.superAdmin.email}`);
  } else {
    console.log('• super admin already exists');
  }

  if (!(await JobRole.estimatedDocumentCount())) {
    await JobRole.insertMany(ROLES.map(([title, industry, description, positions], i) => ({ title, slug: slugify(title), industry, description, positions, sortOrder: i })));
    console.log(`✓ ${ROLES.length} starter recruitment roles`);
  } else {
    console.log('• roles already exist – skipped');
  }

  if (!(await Program.estimatedDocumentCount())) {
    await Program.insertMany(
      PROGRAMS.map(([module, title, summary, format, audience, highlights], i) => ({ module, title, slug: slugify(title), summary, format, audience, highlights, sortOrder: i }))
    );
    console.log(`✓ ${PROGRAMS.length} programmes`);
  }
}

async function seedDemo() {
  if (!(await User.exists({ email: 'admin.demo@hospitality369.com' }))) {
    await User.create({
      name: 'Demo Recruiter',
      email: 'admin.demo@hospitality369.com',
      password: 'DemoAdmin!2026',
      role: USER_ROLES.ADMIN,
      permissions: [PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.CANDIDATES_UPDATE_STATUS, PERMISSIONS.RESUMES_DOWNLOAD],
    });
    console.log('✓ demo admin: admin.demo@hospitality369.com / DemoAdmin!2026 (limited permissions)');
  }

  if ((await Application.estimatedDocumentCount()) > 0) {
    console.log('• applications already exist – demo candidates skipped');
    return;
  }

  const roles = await JobRole.find({ active: true });
  const referrers = [];
  for (const [name, email] of [['Sophie Turner', 'sophie.referrer@example.com'], ['Rahul Mehta', 'rahul.referrer@example.com'], ['Daniel Kim', 'daniel.referrer@example.com']]) {
    // eslint-disable-next-line no-await-in-loop
    referrers.push((await referralService.enrol({ name, email, source: 'signup' })).referrer);
  }

  const statuses = ['new', 'new', 'new', 'reviewing', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];
  const N = 64;
  for (let i = 0; i < N; i += 1) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const role = pick(roles);
    const created = new Date(Date.now() - Math.floor(Math.random() * 29 * 86400000) - Math.floor(Math.random() * 3600000));
    if (i < 3) created.setTime(Date.now() - i * 1800000); // a few from today
    const status = pick(statuses);
    // eslint-disable-next-line no-await-in-loop
    const key = await storage.save(DEMO_PDF, { ext: '.pdf', mimeType: 'application/pdf' });
    // eslint-disable-next-line no-await-in-loop
    const app = await Application.create({
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${i}@example.com`.toLowerCase().replace(/'/g, ''),
      mobile: `+44 7${String(100000000 + Math.floor(Math.random() * 899999999)).slice(0, 9)}`.replace(/\s/g, ''),
      role: role._id,
      roleTitle: role.title,
      industry: role.industry,
      position: pick(role.positions),
      consent: true,
      status,
      resume: { driver: storage.name(), key, originalName: `${first}_${last}_CV.pdf`.replace(/'/g, ''), mimeType: 'application/pdf', size: DEMO_PDF.length },
      statusHistory: [{ status: 'new', note: 'Application submitted', changedByName: 'Candidate', at: created }, ...(status !== 'new' ? [{ status, changedByName: 'Demo seed', at: created }] : [])],
      createdAt: created,
      updatedAt: created,
    });
    if (i % 4 === 0) {
      const ref = referrers[i % referrers.length];
      // eslint-disable-next-line no-await-in-loop
      await referralService.recordReferral(app, ref.code);
      // eslint-disable-next-line no-await-in-loop
      await referralService.onStatusChange(app, status);
    }
  }
  console.log(`✓ ${N} demo applications, ${await Referral.countDocuments()} referrals, ${await Referrer.countDocuments()} referrers`);
}

(async () => {
  await connectDB();
  await Promise.all([User.init(), JobRole.init(), Application.init(), Referrer.init(), Referral.init(), Program.init()]);
  await seedBase();
  if (DEMO) await seedDemo();
  await mongoose.disconnect();
  console.log('Done.');
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
