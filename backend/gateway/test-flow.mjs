import fetch from 'node-fetch';

const GATEWAY_URL = 'http://localhost:8000';
const ENDPOINT = '/api/summarize';

async function testFlow() {
  console.log('--- Phase 5: Testing Agent-to-Agent Payment Flow ---');
  
  // Step 1: Initial Request (Expected 402)
  console.log('\n[Step 1] Requesting without payment...');
  const res1 = await fetch(`${GATEWAY_URL}${ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'The X402 protocol enables autonomous AI-to-AI micro-transactions on the blockchain.' })
  });

  if (res1.status !== 402) {
    console.error(`Expected 402, got ${res1.status}`);
    return;
  }
  
  const paymentDetails = await res1.json();
  console.log('✓ Received 402 Payment Required');
  console.log('  Recipient:', paymentDetails.accepts[0].recipient);
  console.log('  Amount:', paymentDetails.accepts[0].amount, 'ALGO');

  // Step 2: Simulate Payment
  const simulatedTxId = 'SIM_TEST_' + Math.random().toString(36).substring(7);
  console.log(`\n[Step 2] Simulating payment with TXID: ${simulatedTxId}`);

  // Step 3: Resend with X-Payment Header
  console.log('[Step 3] Resending request with X-Payment header...');
  const res2 = await fetch(`${GATEWAY_URL}${ENDPOINT}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Payment': `txid:${simulatedTxId}`
    },
    body: JSON.stringify({ text: 'The X402 protocol enables autonomous AI-to-AI micro-transactions on the blockchain.' })
  });

  if (res2.status === 200) {
    const data = await res2.json();
    console.log('✓ Received 200 OK');
    console.log('  AI Response Summary:', data.summary);
    console.log('\n--- SUCCESS: Agent-to-Agent Payment Flow verified! ---');
  } else {
    const err = await res2.json();
    console.error(`FAILED: Expected 200, got ${res2.status}`);
    console.error('Error details:', err);
  }
}

testFlow().catch(console.error);
