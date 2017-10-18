const fs = require('fs')
const Web3Provider = require('./lib/Web3Provider')
const web3 = Web3Provider().web3

const account = web3.eth.accounts.create();
fs.writeFileSync('account.json', JSON.stringify({ 
	privateKey: account.privateKey,
	address: account.address
}, null, 2));
