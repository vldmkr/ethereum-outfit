const fs = require('fs')
const path = require('path')
const solc = require('solc')
const EventEmitter = require('events')

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

          if (nameParts.pop() === "tmpl") {
            const name = nameParts.join('.')
            if (templateParams && Object.keys(templateParams).includes(name)) {
              input[name] = template(fileContents, templateParams[name])
            }
          } else {
            input[filenames[i]] = fileContents
          }
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

  return {
    compile: compile
  }
}

module.exports = ContractsCompiler
