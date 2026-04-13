/**
 * Supabase client for the X402 gateway.
 * Replaces SQLite with a cloud-hosted PostgreSQL instance.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing URL or Key in .env — running in offline/fallback mode');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Maintain the same export name 'db' to minimize refactoring, 
// using supabase as the implementation. 
export const db = supabase;

/**
 * Validates the connection to Supabase and seeds demo data if necessary.
 */
export async function initDatabase() {
  try {
    console.log(`[Supabase] Connecting to ${supabaseUrl}...`);
    
    // Test connection by getting provider count
    const { count, error } = await supabase.from('providers').select('*', { count: 'exact', head: true });
    
    if (error) {
       console.error('[Supabase Error] Connection failed:', error.message);
       console.error('[Supabase Error] Details:', error);
       throw error;
    }

    console.log('[Supabase] Connected successfully. Row count in providers:', count);

    // Seed if empty (count is 0)
    if (count === 0) {
      await seedDatabase();
    }

    return supabase;
  } catch (err) {
    console.error('[Supabase Error] Initialization failed:', err.message);
    return null;
  }
}

async function seedDatabase() {
  console.log('[Supabase] Seeding default demo data...');

  const providers = [
    {
      id: 'provider-ai-labs',
      name: 'AI Labs Inc.',
      email: 'contact@ailabs.io',
      wallet_address: 'AILABSWALLETADDRESSX402DEMO7ALGO',
      api_key: 'sk-ailabs-demo-key-001',
      total_earnings: 125.45,
      status: 'approved'
    },
    {
        id: 'provider-nlp-studio',
        name: 'NLP Studio',
        email: 'hello@nlpstudio.ai',
        wallet_address: 'NLPSTUDIOWALLETADDRESSX402ALGO',
        api_key: 'sk-nlpstudio-demo-key-001',
        total_earnings: 89.20,
        status: 'approved'
    },
    {
        id: 'provider-owner',
        name: 'Marketplace Owner',
        email: 'owner@x402marketplace.io',
        wallet_address: 'AQPT62NH6YGDDMUGSSYJYOVEDDNCR3LRV7SF37XA5LR5DRYFJBTY4P4Y3E',
        api_key: 'sk-owner-master-key-x402',
        total_earnings: 0,
        status: 'approved'
    }
  ];

  const apis = [
    {
      id: 'api-translate',
      provider_id: 'provider-nlp-studio',
      name: 'Language Translation',
      description: 'Translate text between 50+ languages using neural machine translation models',
      endpoint: '/api/translate',
      category: 'Language',
      price: 0.001,
      total_requests: 4521,
      total_earnings: 4.521
    },
    {
      id: 'api-summarize',
      provider_id: 'provider-ai-labs',
      name: 'Text Summarization',
      description: 'Generate concise summaries of long documents with configurable length and style',
      endpoint: '/api/summarize',
      category: 'NLP',
      price: 0.002,
      total_requests: 3847,
      total_earnings: 7.694
    },
    {
        id: 'api-image-gen',
        provider_id: 'provider-ai-labs',
        name: 'AI Image Generation',
        description: 'Generate stunning AI images from text prompts using diffusion models',
        endpoint: '/api/image/generate',
        category: 'Creative',
        price: 0.005,
        total_requests: 2156,
        total_earnings: 10.78
    }
  ];

  await supabase.from('providers').upsert(providers);
  await supabase.from('api_registry').upsert(apis);

  console.log('[Supabase] Seeding complete.');
}
