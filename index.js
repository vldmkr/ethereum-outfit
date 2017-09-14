var path = require('path');
var express = require('express');
var request = require('request');

var keccak256 = require('./lib/keccak');
var EtherscanProvider = require('./lib/EtherscanProvider');
var Web3Provider = require('./lib/Web3Provider');
var ContractsCompiler = require('./lib/ContractsCompiler');
var NaiveHelper = require('./lib/NaiveHelper')
var Web3Helper = require('./lib/Web3Helper')

var provider1 = EtherscanProvider('api', 'YourApiKeyToken');
var provider = Web3Provider('https://mainnet.infura.io/');
var compiler = ContractsCompiler(path.join(__dirname, 'contracts'))
// var helper = NaiveHelper();
var helper = Web3Helper(provider.web3)
var app = express();

compiler.compile()
.then(output => {
  for (var contractName in output.contracts)
    console.log(contractName + '::: ' + output.contracts[contractName].interface)
})
.catch((reason) => {
  console.log('Error: ' + reason);
})

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/contract', function (req, res) {
  provider.getContractABI('0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413')
  .then(contractABI => {
    var transferABI = helper.getMethodABI(contractABI, 'transfer')
    console.log('methodABI:', transferABI);
    console.log('methodId:', helper.getMethodId(transferABI));
    console.log('encodeFunctionSignature:', Web3.eth.abi.encodeFunctionSignature(transferABI));
    res.send(transferABI);
  }).catch((reason) => {
    console.log('Error: ' + reason);
    res.send(reason)
  })
})

app.get('/tx', function (req, res) {
  provider.getTransactionByHash('0x4cfa36eae29344e6aa285e139889ba2050a6c2b9ada097bf2d899f18076ca169')
  .then(transaction => {
    console.log(transaction);
    var txInput = helper.parseTxInput(transaction.input)
    console.log(txInput);
    res.send(txInput);
  }).catch((reason) => {
    console.log('Error: ' + reason);
    res.send(reason)
  })
})

app.get('/call', function (req, res) {
  provider1.getContractABI('0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413')
  .then(contractABI => {
    var transferABI = helper.getMethodABI(contractABI, 'transfer')
    return provider.getTransactionByHash('0x4cfa36eae29344e6aa285e139889ba2050a6c2b9ada097bf2d899f18076ca169')
    .then(transaction => {
      var callInfo = helper.createCallInfo(transferABI, helper.parseTxInput(transaction.input))
      console.log(callInfo);
      return res.send(callInfo);
    })
  })
  .catch((reason) => {
    console.log('Error: ' + reason);
    return res.send(reason)
  })
})

app.use(express.static(__dirname));

app.listen(8080, function() {
  console.log('Started. Port: 8080');
});
