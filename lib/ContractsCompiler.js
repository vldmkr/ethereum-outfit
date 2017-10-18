const fs = require('fs')
const path = require('path')
const solc = require('solc')

function ContractsCompiler(dirname, templateParams) {

  function readContracts (dir) {
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

  function compile () {
    return new Promise((resolve, reject) => {
      return readContracts(dirname)
      .then(input => {
        console.log(input)
        resolve(solc.compile({ sources: input }, 1))
      })
    })
  }

  function template (tpl, args) {
    return tpl.replace(/\${(\w+)}/g, (_, v) => args[v]); 
  }

  return {
    compile: compile
  }
}

module.exports = ContractsCompiler
