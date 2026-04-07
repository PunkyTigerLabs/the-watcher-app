// ============================================
// THE WATCHER — Backend Server
// ============================================
// "Maximum Automated Intelligence for Capital Decisions"

import express from 'express';
import cors from 'cors';
import { SERVER } from './config';
import { getDb } from './db';
import { startCronJobs } from './cron';
import { getWalletCount } from './normalize/walletResolver';

// Import routes
import usdcRoutes from './routes/usdc';
import usdtRoutes from './routes/usdt';
import signalRoutes from './routes/signal';
import intelRoutes from './routes/intel';
import whalesRoutes from './routes/whales';
import analystRoutes from './routes/analyst';
import marketRoutes from './routes/market';

const app = express();
const startTime = Date.now();

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ---- Auth middleware for PRO endpoints ----
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = req.headers['x-watcher-key'] as string;

  // In development, skip auth
  if (SERVER.NODE_ENV === 'development') {
    return next();
  }

  if (!apiKey || apiKey !== SERVER.WATCHER_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

// ---- Routes ----

// Health check (always public)
app.get('/health', (_req, res) => {
  const db = getDb();
  const eventCount = (db.prepare('SELECT COUNT(*) as count FROM events').get() as any).count;
  const lastEvent = db.prepare('SELECT timestamp FROM events ORDER BY timestamp DESC LIMIT 1').get() as any;

  res.json({
    status: 'ok',
    uptime: Math.round((Date.now() - startTime) / 1000),
    lastUpdate: lastEvent?.timestamp || null,
    eventCount,
    walletLabels: getWalletCount(),
    version: '1.0.0',
    apiKeys: {
      etherscan: !!process.env.ETHERSCAN_API_KEY,
      basescan: !!process.env.BASESCAN_API_KEY,
      trongrid: !!process.env.TRONGRID_API_KEY,
      cryptocompare: true, // Free — no key needed
      solscan: !!process.env.SOLSCAN_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
    },
  });
});

// FREE endpoints
app.use('/usdc', usdcRoutes);
app.use('/usdt', usdtRoutes);
app.use('/market', marketRoutes);

// Signal: partially free, full requires auth
app.use('/signal', signalRoutes);

// PRO endpoints (require API key in production)
app.use('/whales', requireAuth, whalesRoutes);
app.use('/intel', requireAuth, intelRoutes);
app.use('/analyst', requireAuth, analystRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---- Start ----
const port = SERVER.PORT;

app.listen(port, () => {
  console.log('');
  console.log('  ████████╗██╗  ██╗███████╗    ██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗███████╗██████╗ ');
  console.log('  ╚══██╔══╝██║  ██║██╔════╝    ██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║██╔════╝██╔══██╗');
  console.log('     ██║   ███████║█████╗      ██║ █╗ ██║███████║   ██║   ██║     ███████║█████╗  ██████╔╝');
  console.log('     ██║   ██╔══██║██╔══╝      ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║██╔══╝  ██╔══██╗');
  console.log('     ██║   ██║  ██║███████╗    ╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║███████╗██║  ██║');
  console.log('     ╚═╝   ╚═╝  ╚═╝╚══════╝     ╚══╝╚══╝╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝');
  console.log('');
  console.log(`  Server running on port ${port}`);
  console.log(`  Environment: ${SERVER.NODE_ENV}`);
  console.log(`  Wallet labels: ${getWalletCount()}`);
  console.log('');

  // Initialize database
  getDb();

  // Validate required API keys at startup
  const requiredKeys = ['ETHERSCAN_API_KEY', 'BASESCAN_API_KEY'];
  const missingKeys = requiredKeys.filter(k => !process.env[k]);
  if (missingKeys.length > 0) {
    console.warn(`[WARNING] Missing API keys: ${missingKeys.join(', ')} — some features will be degraded`);
  }

  // Start cron jobs
  startCronJobs();
});

export default app;
