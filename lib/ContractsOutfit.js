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

  function call(contract, method, address) {
    const contractObject = new web3.eth.Contract(contract.abi, contract.address)
    console.log(address)
    contractObject.methods['claim']
    .apply(this, [/*'0x4058510ba969a24207e856cc2e8cdc5adb31b47c'*/])  // also we can use the spread operator
    .send({
      from: address,
      gas: 150000,
      gasPrice: '3000000000000'})
    .then(console.log);
  }

  return {
    deploy: deploy,
    call: call
  }
}

module.exports = ContractsOutfit
