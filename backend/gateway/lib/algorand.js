/**
 * Algorand blockchain integration for payment verification.
 * Supports simulation mode + real testnet via AlgoNode.
 */
import 'dotenv/config';
import crypto from 'crypto';

const SIMULATION_MODE = process.env.SIMULATION_MODE !== 'false';
const ALGORAND_NETWORK = process.env.ALGORAND_NETWORK || 'testnet';
const INDEXER_URL = process.env.ALGORAND_INDEXER_URL || 'https://testnet-idx.algonode.cloud';

// Replay attack prevention store
const processedTxs = new Map();

// Clean old processed TXs every 24h
setInterval(() => {
  const cutoff = Date.now() - 86400000;
  for (const [txId, timestamp] of processedTxs.entries()) {
    if (timestamp < cutoff) processedTxs.delete(txId);
  }
}, 3600000);

export function getProviderWallet() {
  return process.env.PROVIDER_WALLET_ADDRESS;
}

/**
 * Verify an Algorand payment transaction.
 */
export async function verifyAlgorandPayment({ txId, expectedAmount, recipient, endpoint }) {
  // Replay attack check
  if (processedTxs.has(txId)) {
    return {
      verified: false,
      error: 'Transaction already used (replay attack prevented)',
      txId,
    };
  }

  console.log(`[Algorand] SIMULATION_MODE=${SIMULATION_MODE} | txId=${txId}`);

  let result;
  if (SIMULATION_MODE) {
    result = await simulateVerify(txId, expectedAmount, recipient);
  } else {
    result = await realVerify(txId, expectedAmount, recipient);
  }

  if (result.verified) {
    processedTxs.set(txId, Date.now());
  }

  return result;
}

/**
 * Simulation mode verification.
 */
async function simulateVerify(txId, expectedAmount, recipient) {
  await sleep(100 + Math.random() * 200);

  if (txId.toUpperCase().startsWith('FAIL')) {
    return { verified: false, error: 'Simulated transaction failure', txId };
  }

  if (txId.length < 10) {
    return { verified: false, error: 'Invalid transaction ID (too short)', txId };
  }

  const hash = crypto.createHash('md5').update(txId).digest('hex').toUpperCase();
  const sender = `ALGO${hash.slice(0, 16)}SIMULATED`;

  console.log(`[Algorand-SIM] Verified tx=${txId} | amount=${expectedAmount} ALGO`);

  return {
    verified: true,
    txId,
    amount: expectedAmount,
    sender,
    recipient,
    network: ALGORAND_NETWORK,
    block: Math.floor(Date.now() / 1000),
    simulation: true,
  };
}

/**
 * Real Algorand testnet verification via AlgoNode indexer.
 */
async function realVerify(txId, expectedAmount, recipient) {
  try {
    const { default: fetch } = await import('node-fetch');
    const url = `${INDEXER_URL}/v2/transactions/${txId}`;

    console.log(`[Algorand] Verifying real TX: ${url}`);

    let response;
    let retries = 5;
    while (retries > 0) {
      response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) break;
      retries--;
      if (retries > 0) {
        console.log(`[Algorand] TX not indexed yet, retrying in 2s...`);
        await sleep(2000);
      }
    }

    if (!response.ok) {
      return {
        verified: false,
        error: `Transaction not found on ${ALGORAND_NETWORK}: ${txId} (Indexer delay)`,
        txId,
      };
    }

    const data = await response.json();
    const tx = data.transaction;
    const payment = tx['payment-transaction'];

    if (!payment) {
      return { verified: false, error: 'Not a payment transaction', txId };
    }

    const actualRecipient = payment['receiver'];
    const actualAmount = payment['amount'] / 1_000_000;

    if (actualRecipient !== recipient) {
      return {
        verified: false,
        error: `Wrong recipient. Expected ${recipient}, got ${actualRecipient}`,
        txId,
      };
    }

    if (actualAmount < expectedAmount * 0.99) {
      return {
        verified: false,
        error: `Insufficient payment: ${actualAmount} ALGO < ${expectedAmount} ALGO`,
        txId,
      };
    }

    console.log(`[Algorand] Verified tx=${txId} | amount=${actualAmount} ALGO | block=${tx['confirmed-round']}`);

    return {
      verified: true,
      txId,
      amount: actualAmount,
      sender: tx.sender,
      recipient,
      network: ALGORAND_NETWORK,
      block: tx['confirmed-round'],
      simulation: false,
    };

  } catch (err) {
    console.error('[Algorand] Verification error:', err);
    return { verified: false, error: err.message, txId };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
