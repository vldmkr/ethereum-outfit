const path = require('path')
const express = require('express')
const bodyParser = require('body-parser');
const request = require('request')
const account = require('./account')

const Web3Provider = require('./lib/Web3Provider')
const Web3Helper = require('./lib/Web3Helper')
const ContractsCompiler = require('./lib/ContractsCompiler')
const ContractsOutfit = require('./lib/ContractsOutfit')
const WorkingQueue = require('./lib/WorkingQueue')

const app = express()
const provider = Web3Provider()
const web3 = provider.web3
const helper = Web3Helper(web3)
const compiler = ContractsCompiler(path.join(__dirname, 'contracts'))
const outfit = ContractsOutfit(web3)
const requestQueue = WorkingQueue()

app.use(bodyParser.json());
web3.eth.accounts.wallet.add(account.privateKey)

const contract = {
  address: "0x38cdee2df39d23e77b34792f3f7b9f6fcd030c86",
  abi: null
}

app.post('/api/v1/eth/method/transfer', function (req, res) {
  res.send('OK')
  console.log(req.body); 

  if (requestQueue.push(req.body) === 1) {
    requestQueue.watchDogForNext(100000)
    console.log("First")
  }
})

app.post('/api/v1/eth/method/balanceOf', function (req, res) {
  console.log(req.body);

  const methodBalanceOf = {
    name: "balanceOf",
    params: [ req.body.address ]
  }

  const json = {
    requestId: req.body.requestId,
    address: req.body.address,
    result: null,
    error: null
  }

  outfit.call(account.address, contract, methodBalanceOf)
  .then(emiter => {
    emiter
    .on('call', result => {
      json["result"] = parseInt(result)
      res.send(json)
    })
    .on('error', error => {
      json["error"] = error
      res.send(json)
    })
  })
})

function doWork (params) {
  const methodTransfer = {
    name: "transfer",
    params: [ params.address, params.value ]
  }

  const options = {
    uri: 'http://localhost:9080/api/response/method',
    method: 'POST',
    json: {
      "requestId": params.requestId,
      "address": null,
      "value": null,
      "tx": null,
      "error": null
    }
  }

  function doRequest (moveNext) {
    moveNext && requestQueue.next()
    requestQueue.watchDogForNext(60000)

    request(options, (err, res, body) => {
      if ( ! err && res.statusCode === 200) {
        console.log(body)
      }
    })
  }

  function doErrorRequest (reason) {
    console.log("Catched: " + reason);
    options.json["error"] = reason.message

    doRequest(false)
  }

  outfit.call(account.address, contract, methodTransfer)
  .then(emiter => {
    return new Promise((resolve, reject) => {
      emiter
      .on('receipt', receipt => resolve(receipt))
      .on('error', error => reject(error))
    })
  })
  .then(receipt => provider.getTransactionByHash(receipt.transactionHash))
  .then(transaction => {
    const transferABI = helper.getMethodABI(contract.abi, 'transfer')
    const callInfo = helper.createCallInfo(transferABI, helper.parseTxInput(transaction.input))

    options.json["tx"] = "https://ropsten.etherscan.io/tx/" + transaction.hash
    options.json["value"] = parseInt(callInfo.inputs.find(element => element.name === '_value').value)
    options.json["address"] = callInfo.inputs.find(element => element.name === '_to').value

    doRequest(true)
  })
  .catch(reason => doErrorRequest(reason))
}

const listener = app.listen(9090, function () {
  console.log('Server listening on port ' + listener.address().port)
})

requestQueue.start(doWork, 3000)

compiler.compile()
.then(output => {
  contract.abi = JSON.parse(output.contracts["UsableToken.sol:UsableToken"].interface)
  console.log("Contracts compiled. Let's Rock!")
})