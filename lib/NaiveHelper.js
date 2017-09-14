var keccak256 = require('./keccak');

function NaiveHelper () {

  const _methodIdBound = 2 + 4 * 2; // 0x + 4 bytes

  function getMethodABI (contractABI, methodName) {
    return contractABI.find(element => element.name === methodName)
  }

  function getMethodId (methodABI) {
    const inputs = methodABI.inputs.map(element => element.type )

    const methodSignature = [methodABI.name, '(', inputs.join(','), ')'].join('')
    const methodHash = '0x' + keccak256(methodSignature)

    return methodHash.substring(0, _methodIdBound)
  }

  function parseTxInput (input) {
    return {
      methodId: input.slice(0, _methodIdBound),
      input: '0x' + input.slice(_methodIdBound),
      inputs: input.slice(_methodIdBound).match(/.{1,64}/g)
    }
  }

  function createCallInfo (methodABI, txInput) {
    if(getMethodId(methodABI) === txInput.methodId) {
      return {
        name: methodABI.name,
        methodId: txInput.methodId,
        inputs: methodABI.inputs.map((element, index) => {
          const newElement = Object.assign({}, element)
          newElement.value = normalizeValue(txInput.inputs[index], element.type)
          return newElement
        })
      }
    }
    return null
  }

  function normalizeValue (value, type) {
    switch(type) {
      case 'address': return '0x' + value.slice(-40)
      case 'uint256': return parseInt(value, 16).toString()
      default: return value
    }
  }
  
  return {
    getMethodABI: getMethodABI,
    getMethodId: getMethodId,
    parseTxInput: parseTxInput,
    createCallInfo: createCallInfo
  }
}

module.exports = NaiveHelper
