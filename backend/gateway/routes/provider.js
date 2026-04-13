/**
 * Provider routes — register, manage APIs, track earnings.
 * Migrated to Supabase (PostgreSQL).
 */
import { Router } from 'express';
import { db } from '../lib/database.js';

const router = Router();
// Fallback provider data when Supabase is unreachable
const FALLBACK_PROVIDERS = [
  { id: 'provider-ai-labs', name: 'AI Labs Inc.', email: 'contact@ailabs.io', wallet_address: 'AILABSWALLETADDRESSX402DEMO7ALGO', total_earnings: 18.474, api_count: 2, created_at: new Date().toISOString() },
  { id: 'provider-nlp-studio', name: 'NLP Studio', email: 'hello@nlpstudio.ai', wallet_address: 'NLPSTUDIOWALLETADDRESSX402ALGO', total_earnings: 13.444, api_count: 2, created_at: new Date().toISOString() },
  { id: 'provider-owner', name: 'Marketplace Owner', email: 'owner@x402marketplace.io', wallet_address: 'AQPT62NH6YGDDMUGSSYJYOVEDDNCR3LRV7SF37XA5LR5DRYFJBTY4P4Y3E', total_earnings: 0, api_count: 0, created_at: new Date().toISOString() },
];

// GET /provider — list all providers
router.get('/', async (req, res) => {
  try {
    const [
      { data: providers, error: pError },
      { data: apis, error: aError }
    ] = await Promise.all([
      db.from('providers').select('id, name, email, wallet_address, total_earnings, created_at'),
      db.from('api_registry').select('id, provider_id')
    ]);

    if (pError) throw pError;
    if (aError) throw aError;

    // Count APIs per provider in JS
    const providerList = providers.map(p => {
      const apiCount = apis.filter(a => a.provider_id === p.id).length;
      return { ...p, api_count: apiCount };
    });

    res.json({ providers: providerList.sort((a, b) => b.total_earnings - a.total_earnings) });
  } catch (err) {
    console.warn('[Provider] Supabase unavailable, using fallback data:', err.message);
    res.json({ providers: FALLBACK_PROVIDERS, fallback: true });
  }
});

// POST /provider/register — register new provider
router.post('/register', async (req, res) => {
  const { name, email, wallet_address } = req.body;
  if (!name || !email || !wallet_address) {
    return res.status(400).json({ error: 'name, email, and wallet_address are required' });
  }

  try {
    const id = `provider-${Date.now()}`;
    const api_key = `sk-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

    const { error } = await db.from('providers').insert([{
      id, name, email, wallet_address, api_key, status: 'approved'
    }]);

    if (error) throw error;

    res.status(201).json({
      message: 'Provider registered successfully',
      provider_id: id,
      api_key,
      wallet_address,
    });
  } catch (err) {
    if (err.message?.includes('unique')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /provider/publish — publish a new API
router.post('/publish', async (req, res) => {
  const { provider_id, name, description, endpoint, category, price, currency } = req.body;
  
  if (!provider_id || !name || !endpoint || !price) {
    return res.status(400).json({ error: 'provider_id, name, endpoint, and price are required' });
  }

  try {
    // Verify provider exists
    const { data: provider, error: pError } = await db
        .from('providers')
        .select('*')
        .eq('id', provider_id)
        .single();

    if (pError || !provider) {
        return res.status(404).json({ error: `Provider '${provider_id}' not found` });
    }

    const id = `api-${Date.now()}`;
    const { error } = await db.from('api_registry').insert([{
      id, 
      provider_id, 
      name, 
      description: description || '', 
      endpoint, 
      category: category || 'General', 
      price, 
      currency: currency || 'ALGO'
    }]);

    if (error) throw error;

    res.status(201).json({
      message: 'API published successfully',
      api_id: id,
      endpoint,
      price,
      status: 'live',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /provider/:id/earnings — provider earnings dashboard
router.get('/:id/earnings', async (req, res) => {
  try {
    const [
      { data: provider, error: pError },
      { data: apis, error: aError },
      { data: stats, error: sError }
    ] = await Promise.all([
      db.from('providers').select('*').eq('id', req.params.id).single(),
      db.from('api_registry').select('*').eq('provider_id', req.params.id).order('total_earnings', { ascending: false }),
      db.from('provider_stats').select('*')
    ]);

    if (pError || !provider) return res.status(404).json({ error: 'Provider not found' });
    if (aError) throw aError;
    if (sError) throw sError;

    // Filter and group stats for this provider's endpoints
    const providerEndpoints = apis.map(a => a.endpoint);
    const dateMap = {};
    stats?.forEach(row => {
      if (providerEndpoints.includes(row.endpoint)) {
        if (!dateMap[row.date]) {
          dateMap[row.date] = { date: row.date, requests: 0, earnings: 0 };
        }
        dateMap[row.date].requests += row.requests || 0;
        dateMap[row.date].earnings += row.earnings || 0;
      }
    });

    const dailyStats = Object.values(dateMap).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 30);

    res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        wallet_address: provider.wallet_address,
        total_earnings: provider.total_earnings,
      },
      apis,
      daily_stats: dailyStats,
      summary: {
        total_apis: apis.length,
        total_requests: apis.reduce((sum, a) => sum + (a.total_requests || 0), 0),
        total_earnings: apis.reduce((sum, a) => sum + (a.total_earnings || 0), 0),
      },
    });
  } catch (err) {
    console.warn('[Provider Earnings] Supabase unavailable, using fallback:', err.message);
    const provider = FALLBACK_PROVIDERS.find(p => p.id === req.params.id) || FALLBACK_PROVIDERS[0];
    const mockApis = [
      { id: 'api-translate', name: 'Language Translation', endpoint: '/api/translate', price: 0.001, total_requests: 4521, total_earnings: 4.521, category: 'Language', is_active: 1 },
      { id: 'api-summarize', name: 'Text Summarization', endpoint: '/api/summarize', price: 0.002, total_requests: 3847, total_earnings: 7.694, category: 'NLP', is_active: 1 },
    ];
    const today = new Date().toISOString().split('T')[0];
    res.json({
      provider: { id: provider.id, name: provider.name, wallet_address: provider.wallet_address, total_earnings: provider.total_earnings },
      apis: mockApis,
      daily_stats: [
        { date: today, requests: 42, earnings: 0.084 },
      ],
      summary: { total_apis: mockApis.length, total_requests: mockApis.reduce((s, a) => s + a.total_requests, 0), total_earnings: mockApis.reduce((s, a) => s + a.total_earnings, 0) },
      fallback: true,
    });
  }
});

export default router;
