/**
 * Analytics routes — marketplace metrics and charts.
 * Migrated to Supabase (PostgreSQL).
 */
import { Router } from 'express';
import { db } from '../lib/database.js';

const router = Router();

// GET /analytics/overview — high-level marketplace metrics
router.get('/overview', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalTx },
      { count: completedTx },
      { data: volumeData },
      { data: last24hData },
      { data: statsData }
    ] = await Promise.all([
      db.from('transactions').select('*', { count: 'exact', head: true }),
      db.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      db.from('transactions').select('amount').eq('status', 'completed'),
      db.from('transactions').select('amount').eq('status', 'completed').gte('created_at', twentyFourHoursAgo),
      db.from('provider_stats').select('*')
    ]);

    const totalVolume = volumeData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const last24hVolume = last24hData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    // Grouping statsData in JS
    const endpointMap = {};
    statsData?.forEach(row => {
      if (!endpointMap[row.endpoint]) {
        endpointMap[row.endpoint] = { endpoint: row.endpoint, total_requests: 0, total_earnings: 0 };
      }
      endpointMap[row.endpoint].total_requests += row.requests || 0;
      endpointMap[row.endpoint].total_earnings += row.earnings || 0;
    });

    const topApis = Object.values(endpointMap)
      .sort((a, b) => b.total_requests - a.total_requests)
      .slice(0, 5);

    res.json({
      total_transactions: totalTx || 0,
      completed_transactions: completedTx || 0,
      total_volume_algo: totalVolume,
      last_24h_requests: last24hData?.length || 0,
      last_24h_volume: last24hVolume,
      top_apis: topApis,
    });
  } catch (err) {
    console.warn('[Analytics Overview] Supabase unavailable, using fallback:', err.message);
    res.json({
      total_transactions: 156,
      completed_transactions: 142,
      total_volume_algo: 31.918,
      last_24h_requests: 42,
      last_24h_volume: 0.084,
      top_apis: [
        { endpoint: '/api/sentiment', total_requests: 8923, total_earnings: 8.923 },
        { endpoint: '/api/translate', total_requests: 4521, total_earnings: 4.521 },
        { endpoint: '/api/summarize', total_requests: 3847, total_earnings: 7.694 },
        { endpoint: '/api/image/generate', total_requests: 2156, total_earnings: 10.78 },
      ],
      fallback: true,
    });
  }
});

// GET /analytics/time-series — daily requests + earnings (last N days)
router.get('/time-series', async (req, res) => {
  try {
    const { endpoint } = req.query;

    let query = db.from('provider_stats').select('*');

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { data: stats, error } = await query.order('date', { ascending: true });

    if (error) throw error;

    // Aggregate by date (in case there are multiple entries for the same date/endpoint)
    const dateMap = {};
    stats?.forEach(row => {
      if (!dateMap[row.date]) {
        dateMap[row.date] = { date: row.date, requests: 0, earnings: 0 };
      }
      dateMap[row.date].requests += row.requests || 0;
      dateMap[row.date].earnings += row.earnings || 0;
    });

    res.json({ time_series: Object.values(dateMap) });
  } catch (err) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    res.json({ time_series: [
      { date: yesterday, requests: 38, earnings: 0.076 },
      { date: today, requests: 42, earnings: 0.084 },
    ], fallback: true });
  }
});

// GET /analytics/endpoints — per-endpoint breakdown
router.get('/endpoints', async (req, res) => {
  try {
    const { data: stats, error } = await db.from('provider_stats').select('*');
    if (error) throw error;

    const endpointMap = {};
    stats?.forEach(row => {
      if (!endpointMap[row.endpoint]) {
        endpointMap[row.endpoint] = { endpoint: row.endpoint, total_requests: 0, total_earnings: 0 };
      }
      endpointMap[row.endpoint].total_requests += row.requests || 0;
      endpointMap[row.endpoint].total_earnings += row.earnings || 0;
    });

    const breakdown = Object.values(endpointMap).sort((a, b) => b.total_requests - a.total_requests);
    res.json({ endpoints: breakdown });
  } catch (err) {
    res.json({ endpoints: [
      { endpoint: '/api/sentiment', total_requests: 8923, total_earnings: 8.923 },
      { endpoint: '/api/translate', total_requests: 4521, total_earnings: 4.521 },
      { endpoint: '/api/summarize', total_requests: 3847, total_earnings: 7.694 },
      { endpoint: '/api/image/generate', total_requests: 2156, total_earnings: 10.78 },
    ], fallback: true });
  }
});

// GET /analytics/live — simulated live metrics
router.get('/live', async (req, res) => {
  try {
    const { data: recentTx, error } = await db
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    const liveStats = {
      timestamp: new Date().toISOString(),
      active_connections: Math.floor(Math.random() * 50) + 10,
      requests_per_minute: Math.floor(Math.random() * 30) + 5,
      recent_transactions: recentTx,
    };
    res.json(liveStats);
  } catch (err) {
    res.json({
      timestamp: new Date().toISOString(),
      active_connections: Math.floor(Math.random() * 50) + 10,
      requests_per_minute: Math.floor(Math.random() * 30) + 5,
      recent_transactions: [],
      fallback: true,
    });
  }
});

export default router;
