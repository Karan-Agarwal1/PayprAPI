/**
 * API Registry routes — list, search, get AI services.
 * Migrated to Supabase (PostgreSQL).
 */
import { Router } from 'express';
import { db } from '../lib/database.js';

const router = Router();

// Fallback data when Supabase is unreachable
const FALLBACK_APIS = [
  { id: 'api-translate', provider_id: 'provider-nlp-studio', name: 'Language Translation', description: 'Translate text between 50+ languages using neural machine translation models', endpoint: '/api/translate', category: 'Language', price: 0.001, currency: 'ALGO', total_requests: 4521, total_earnings: 4.521, is_active: true, provider_name: 'NLP Studio', provider_wallet: 'NLPSTUDIOWALLETADDRESSX402ALGO' },
  { id: 'api-summarize', provider_id: 'provider-ai-labs', name: 'Text Summarization', description: 'Generate concise summaries of long documents with configurable length and style', endpoint: '/api/summarize', category: 'NLP', price: 0.002, currency: 'ALGO', total_requests: 3847, total_earnings: 7.694, is_active: true, provider_name: 'AI Labs Inc.', provider_wallet: 'AILABSWALLETADDRESSX402DEMO7ALGO' },
  { id: 'api-sentiment', provider_id: 'provider-nlp-studio', name: 'Sentiment Analysis', description: 'Analyze emotional tone and sentiment with granular emotion breakdown scores', endpoint: '/api/sentiment', category: 'Analytics', price: 0.001, currency: 'ALGO', total_requests: 8923, total_earnings: 8.923, is_active: true, provider_name: 'NLP Studio', provider_wallet: 'NLPSTUDIOWALLETADDRESSX402ALGO' },
  { id: 'api-image-gen', provider_id: 'provider-ai-labs', name: 'AI Image Generation', description: 'Generate stunning AI images from text prompts using diffusion models', endpoint: '/api/image/generate', category: 'Creative', price: 0.005, currency: 'ALGO', total_requests: 2156, total_earnings: 10.78, is_active: true, provider_name: 'AI Labs Inc.', provider_wallet: 'AILABSWALLETADDRESSX402DEMO7ALGO' },
];

// GET /registry — list all active APIs
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = db
      .from('api_registry')
      .select('*, providers(name, wallet_address)')
      .eq('is_active', true);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: apis, error } = await query.order('total_requests', { ascending: false });

    if (error) throw error;

    // Flatten provider data to match previous SQLite structure for frontend compatibility
    const flattenedApis = apis.map(api => ({
      ...api,
      provider_name: api.providers?.name,
      provider_wallet: api.providers?.wallet_address
    }));

    res.json({ apis: flattenedApis, total: flattenedApis.length });
  } catch (err) {
    console.warn('[Registry] Supabase unavailable, using fallback data:', err.message);
    // Return fallback data so frontend always works
    let filtered = [...FALLBACK_APIS];
    const { category, search } = req.query;
    if (category && category !== 'All') {
      filtered = filtered.filter(a => a.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(a => a.name.toLowerCase().includes(s) || a.description.toLowerCase().includes(s));
    }
    res.json({ apis: filtered, total: filtered.length, fallback: true });
  }
});

// GET /registry/categories — list all categories
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await db
      .from('api_registry')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const categories = Array.from(new Set(data.map(r => r.category)));
    res.json({ categories: ['All', ...categories] });
  } catch (err) {
    res.json({ categories: ['All', 'Language', 'NLP', 'Analytics', 'Creative'] });
  }
});

// GET /registry/:id — get single API details
router.get('/:id', async (req, res) => {
  try {
    const { data: api, error } = await db
      .from('api_registry')
      .select('*, providers(name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !api) return res.status(404).json({ error: 'API not found' });
    
    res.json({
        ...api,
        provider_name: api.providers?.name,
        provider_email: api.providers?.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /registry/stats/overview — marketplace overview stats
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalApis },
      { count: totalProviders },
      { data: requestsData },
      { data: todayData }
    ] = await Promise.all([
      db.from('api_registry').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('providers').select('*', { count: 'exact', head: true }),
      db.from('api_registry').select('total_requests, total_earnings'),
      db.from('provider_stats').select('requests, earnings').eq('date', today)
    ]);

    const totalRequests = requestsData?.reduce((acc, curr) => acc + (curr.total_requests || 0), 0) || 0;
    const totalEarnings = requestsData?.reduce((acc, curr) => acc + (curr.total_earnings || 0), 0) || 0;
    const todayRequests = todayData?.reduce((acc, curr) => acc + (curr.requests || 0), 0) || 0;
    const todayEarnings = todayData?.reduce((acc, curr) => acc + (curr.earnings || 0), 0) || 0;

    res.json({
      total_apis: totalApis || 0,
      total_providers: totalProviders || 0,
      total_requests: totalRequests,
      total_earnings: totalEarnings,
      today_requests: todayRequests,
      today_earnings: todayEarnings,
    });
  } catch (err) {
    console.warn('[Stats] Supabase unavailable, using fallback:', err.message);
    res.json({
      total_apis: 4,
      total_providers: 3,
      total_requests: 19447,
      total_earnings: 31.918,
      today_requests: 42,
      today_earnings: 0.084,
      fallback: true,
    });
  }
});

export default router;
