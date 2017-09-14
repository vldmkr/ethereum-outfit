
function Web3Helper (web3) {

  const _methodIdBound = 2 + 4 * 2; // 0x + 4 bytes

  function getMethodABI (contractABI, methodName) {
    return contractABI.find(element => element.name === methodName)
  }

  function getMethodId (methodABI) {
    return web3.eth.abi.encodeFunctionSignature(methodABI)
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
      const decoded = web3.eth.abi.decodeParameters(methodABI.inputs, txInput.input)
      return {
        name: methodABI.name,
        methodId: txInput.methodId,
        inputs: methodABI.inputs.map((element, index) => {
          const newElement = Object.assign({}, element)
          newElement.value = decoded[element.name]
          return newElement
        })
      }
    }
    return null
  }

  return {
    getMethodABI: getMethodABI,
    getMethodId: getMethodId,
    parseTxInput: parseTxInput,
    createCallInfo: createCallInfo
  }
}

module.exports = Web3Helper
