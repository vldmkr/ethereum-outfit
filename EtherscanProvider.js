const request = require('request')

function EtherscanProvider(etherscanPrefix, apiKey) {

  function getContractABI (address) {
    return new Promise((resolve, reject) => {
      const url = getUrl()
      + `&module=contract&action=getabi&address=${address}`

      request(url, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        const data = JSON.parse(body)
        resolve(JSON.parse(data.result))
      })
    })
  }

  function getTransactionByHash (transactionHash) {
    return new Promise((resolve, reject) => {
      const url = getUrl()
      + `&module=proxy&action=eth_getTransactionByHash&txhash=${transactionHash}`

      request(url, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        resolve(JSON.parse(body).result)
      })
    })
  }

  function getUrl () {
    return `https://${etherscanPrefix}.etherscan.io/api?apikey=${apiKey}`
  }

  return {
    getContractABI: getContractABI,
    getTransactionByHash: getTransactionByHash
  }
}

module.exports = EtherscanProvider
