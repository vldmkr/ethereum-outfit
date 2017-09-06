var path = require('path');
var express = require('express');
var request = require('request');
var Web3 = require('web3');

var keccak256 = require('./keccak');
var EtherscanProvider = require('./EtherscanProvider');
var ContractsCompiler = require('./ContractsCompiler');

var web3 = new Web3()
var provider = EtherscanProvider('api', 'YourApiKeyToken');
var compiler = ContractsCompiler(path.join(__dirname, 'contracts'))
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
    var transferABI = getMethodABI(contractABI, 'transfer')
    console.log('methodABI:', transferABI);
    console.log('methodId:', getMethodId(transferABI));
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
    var txInput = parseTxInput(transaction.result.input)
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
    var transferABI = getMethodABI(contractABI, 'transfer')
    return provider.getTransactionByHash('0x54c02aa1d5b4e5dfa1f32b7861362a132945774802416e207a455127188f5189')
    .then(transaction => {
      var callInfo = createCallInfo(transferABI, parseTxInput(transaction.result.input))
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

function getMethodABI(contractABI, methodName) {
  return contractABI.find(function(element) {
    return element.name === methodName;
  });
}

function getMethodId(methodABI) {
  var inputs = methodABI.inputs.map(function(element) {
    return element.type;
  });

  var methodSignature = [methodABI.name, '(', inputs.join(','), ')'].join('');
  var methodHash = '0x' + keccak256(methodSignature);
  var methodIdBound = 2 + 4 * 2; // 0x + 4 bytes

  return methodHash.substring(0, methodIdBound);
}

function parseTxInput(input) {
  var methodIdBound = 2 + 4 * 2; // 0x + 4 bytes

  var output = {};
  output.methodId = input.slice(0, methodIdBound);
  output.inputs = input.slice(methodIdBound).match(/.{1,64}/g);

  return output;
}

function createCallInfo(methodABI, txInput) {
  if(getMethodId(methodABI) === txInput.methodId) {
    var callInfo = {};
    callInfo.name = methodABI.name;
    callInfo.methodId = txInput.methodId;
    callInfo.inputs = methodABI.inputs.map(function (element, index) {
      var newElement = Object.assign({}, element);
      newElement.value = normalizeValue(txInput.inputs[index], element.type);
      return newElement;
    })
    return callInfo;
  }
  return null;
}

function normalizeValue(value, type) {
  switch(type) {
    case 'address': return '0x' + value.slice(-40);
    case 'uint256': return parseInt(value, 16);
    default: return value;
  }
}