/**
 * Payment routes — sign and send real Algorand testnet payments.
 * POST /payment/send  → sign + broadcast ALGO → return real TX ID
 * GET  /payment/wallet → client wallet info + balance
 */
import { Router } from 'express';
import algosdk from 'algosdk';

const router = Router();

// AlgoNode public testnet endpoints (no token needed)
const ALGOD_URL    = process.env.ALGORAND_ALGOD_URL    || 'https://testnet-api.algonode.cloud';
const INDEXER_URL  = process.env.ALGORAND_INDEXER_URL  || 'https://testnet-idx.algonode.cloud';
const PROVIDER_WALLET = process.env.PROVIDER_WALLET_ADDRESS;
const CLIENT_MNEMONIC = process.env.CLIENT_WALLET_MNEMONIC;

// Initialize algod client
const algodClient = new algosdk.Algodv2('', ALGOD_URL, 443);

// Derive client account from mnemonic
function getClientAccount() {
  const isSimulation = process.env.SIMULATION_MODE !== 'false';
  if (!CLIENT_MNEMONIC) {
    if (isSimulation) {
      // In simulation mode, return a dummy account if no mnemonic is set
      return algosdk.generateAccount();
    }
    throw new Error('CLIENT_WALLET_MNEMONIC not set in .env');
  }
  return algosdk.mnemonicToSecretKey(CLIENT_MNEMONIC);
}

// GET /payment/wallet — return client wallet address + balance
router.get('/wallet', async (req, res) => {
  const isSimulation = process.env.SIMULATION_MODE !== 'false';
  console.log(`[Payment] Fetching wallet info (SIMULATION=${isSimulation})`);
  try {
    let address = req.query.address;
    if (!address) {
      try {
        const account = getClientAccount();
        address = account.addr.toString();
      } catch (e) {
        console.warn('[Payment] getClientAccount failed:', e.message);
        address = '';
      }
    }

    let balance = 0;
    if (isSimulation) {
      balance = 1000.0; // Mock high balance for simulation
    } else if (address) {
      try {
        const info = await algodClient.accountInformation(address).do();
        balance = Number(info.amount) / 1_000_000;
      } catch (e) {
        console.warn('[Payment] Balance fetch failed:', e.message);
      }
    }

    res.json({
      client_address: address,
      provider_address: PROVIDER_WALLET,
      balance_algo: balance,
      network: isSimulation ? 'simulation' : (process.env.ALGORAND_NETWORK || 'testnet'),
      simulation: isSimulation,
      faucet_url: 'https://bank.testnet.algorand.network/',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /payment/send — sign + submit real ALGO payment, return confirmed TX ID
router.post('/send', async (req, res) => {
  const { amount, endpoint, memo, mnemonic } = req.body;

  if (!amount || !endpoint) {
    return res.status(400).json({ error: 'amount and endpoint are required' });
  }
  if (!PROVIDER_WALLET) {
    return res.status(500).json({ error: 'PROVIDER_WALLET_ADDRESS not configured' });
  }

  let account;
  try {
    if (mnemonic) {
      account = algosdk.mnemonicToSecretKey(mnemonic);
    } else {
      account = getClientAccount();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const senderAddr = account.addr.toString();
  const microAlgo = Math.round(parseFloat(amount) * 1_000_000);
  const noteText  = memo || `x402:${endpoint}`;

  console.log(`[Payment] Process request: ${amount} ALGO from ${senderAddr.slice(0,12)}... to ${PROVIDER_WALLET.slice(0,12)}...`);
  
  // ── SIMULATION MODE ──────────────────────────────────────────────────────────
  const isSimulation = process.env.SIMULATION_MODE !== 'false';
  
  if (isSimulation) {
    const mockTxId = `sim_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    console.log(`[Payment] SIMULATION MODE active: Returning mock TX ID: ${mockTxId}`);
    return res.json({
      tx_id: mockTxId,
      confirmed: true,
      amount: parseFloat(amount),
      sender: senderAddr,
      receiver: PROVIDER_WALLET,
      simulation: true,
      network: 'simulation',
    });
  }

  try {
    // 1. Get suggested params from algod
    const params = await algodClient.getTransactionParams().do();

    // 2. Build payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAddr,
      receiver: PROVIDER_WALLET,
      amount: BigInt(microAlgo),
      note: new TextEncoder().encode(noteText),
      suggestedParams: params,
    });

    // 3. Sign
    const signedTxn = txn.signTxn(account.sk);

    // 4. Submit to Algorand testnet
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`[Payment] TX submitted: ${txid}`);

    // 5. Wait for confirmation (up to 10 rounds ~30s)
    const confirmed = await algosdk.waitForConfirmation(algodClient, txid, 10);
    console.log(`[Payment] ✅ TX confirmed in round ${confirmed['confirmed-round']}: ${txid}`);

    res.json({
      tx_id: txid,
      confirmed: true,
      amount: parseFloat(amount),
      sender: senderAddr,
      receiver: PROVIDER_WALLET,
      confirmed_round: confirmed['confirmed-round'],
      network: process.env.ALGORAND_NETWORK || 'testnet',
      explorer_url: `https://testnet.algoexplorer.io/tx/${txid}`,
    });

  } catch (err) {
    console.error('[Payment] Error:', err.message);

    // Friendly errors
    if (err.message?.includes('overspend') || err.message?.includes('below min')) {
      return res.status(402).json({
        error: 'Insufficient balance in client wallet: ' + err.message,
        detail: err.message,
        fix: 'Fund your client wallet at https://bank.testnet.algorand.network/',
        client_address: senderAddr,
      });
    }

    res.status(500).json({ error: 'Algorand transaction failed: ' + err.message, detail: err.message });
  }
});

export default router;
