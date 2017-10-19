const fs = require('fs')
const path = require('path')
const solc = require('solc')

function ContractsCompiler(dirname) {

  function readContracts (dir, templateParams) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, function(err, filenames) {
        if (err) {
          return reject(err)
        }

        var input = {}
        for (var i = 0, len = filenames.length; i < len; i++) {
          let nameParts = filenames[i].split('.')
          let fileContents = fs.readFileSync(path.join(dir, filenames[i]), 'utf8')

          if(nameParts.pop() === "tmpl") {
            filenames[i] = nameParts.join('.')
            fileContents = template(fileContents, templateParams)
          }

          input[filenames[i]] = fileContents
        }

        resolve(input)
      })
    })
  }
  
  function template (tpl, args) {
    return tpl.replace(/\${(\w+)}/g, (_, v) => args[v]); 
  }

  function compile (templateParams) {
    return new Promise((resolve, reject) => {
      readContracts(dirname, templateParams)
      .then(input => {
        resolve(solc.compile({ sources: input }, 1))
      })
      .catch(reason => {
        reject(reason);
      })
    })
  }

  function deploy (web3, address, name, templateParams) {
    return new Promise((resolveGlobal, rejectGlobal) => {
      compile(templateParams)
      .then(output => {
        const contract = output.contracts[name]
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
        return output.deployObject.send({
          from: address,
          gas: Math.round(output.gasAmount * 1.01),
          gasPrice: output.gasPrice
        })
        .on('transactionHash', transactionHash => {
          resolveGlobal(transactionHash) 
        })
      })
      .catch(reason => {
        rejectGlobal(reason);
      })
    })
  }

  return {
    compile: compile,
    deploy: deploy
  }
}

module.exports = ContractsCompiler
