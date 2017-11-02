const express = require('express')
const request = require('request')
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/api/response/publish', function (req, res) {
  res.send('OK')

  console.log(req.body); 
})

app.get('/testpublish', function(req, res) {
  const options = {
    uri: 'http://localhost:9090/api/v1/eth/publish',
    method: 'POST',
    json: {
      "userId": Math.round(Math.random() * (9999999 - 1000000) + 1000000),
      "name": "TeraToken",
      "decimals": 3,
      "symbol": "TRTX",
      "basePriceOfToken": 0.001,
      "salePeriod": 14,
      "fundingGoal": 52,
      "minimalInvestment": 0.1,
      "bonusUpperLimitDays": 2,
      "bonusRate": 150
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
  console.log('Deploy test server listening on port ' + listener.address().port)
})