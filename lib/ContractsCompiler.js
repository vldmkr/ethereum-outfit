const fs = require('fs')
const path = require('path')
const solc = require('solc')

function ContractsCompiler(dirname) {

  function readContracts (dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, function(err, filenames) {
        if (err) {
          return reject(err)
        }

        var input = {}
        for (var i = 0, len = filenames.length; i < len; i++) { 
          input[filenames[i]] = fs.readFileSync(path.join(dir, filenames[i]), 'utf8')
        }

        resolve(input)
      })
    })
  }

  function compile () {
    return new Promise((resolve, reject) => {
      return readContracts(dirname)
      .then(input => {
        resolve(solc.compile({ sources: input }, 1))
      })
    })
  }

  return {
    compile: compile
  }
}

module.exports = ContractsCompiler
