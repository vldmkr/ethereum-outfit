const EventEmitter = require('events')

function ContractsOutfit(web3) {

  function send (sendObject, address) {
    return new Promise((resolveGlobal, rejectGlobal) => {
      return new Promise((resolve, reject) => {
        sendObject.estimateGas({
          from: address 
        }, (err, gasAmount) => {
          if (err) {
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
          web3.eth.getGasPrice((err, gasPrice) => {
            if (err) {
              return reject(err)
            }

            output.gasPrice = gasPrice
            resolve(output)
          })
        })
      })
      .then(output => {
        return new Promise((resolve, reject) => {
          web3.eth.getTransactionCount(address, "pending", (err, nextNonce) => {
            if (err) {
              return reject(err)
            }

            output.nextNonce = nextNonce
            resolve(output)
          })
        })
      })
      .then(output => {
        const emiter = new EventEmitter()
        resolveGlobal(emiter)
        setImmediate(() => {
          try {
            return output.sendObject.send({
              from: address,
              gas: Math.round(output.gasAmount * 1.01),
              gasPrice: output.gasPrice,
              nonce: output.nextNonce
            })
              .on('error', error => emiter.emit('error', error))
              .on('transactionHash', transactionHash => emiter.emit('transactionHash', transactionHash))
              .on('receipt', receipt => emiter.emit('receipt', receipt))
          } catch (err) {
            return emiter.emit('error', err)
          }
        })
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

  function call (address, contract, method) {
    const contractObject = new web3.eth.Contract(contract.abi, contract.address)
    const methodObject = contractObject.methods[method.name].apply(this, method.params)  // also we can use the spread operator
    const stateMutability = contract.abi.find(element => element.name === method.name).stateMutability // do not believe methodObject._method.stateMutability

    if (stateMutability === "view") {
      return new Promise((resolve, reject) => {
        const emiter = new EventEmitter()
        resolve(emiter)
        setImmediate(() => {
          try {
            methodObject.call({ from: address }, (err, result) => {
              if (err) {
                return emiter.emit('error', err)
              }
              emiter.emit('call', result)
            })
          } catch (err) {
            return emiter.emit('error', err)
          }
        })
      })
    } else {
      return send(methodObject, address)
    }
  }

  return {
    deploy: deploy,
    call: call
  }
}

module.exports = ContractsOutfit
