const express = require('express')
const request = require('request')
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/api/response/method', function (req, res) {
  res.send('OK')

  console.log(req.body); 
})

app.get('/testtransfer', function(req, res) {
  const options = {
    uri: 'http://localhost:9090/api/v1/eth/method/transfer',
    method: 'POST',
    json: {
      "requestId": Math.round(Math.random() * (9999999 - 1000000) + 1000000),
      "address": "0x38cdee2df39d23e77b34792f3f7b9f6fcd030c86", 
      "value": 100
    }
  }

  request(options, function (err, res, body) {
    if ( ! err && res.statusCode === 200) {
      console.log(body)
    }
  })

  res.send('OK')
})

app.get('/testbalance', function(req, res) {
  const options = {
    uri: 'http://localhost:9090/api/v1/eth/method/balanceOf',
    method: 'POST',
    json: {
      "requestId": Math.round(Math.random() * (9999999 - 1000000) + 1000000),
      "address": "0x38cdee2df39d23e77b34792f3f7b9f6fcd030c86"
    }
  }

  request(options, function (err, res, body) {
    if ( ! err && res.statusCode === 200) {
      console.log(body)
    }
  })

  res.send('OK')
})

const listener = app.listen(9080, function () {
  console.log('TokenTransfer test server listening on port ' + listener.address().port)
})