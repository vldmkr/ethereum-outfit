const path = require('path')
const express = require('express')
const bodyParser = require('body-parser');
const request = require('request')
const account = require('./account')

const Web3Provider = require('./lib/Web3Provider')
const ContractsCompiler = require('./lib/ContractsCompiler')
const ContractsOutfit = require('./lib/ContractsOutfit')
const WorkingQueue = require('./lib/WorkingQueue')

const app = express()
const web3 = Web3Provider().web3
const compiler = ContractsCompiler(path.join(__dirname, 'contracts'))
const outfit = ContractsOutfit(web3)
const requestQueue = WorkingQueue()

app.use(bodyParser.json());
web3.eth.accounts.wallet.add(account.privateKey)

app.post('/api/v1/eth/publish', function (req, res) {
  res.send('OK')
  console.log(req.body); 

  if (requestQueue.push(req.body) === 1) {
    requestQueue.watchDogForNext(100000)
    console.log("First")
  }
})

function doWork (params) {
  const options = {
    uri: 'http://localhost:9080/api/sc/publishresult',
    method: 'POST',
    json: {
      "userId": params.userId,
      "ropstenPrivateKey": account.privateKey,
      "accountAddress": account.address,
      "tx": null,
      "contract": null,
      "error": null
    }
  }

  function doRequest (moveNext) {
    moveNext && requestQueue.next()
    requestQueue.watchDogForNext(60000)

    request(options, (err, res, body) => {
      if ( ! err && res.statusCode == 200) {
        console.log(body)
      }
    })
  }

  function doErrorRequest (reason) {
    console.log("Catched: " + reason);
    options.json["error"] = reason.message

    doRequest(false)
  }

  compiler.compile({ "GenCrowdsale.sol": params })
  .then(output => outfit.deploy(account.address, output.contracts["GenCrowdsale.sol:GenCrowdsale"]))
  .then(emiter => {
    emiter.on('transactionHash', transactionHash => {
      options.json["tx"] = "https://ropsten.etherscan.io/tx/" + transactionHash
      doRequest()
    })
    .on('receipt', receipt => {
      options.json["contract"] = "https://ropsten.etherscan.io/contract/" + receipt.contractAddress
      doRequest(true)
    })
    .on('error', error => {
      doErrorRequest(error)
    })
  })
  .catch(reason => {
    doErrorRequest(reason)
  })
}

const listener = app.listen(9090, function () {
  console.log('Server listening on port ' + listener.address().port)
})

requestQueue.start(doWork, 3000)
