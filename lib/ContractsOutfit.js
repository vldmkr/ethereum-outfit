const EventEmitter = require('events')

function ContractsOutfit(web3) {

  function send (sendObject, address) {
    return new Promise((resolveGlobal, rejectGlobal) => {
      return new Promise((resolve, reject) => {
        sendObject.estimateGas({
          from: address 
        }, (err, gasAmount) => {
          if(err) {
            return reject(err)
          }
          resolve({
            gasAmount: gasAmount,
            sendObject: sendObject
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
        const emiter = new EventEmitter()
        resolveGlobal(emiter)

        return output.sendObject.send({
          from: address,
          gas: Math.round(output.gasAmount * 1.01),
          gasPrice: output.gasPrice
        })
        .on('error', error => emiter.emit('error', error))
        .on('transactionHash', transactionHash => emiter.emit('transactionHash', transactionHash))
        .on('receipt', receipt => emiter.emit('receipt', receipt))
      })
      .catch(reason => {
        rejectGlobal(reason)
      })
    })
  }

  function deploy (address, contractFromCompiler, arguments) {
    const abi = JSON.parse(contractFromCompiler.interface)
    const contractObject = new web3.eth.Contract(abi)
    const deployObject = contractObject.deploy({ 
      data: "0x" + contractFromCompiler.bytecode,
      arguments: arguments
    })

    return send(deployObject, address)
  }

  function methodCall (address, contract, method) {
    const contractObject = new web3.eth.Contract(contract.abi, contract.address)
    const methodObject = contractObject.methods[method.name].apply(this, method.params)  // also we can use the spread operator

    return methodObject.call({ from: address})
  }

  function methodSend (address, contract, method) {
    const contractObject = new web3.eth.Contract(contract.abi, contract.address)
    const methodObject = contractObject.methods[method.name].apply(this, method.params)  // also we can use the spread operator

    return send(methodObject, address)
  }

  return {
    deploy: deploy,
    methodCall: methodCall,
    methodSend: methodSend
  }
}

module.exports = ContractsOutfit
