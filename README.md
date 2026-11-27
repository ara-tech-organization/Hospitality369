# Hospitality369

Recruitment and professional-development platform for **hotels, restaurants, bars and banquet halls**, built on the MERN stack.

| Area | What's included |
|---|---|
| **Public site** | Landing page, Recruiting (application form + CV upload), Mentoring, Training, Coaching, Refer & Earn, Privacy |
| **Dashboard** | Analytics overview, candidate management with filters and Excel export, recruitment roles, referrals, programme enquiries |
| **Super Admin** | Admin accounts and per-permission RBAC, settings (incl. referral point rules), audit logs |

---

## Quick start

Prerequisites: Node 18+ (tested on 22) and MongoDB running locally (or a MongoDB Atlas URI).

```bash
npm run install:all                 # root + server + client deps
cp server/.env.example server/.env  # then set JWT_SECRET and SUPERADMIN_* values
npm run seed                        # settings, Super Admin, 10 starter roles, programmes
npm run seed:demo                   # optional: demo admin + 64 sample candidates & referrals
npm run dev                         # API on :5000, web on :5173 (Vite proxies /api)
```

Sign in at **http://localhost:5173/login** with the `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` from `server/.env`.
`seed:demo` also creates `admin.demo@hospitality369.com` / `DemoAdmin!2026`, a limited admin you can use to see RBAC from that side.

Run the API test suite with `npm test`. It always uses a separate local database (`hospitality369_test` on 127.0.0.1), or `TEST_MONGODB_URI` if set, and never your Atlas data.

### Production

```bash
npm run build      # builds client/dist
NODE_ENV=production npm start
```

In production, Express serves the built React app itself and injects per-route `<title>`, description, canonical and OG/Twitter tags into the HTML, so crawlers and link previews get correct metadata without running JavaScript. Set `SITE_URL` and `CLIENT_ORIGINS` to your domain, and run behind HTTPS so the session cookie is sent with `Secure`.

---

## Architecture

```
hospitality369/
├── shared/seo-pages.json        # single source of SEO titles/descriptions (client + server)
├── server/src/
│   ├── config/                  # env validation, Mongo connection
│   ├── constants/               # permissions catalog, statuses, industries
│   ├── models/                  # User, JobRole, Application, Referrer/Referral, Setting, AuditLog, Program/Enquiry
│   ├── middleware/              # auth (JWT cookie + RBAC), upload (magic-byte check), validate (zod), rate limits, errors
│   ├── services/                # storage drivers (local | s3), referral engine, audit logger
│   ├── controllers/             # one per domain
│   ├── routes/index.js          # every route and the permission it requires, in one file
│   ├── seo/                     # sitemap.xml, robots.txt, server-side meta injection
│   └── scripts/seed.js
├── server/tests/api.test.js     # integration tests (auth, RBAC, uploads, referrals, export, audit)
└── client/src/
    ├── components/ui/           # design system: Button, Form, Feedback, Overlay, Data, FileDrop
    ├── components/{layout,brand,seo,recruiting}/
    ├── layouts/                 # PublicLayout, DashboardLayout (lazy-loaded), dashboardNav
    ├── pages/public/            # Home, Recruiting, ProgramPage (mentoring/training/coaching), Referrals…
    ├── pages/dashboard/         # Overview, Candidates, Roles, ReferralAdmin, Enquiries, Admins, Settings, AuditLogs, Account
    ├── context/                 # Auth (session + can()), Toast
    ├── hooks/                   # useApi, useDebounced, usePublicConfig
    └── routes/guards.jsx        # RequireAuth / RequirePermission (UX only – API enforces)
```

### Brand & design system

