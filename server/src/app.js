const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const env = require('./config/env');
const routes = require('./routes');
const seo = require('./seo');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // behind a single reverse proxy / load balancer in production

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
        'frame-src': ['https://www.google.com', 'https://maps.google.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'script-src': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . operators from user input (NoSQL injection)
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Never let search engines index the API
app.use('/api', (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api', apiLimiter, routes);
app.use('/api', notFound);

app.get('/sitemap.xml', seo.sitemap);
app.get('/robots.txt', seo.robots);

// Production: serve the built React app with per-route SEO metadata
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '7d', setHeaders: (res, file) => {
    if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  } }));
  app.get('*', seo.renderIndex(dist));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
