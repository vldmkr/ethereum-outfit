const fs = require('fs')
const path = require('path')
const solc = require('solc')
const EventEmitter = require('events')

function ContractsCompiler(dirname) {

  function readContracts (dir, templateParams) {
    return new Promise((resolve, reject) => {

      const recursiveReadSync = (dir, sub = "", fileList = {}) => {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file)

          if (fs.statSync(filePath).isDirectory()) {
            Object.assign(fileList, recursiveReadSync(filePath, file))
          } else {
            const contract = readContractSync(dir, file, templateParams);
            fileList[path.join(sub, contract.name)] = contract.content;
          }
            
        })
        return fileList
      }

      resolve(recursiveReadSync(dir))
    })
  }

  function readContractSync (dir, filename, templateParams) {
    let nameParts = filename.split('.')
    let fileContent = fs.readFileSync(path.join(dir, filename), 'utf8')

    if (nameParts.pop() === "tmpl") {
      filename = nameParts.join('.')
      if (templateParams && Object.keys(templateParams).includes(filename)) {
        fileContent = template(fileContent, templateParams[filename])
      }
    }

    return {
      name: filename,
      content: fileContent
    }
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
