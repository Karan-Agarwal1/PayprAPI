/**
 * API client for communicating with PayprAPI Gateway and AI Services.
 * Handles the payment flow, payment injection, and retries.
 * All fetch calls have a 5-second timeout to prevent UI freezing.
 */
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000';
const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICES_URL || 'http://localhost:8001';

const FETCH_TIMEOUT = 5000; // 5 seconds for background data loading
const API_CALL_TIMEOUT = 30000; // 30 seconds for user-initiated API calls

/** Fetch with a timeout — prevents hanging renders */
async function fetchWithTimeout(url: string, options?: RequestInit, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface X402PaymentInstructions {
  x402Version: number;
  error: string;
  accepts: {
    scheme: string;
    network: string;
    amount: string;
    currency: string;
    recipient: string;
    memo: string;
  }[];
  memo: string;
  endpoint: string;
  amount: number;
  currency: string;
  instructions?: Record<string, string>;
}

export interface ApiCallResult {
  success: boolean;
  data?: unknown;
  requires_payment?: boolean;
  payment_instructions?: X402PaymentInstructions;
  error?: string;
  refund_issued?: boolean;
  refund_tx_id?: string;
}

/**
 * Make a pay-per-use API call through the gateway.
 * @param endpoint - The API endpoint path (e.g. '/api/translate')
 * @param body - Request body
 * @param txId - Algorand transaction ID (if payment already made)
 */
export async function callPayPerUseAPI(
  endpoint: string,
  body: Record<string, unknown>,
  txId?: string
): Promise<ApiCallResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (txId) {
    headers['X-Payment'] = `txid:${txId}`;
  }

  try {
    const response = await fetchWithTimeout(`${GATEWAY_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }, API_CALL_TIMEOUT);

    if (response.status === 402) {
      const paymentInstructions = await response.json() as X402PaymentInstructions;
      return {
        success: false,
        requires_payment: true,
        payment_instructions: paymentInstructions,
      };
    }

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.detail || error.error || 'API call failed',
        refund_issued: error.refund_issued,
        refund_tx_id: error.refund_tx_id,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error — make sure the gateway is running',
    };
  }
}

// ── Registry & Analytics ──────────────────────────────────────────────────────

export async function fetchApis(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.set('category', category);
  if (search) params.set('search', search);
  const res = await fetchWithTimeout(`${GATEWAY_URL}/registry?${params}`);
  return res.json();
}

export async function fetchOverviewStats() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/registry/stats/overview`);
  return res.json();
}

export async function fetchAnalyticsOverview() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/analytics/overview`);
  return res.json();
}

export async function fetchTimeSeries() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/analytics/time-series`);
  return res.json();
}

export async function fetchEndpointStats() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/analytics/endpoints`);
  return res.json();
}

export async function fetchProviders() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/provider`);
  return res.json();
}

export async function fetchProviderEarnings(providerId: string) {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/provider/${providerId}/earnings`);
  return res.json();
}

export async function fetchLiveStats() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/analytics/live`);
  return res.json();
}

export async function fetchTransactions(limit = 20) {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/facilitator/transactions?limit=${limit}`);
  return res.json();
}

export async function registerProvider(data: { name: string; email: string; wallet_address: string }) {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/provider/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function publishApi(data: Record<string, unknown>) {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/provider/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchCategories() {
  const res = await fetchWithTimeout(`${GATEWAY_URL}/registry/categories`);
  return res.json();
}

export const GATEWAY_URL_EXPORT = GATEWAY_URL;
export const AI_URL_EXPORT = AI_URL;