- **Palette (from the logo):** royal navy `navy-*` (the wordmark; `navy-950` `#0b1030` for dark sections) and sunrise orange `brand-*` (the hexagon mark and "369"; `brand-500` `#f7901e`). Both are defined in [tailwind.config.js](client/tailwind.config.js).
- **Type:** Outfit (display, geometric like the wordmark) and Plus Jakarta Sans (body).
- **Logo:** the official `client/public/logo.webp` (237×60) is rendered by [Logo.jsx](client/src/components/brand/Logo.jsx). On dark backgrounds it sits on a white badge. `favicon.png`, `apple-touch-icon.png` and `og-image.png` are generated from it. Replace the file with a larger PNG or SVG for sharper rendering on high-DPI screens.
- **Motion kit:** [components/motion](client/src/components/motion/index.jsx) provides `Reveal` (scroll-in), `SpotlightCard` (cursor-following glow plus a gradient border on hover), `Tilt` (3D pointer tilt), `CountUp`, `RotatingWords`, `HexIcon` and `ScrollProgress`. The CSS effects (`.spotlight`, `.shine`, `.hex`, `.hex-pattern`, `.brand-text`) live in [index.css](client/src/index.css). All motion respects `prefers-reduced-motion`.
- **Photography:** 19 self-hosted WebP photos in `client/public/images`, from Unsplash under the Unsplash License (free for commercial use, no attribution required). Replace them with your own event and property photos at any time; the mapping lives in `IMAGES` in [content/site.js](client/src/content/site.js).
- **Menu:** Gallery (`/gallery`) and Contact Us (`/contact`) are in the main menu and footer. Their pages are not built yet, so the links currently show the 404 page.
- **Company content:** taken from hospitality369.in (about text, services, stats, client names, Chennai contact details) and kept in [content/site.js](client/src/content/site.js).

### Live dashboard (WebSockets)

The dashboard updates itself in real time over Socket.IO (`server/src/realtime.js`, `client/src/context/RealtimeContext.jsx`) – no manual refresh needed. New applications, status changes, enquiries/messages, role, admin and audit-log changes are pushed to open dashboards, which re-fetch only the affected data; new applications and enquiries also pop up a notification. A **Live** pill in the top bar shows the connection state.

- Sockets authenticate with the same httpOnly session cookie as the API; anonymous connections are refused.
- Events are routed by permission, so candidate names are only sent to staff who may view candidates.
- When an admin's permissions change, or they are deactivated or deleted, their live connection is dropped and re-checked.
- **Deployment:** if the app runs behind a reverse proxy (Nginx, a load balancer), it must forward WebSocket upgrades for `/socket.io` (in Nginx: `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`). If WebSockets are blocked, Socket.IO falls back to long-polling automatically.

### Feature switches

- **Referral programme (Refer & Earn): currently OFF.** The referral pages, menu links, dashboard section, settings card, API routes and the referral-code field on the application form are all disabled, and new applications don't create referral codes. The code and any existing referral data are kept, so it can be revised and switched back on once requirements are agreed. To turn it on, set `FEATURE_REFERRALS=true` in `server/.env` **and** `VITE_FEATURE_REFERRALS=true` in `client/.env`, then rebuild the client.

### Security model

- **Sessions**: JWT in an `httpOnly`, `SameSite=Strict` cookie (`Secure` in production). Tokens carry a `tokenVersion`, so logging out, changing a password, a password reset or deactivating an admin revokes every existing session at once.
- **Authorisation**: the user and their permissions are reloaded from the database on every request, so revoking a permission takes effect on the admin's very next click. Each route declares its permission in `routes/index.js`. The UI hides what you can't use, but the API is the source of truth.
- **Login protection**: generic error messages, rate limiting (10 per 15 min per IP), and a 15-minute lockout after 5 failed attempts.
- **Uploads**: PDF/DOC/DOCX only, size limited (`MAX_RESUME_MB`). The extension, the MIME type and the actual file signature (magic bytes) must all agree. Files get random keys and are stored outside any public folder. They can only be streamed through `GET /api/applications/:id/resume`, which needs the `resumes:download` permission and is audit-logged.
- **Input**: every body and query is validated with zod (unknown keys are stripped), `express-mongo-sanitize` blocks NoSQL operator injection, search terms are regex-escaped, and public forms have honeypots and rate limits.
- **Headers**: Helmet with a strict CSP, `X-Robots-Tag: noindex` on the API and dashboard, and `no-store` on API responses.
- **Audit log**: sign-ins and sign-outs, application views, status changes, resume downloads, exports, role/admin/settings changes, point adjustments and referral rejections.

