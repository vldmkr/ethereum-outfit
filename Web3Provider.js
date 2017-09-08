const Web3 = require('web3');

function Web3Provider(url) {

  const _web3 = new Web3(new Web3.providers.HttpProvider(url || 'https://ropsten.infura.io/'))

  function getTransactionByHash (transactionHash) {
    return _web3.eth.getTransaction(transactionHash)
  }

  return {
    getTransactionByHash: getTransactionByHash,
    web3: _web3
  }
}

module.exports = Web3Provider
