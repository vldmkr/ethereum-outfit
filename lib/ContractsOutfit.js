const EventEmitter = require('events')

function ContractsOutfit(web3) {

  function deploy (contract, address) {
    return new Promise((resolveGlobal, rejectGlobal) => {
      const abi = JSON.parse(contract.interface)
      const contractObject = new web3.eth.Contract(abi)
      const deployObject = contractObject.deploy({ data: "0x" + contract.bytecode })

      return new Promise((resolve, reject) => {
        deployObject.estimateGas({
          from: address 
        }, (err, gasAmount) => {
          if(err) {
            return reject(err)
          }
          resolve({
            gasAmount: gasAmount,
            deployObject: deployObject
          })
        })
      })
      .then(output => {
        return new Promise((resolve, reject) => {
          web3.eth.getGasPrice(gasPrice => {
            output.gasPrice = gasPrice
            resolve(output)
          })
        })
      })
      .then(output => {
        const emiter = new EventEmitter();
        resolveGlobal(emiter)
        
        return output.deployObject.send({
          from: address,
          gas: Math.round(output.gasAmount * 1.01),
          gasPrice: output.gasPrice
        })
        .on('error', error => emiter.emit('error', error))
        .on('transactionHash', transactionHash => emiter.emit('transactionHash', transactionHash))
        .on('receipt', receipt => emiter.emit('receipt', receipt))
      })
      .catch(reason => {
        rejectGlobal(reason);
      })
    })
  }

  return {
    deploy: deploy
  }
}

module.exports = ContractsOutfit