### Permissions (assigned to Admins by the Super Admin)

| Key | Grants |
|---|---|
| `analytics:view` | Dashboard overview and charts |
| `candidates:view` | Candidate list, details and filters |
| `candidates:update_status` | Pipeline status changes and notes |
| `resumes:download` | CV downloads |
| `candidates:export` | Excel export (filtered or all) |
| `roles:manage` | Create, edit, activate/deactivate and delete roles |
| `referrals:manage` | Referrers and referrals, point adjustments, rejecting fraudulent referrals |
| `enquiries:view` | Mentoring/Training/Coaching enquiries |

Only the Super Admin can manage admins, settings (including referral point rules), audit logs, and permanently delete applications.

### Key business rules

- **Roles are never hard-coded.** Only *active* roles from MongoDB show up on the application form. A role can have a list of positions (candidates pick one); with none, the candidate types the position. A role that has applications can't be deleted, only deactivated, so history is kept.
- **Duplicate applications**: the same email *or* mobile can't apply to the same role again within `duplicateWindowDays` (default 30, configurable).
- **Referrals**: every applicant gets their own referral code automatically, and anyone can join at `/referrals`. Points are paid once per milestone (apply → shortlisted → hired), and the amounts are configurable. A referral is rejected automatically for self-referral (same email or mobile), a candidate already credited to someone else, the daily cap, or a suspended referrer. Admins can reject a referral by hand, which reverses its points.

### SEO

- SEO-friendly routes (`/recruiting`, `/mentoring`, …), per-page titles, descriptions, canonical URLs, Open Graph and Twitter cards
- `/sitemap.xml` and `/robots.txt` are generated from `SITE_URL`. Robots disallows `/admin`, `/login` and `/api`.
- JSON-LD: Organization, WebSite, FAQPage (home), ItemList of roles (recruiting), Course list (programme pages)
- Dashboard and login are `noindex` both in the HTML and through `X-Robots-Tag`. Unknown routes return a real 404.
- Public pages use semantic landmarks and a sensible heading order. The dashboard bundle and Recharts are code-split, so they never load on public pages.
- Search Console: verify the domain, submit `${SITE_URL}/sitemap.xml`.

---

## Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | Long random secret. Startup is refused in production if it's weak. |
| `JWT_EXPIRES_IN` | Session length (default `8h`) |
| `SITE_URL` / `CLIENT_ORIGINS` | Public URL (canonical links, sitemap, referral links) and the CORS allow-list |
| `SUPERADMIN_*` | First Super Admin, created by `npm run seed` |
| `STORAGE_DRIVER` | `local` (private disk folder) or `s3` (run `npm i @aws-sdk/client-s3` in `/server`, then set `AWS_*`) |
| `MAX_RESUME_MB` | Upload limit (default 5) |

---

## Recommended next steps

These are outside the current scope but fit the existing architecture:

1. **Email notifications**: application confirmations, status updates, and referral codes sent by email (also lets referrers recover a lost code).
2. **Malware scanning** of uploaded CVs (e.g. ClamAV, or S3 + GuardDuty Malware Protection).
3. **Two-factor authentication** for Super Admin accounts.
4. **Data retention job**: automatically anonymise applications older than the retention period stated in the privacy notice.
5. **Programme management UI**: the `Program` model and API already exist. Add dashboard CRUD, sessions, capacity and registrations.
6. **Candidate notes and tags, interview scheduling**, and a Kanban view of the pipeline.
7. **Referral rewards catalogue**: redeem points for vouchers or training credits.
8. **Prerendering / SSR** (e.g. migrating public pages to Next.js or adding a prerender step) if organic search becomes a primary channel. Server-side meta injection already covers crawlers and link previews.
