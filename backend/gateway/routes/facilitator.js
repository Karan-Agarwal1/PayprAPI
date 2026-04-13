/**
 * Facilitator routes — payment validation, fraud detection.
 * Migrated to Supabase (PostgreSQL).
 */
import { Router } from 'express';
import { verifyAlgorandPayment } from '../lib/algorand.js';
import { db } from '../lib/database.js';

const router = Router();

// POST /facilitator/verify — verify a payment transaction
router.post('/verify', async (req, res) => {
  const { tx_id, amount, recipient, endpoint } = req.body;

  if (!tx_id || !amount || !recipient) {
    return res.status(400).json({ error: 'Missing required fields: tx_id, amount, recipient' });
  }

  try {
    const result = await verifyAlgorandPayment({
      txId: tx_id,
      expectedAmount: parseFloat(amount),
      recipient,
      endpoint: endpoint || 'unknown',
    });

    // Log the facilitation attempt in Supabase
    try {
      await db.from('transactions').insert([{
        id: tx_id.slice(0, 8) + '-fac',
        endpoint: endpoint || 'manual',
        amount: parseFloat(amount),
        tx_id: tx_id,
        status: result.verified ? 'completed' : 'failed'
      }]);
    } catch (e) { 
      console.warn('[Facilitator Log Error]', e.message);
    }

    res.json({
      ...result,
      facilitator: 'PayprAPI Facilitator v1.0',
      network: process.env.ALGORAND_NETWORK || 'testnet',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /facilitator/transactions — recent transactions
router.get('/transactions', async (req, res) => {
  try {
    const { limit = 20, status } = req.query;
    
    let query = db
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: txs, error } = await query;
    if (error) throw error;

    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /facilitator/fraud-check/:txId — basic fraud detection
router.get('/fraud-check/:txId', async (req, res) => {
  const { txId } = req.params;
  try {
    // Check if TX already used
    const { data: existing, error } = await db
      .from('transactions')
      .select('*')
      .eq('tx_id', txId)
      .eq('status', 'completed')
      .maybeSingle();

    if (error) throw error;
    
    res.json({
      tx_id: txId,
      is_replay: !!existing,
      risk_level: existing ? 'HIGH' : 'LOW',
      checks: {
        replay_attack: !!existing,
        double_spend: !!existing,
        format_valid: txId.length >= 10,
      },
      message: existing
        ? 'Transaction already used — replay attack detected'
        : 'Transaction appears valid',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
