import algosdk from 'algosdk';

const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
const address = account.addr.toString();

console.log('\n=== NEW ALGORAND TESTNET CLIENT WALLET ===');
console.log('Address  :', address);
console.log('Mnemonic :', mnemonic);
console.log('\nFund this wallet at: https://bank.testnet.algorand.network/');
console.log('Paste address above and click "Dispense"\n');
