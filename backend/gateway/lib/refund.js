import algosdk from 'algosdk';

const ALGOD_URL = process.env.ALGORAND_ALGOD_URL || 'https://testnet-api.algonode.cloud';
const algodClient = new algosdk.Algodv2('', ALGOD_URL, 443);

/**
 * Issues an ALGO refund back to a user from the provider wallet.
 * @param {string} recipient The wallet address of the user who paid
 * @param {number} amount Amount of ALGO to refund
 * @param {string} memo Transaction memo (optional)
 * @returns {Promise<string>} The transaction ID of the successful refund
 */
export async function issueRefund(recipient, amount, memo = 'Refund for failed request') {
  const providerMnemonic = process.env.PROVIDER_WALLET_MNEMONIC;
  if (!providerMnemonic) {
    throw new Error('Refund failed: PROVIDER_WALLET_MNEMONIC not set.');
  }

  const account = algosdk.mnemonicToSecretKey(providerMnemonic);
  const microAlgo = Math.round(Number(amount) * 1_000_000);

  console.log(`[Refund] Processing refund of ${amount} ALGO to ${recipient.slice(0, 10)}...`);

  // 1. Get params
  const params = await algodClient.getTransactionParams().do();

  // 2. Build payment transaction
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: recipient,
    amount: BigInt(microAlgo),
    note: new TextEncoder().encode(memo),
    suggestedParams: params,
  });

  // 3. Sign
  const signedTxn = txn.signTxn(account.sk);

  // 4. Submit
  const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
  console.log(`[Refund] TX submitted: ${txid}`);

  // 5. Wait for confirmation
  await algosdk.waitForConfirmation(algodClient, txid, 10);
  console.log(`[Refund] ✅ Refund confirmed! txid=${txid}`);

  return txid;
}
