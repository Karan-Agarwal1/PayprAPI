/**
 * PayprAPI Pay-Per-Use AI API Marketplace
 * Node.js Gateway Server
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { initDatabase } from './lib/database.js';
import registryRouter from './routes/registry.js';
import facilitatorRouter from './routes/facilitator.js';
import providerRouter from './routes/provider.js';
import analyticsRouter from './routes/analytics.js';
import paymentRouter from './routes/payment.js';
import { x402Middleware } from './middleware/x402.js';


const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;
const AI_SERVICES_URL = process.env.AI_SERVICES_URL || 'http://localhost:8001';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health / Info ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'PayprAPI Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      registry: '/registry',
      facilitator: '/facilitator',
      provider: '/provider',
      analytics: '/analytics',
      proxy: '/api/*',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/registry', registryRouter);
app.use('/facilitator', facilitatorRouter);
app.use('/provider', providerRouter);
app.use('/analytics', analyticsRouter);
app.use('/payment', paymentRouter);

// ── X402 Protected Proxy to AI Services ──────────────────────────────────────
// The x402Middleware will return 402 or validate payment before proxying.
app.use('/api', x402Middleware, async (req, res) => {
  const targetUrl = `${AI_SERVICES_URL}${req.originalUrl}`;
  console.log(`[Proxy] Forwarding to: ${targetUrl} (Verified: ${req.headers['x-payment-verified'] === 'true'})`);

  try {
    const fetchRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'x-payment-verified': req.headers['x-payment-verified'] || '',
        'x-payment-tx-id': req.headers['x-payment-tx-id'] || '',
        'x-payment-amount': req.headers['x-payment-amount'] || '',
        'User-Agent': 'X402-Gateway-Facilitator/1.0',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    let data;
    const contentType = fetchRes.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await fetchRes.json();
    } else {
      data = { message: await fetchRes.text() };
    }

    if (!fetchRes.ok) {
      console.warn(`[Proxy Warn] AI Service returned ${fetchRes.status}:`, data);
      
      // TRIGGER REfUND IF PAYMENT WAS VERIFIED
      if (req.x402_sender && req.x402_amount) {
        console.log(`[Proxy Refund] API failed with ${fetchRes.status}. Issuing refund of ${req.x402_amount} to ${req.x402_sender}`);
        try {
          const { issueRefund } = await import('./lib/refund.js');
          const { db } = await import('./lib/database.js');
          const refundTxId = await issueRefund(req.x402_sender, req.x402_amount, `Refund for failed ${req.originalUrl} (${fetchRes.status})`);
          
          data.refund_issued = true;
          data.refund_tx_id = refundTxId;
          data.error = data.error || data.message || 'AI Service Error';

          // Persist refund in DB
          const txId = req.headers['x-payment-tx-id'];
          if (txId) {
             await db.from('transactions')
               .update({ refund_tx_id: refundTxId, is_refunded: true, status: 'refunded' })
               .eq('tx_id', txId);
          }
        } catch (refundErr) {
          console.error('[Refund Error] Failed to issue refund:', refundErr.message);
          data.refund_issued = false;
          data.refund_error = refundErr.message;
        }
      }
      return res.status(fetchRes.status).json(data);
    }
    
    return res.status(fetchRes.status).json(data);

  } catch (err) {
    console.error('[Proxy Error] Network or Parsing Error:', err.message);
    const errorData = {
      success: false,
      error: 'AI Service Temporarily Unavailable',
      detail: err.message,
    };
    
    // Attempt refund on network error
    if (req.x402_sender && req.x402_amount) {
      console.log(`[Proxy Refund] Network error. Issuing refund of ${req.x402_amount} to ${req.x402_sender}`);
      try {
        const { issueRefund } = await import('./lib/refund.js');
        const { db } = await import('./lib/database.js');
        const refundTxId = await issueRefund(req.x402_sender, req.x402_amount, 'Refund for unavailable AI service');
        errorData.refund_issued = true;
        errorData.refund_tx_id = refundTxId;

        // Persist refund in DB
        const txId = req.headers['x-payment-tx-id'];
        if (txId) {
           await db.from('transactions')
             .update({ refund_tx_id: refundTxId, is_refunded: true, status: 'refunded' })
             .eq('tx_id', txId);
        }
      } catch (refundErr) {
        console.error('[Refund Error] Failed to issue refund during network error:', refundErr.message);
        errorData.refund_issued = false;
        errorData.refund_error = refundErr.message;
      }
    }
    
    res.status(502).json(errorData);
  }
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Gateway Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   PayprAPI Gateway — Running!              ║
║   http://localhost:${PORT}                     ║
║   Proxying AI services → ${AI_SERVICES_URL.padEnd(20)} ║
╚════════════════════════════════════════════╝
    `.trim());
  });
}

start().catch(console.error);
