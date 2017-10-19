const path = require('path')
const express = require('express')
const bodyParser = require('body-parser');
const request = require('request')
const account = require('./account')

const Web3Provider = require('./lib/Web3Provider')
const ContractsCompiler = require('./lib/ContractsCompiler')

const app = express();
const web3 = Web3Provider().web3;
const compiler = ContractsCompiler(path.join(__dirname, 'contracts'))
const requestQueue = makeQueue();

function makeQueue () {
  const queue = []
  var cur = null

  function push (obj) {
    queue.push(obj)
  }

  function shift () {
    if ( ! cur) {
      cur = queue.shift() || null
      return cur
    }
    return null
  }

  function done () {
    cur = null
  }

  function current () {
    return cur;
  }

  return {
    push: push,
    shift: shift,
    done: done,
    current: current
  }
}

app.use(bodyParser.json());
web3.eth.accounts.wallet.add(account.privateKey)

app.post('/api/v1/eth/publish', function (req, res) {
  res.send('OK')
  console.log(req.body); 

  requestQueue.push(req.body)
})

function doWork (params) {
  const options = {
    uri: 'http://localhost:9080/api/sc/publishresult',
    method: 'POST',
    json: {
      "userId": params.userId,
      "ropstenPrivateKey": account.privateKey,
      "accountAddress": account.address,
      "tx": "https://ropsten.etherscan.io/address/" + account.address,
      "error": null
    }
  }

  compiler.deploy(web3, account.address, "GenCrowdsale.sol:GenCrowdsale", params)
  .then(transactionHash => {
    console.log(transactionHash)
    options.json["tx"] = "https://ropsten.etherscan.io/tx/" + transactionHash

    doRequest(options)
  })
  .catch(reason => {
    console.log(reason);
    options.json["error"] = reason.message

    doRequest(options)
  })
}

function doRequest (options) {
  setTimeout(() => { requestQueue.done() }, 35000)

  request(options, function (err, res, body) {
    if ( ! err && res.statusCode == 200) {
      console.log(body)
    }
  })
}

const listener = app.listen(9090, function () {
  console.log('Server listening on port ' + listener.address().port)
})

setInterval(() => {
  if (requestQueue.shift()) {
    doWork(requestQueue.current())
  }
}, 3000)
