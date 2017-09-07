var path = require('path');
var express = require('express');
var request = require('request');
var Web3 = require('web3');

var keccak256 = require('./keccak');
var EtherscanProvider = require('./EtherscanProvider');
var ContractsCompiler = require('./ContractsCompiler');
var NaiveHelper = require('./NaiveHelper')

var web3 = new Web3()
var provider = EtherscanProvider('api', 'YourApiKeyToken');
var compiler = ContractsCompiler(path.join(__dirname, 'contracts'))
var helper = NaiveHelper();
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
    console.log('encodeFunctionSignature:', web3.eth.abi.encodeFunctionSignature(transferABI));
    res.send(transferABI);
  }).catch((reason) => {
    console.log('Error: ' + reason);
    res.send(reason)
  })
})

app.get('/tx', function (req, res) {
  provider.getTransactionByHash('0x54c02aa1d5b4e5dfa1f32b7861362a132945774802416e207a455127188f5189')
  .then(transaction => {
    var txInput = helper.parseTxInput(transaction.result.input)
    console.log(txInput);
    res.send(txInput);
  }).catch((reason) => {
    console.log('Error: ' + reason);
    res.send(reason)
  })
})

app.get('/call', function (req, res) {
  provider.getContractABI('0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413')
  .then(contractABI => {
    var transferABI = helper.getMethodABI(contractABI, 'transfer')
    return provider.getTransactionByHash('0x54c02aa1d5b4e5dfa1f32b7861362a132945774802416e207a455127188f5189')
    .then(transaction => {
      var callInfo = helper.createCallInfo(transferABI, helper.parseTxInput(transaction.result.input))
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
