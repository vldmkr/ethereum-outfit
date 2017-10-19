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

app.use(bodyParser.json());
web3.eth.accounts.wallet.add(account.privateKey)

app.post('/api/v1/eth/publish', function (req, res) {
  res.send('OK')
  console.log(req.body); 
  const params = req.body

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
})

function doRequest (options) {
  request(options, function (err, res, body) {
    if ( ! err && res.statusCode == 200) {
      console.log(body)
    }
  })
}

const listener = app.listen(9090, function () {
  console.log('Server listening on port ' + listener.address().port)
})