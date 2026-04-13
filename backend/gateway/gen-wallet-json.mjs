import algosdk from 'algosdk';
import fs from 'fs';
const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
const address = account.addr.toString();
const info = { address, mnemonic };
fs.writeFileSync('test-wallet.json', JSON.stringify(info, null, 2));
