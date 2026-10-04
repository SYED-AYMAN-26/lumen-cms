import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import { uploadDir } from './config/paths.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import { startScheduler } from './services/scheduler.js';
import { seedIfEmpty } from './seed/seed.js';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using an ephemeral secret — tokens will not survive a restart.');
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 800,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

app.use('/uploads', express.static(uploadDir, {
  fallthrough: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.svg')) res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
  },
}));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { ok: true, time: new Date().toISOString() } });
});

app.use('/api', routes);
app.use('/api', notFound);

const clientDist = path.resolve(uploadDir, '../../frontend/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => err && next());
  });
}

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

try {
  const db = await connectDB();
  await seedIfEmpty();
  startScheduler();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Lumen API listening on http://0.0.0.0:${port}`);
    if (db.memory) console.log('Using in-memory MongoDB. Set MONGODB_URI for a persistent database.');
  });
} catch (err) {
  console.error('Failed to start Lumen API');
  console.error(err);
  process.exit(1);
}
