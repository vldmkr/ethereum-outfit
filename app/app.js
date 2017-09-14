window.addEventListener('load', function () {
  if (typeof web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider)

    web3.net.getListening( function(error, result) { 
      if( ! error && result) {
        document.getElementById('input-claim').placeholder = web3.eth.defaultAccount
      }
    })
  } else {
    document.getElementById('error-label').innerHTML = template.errorLabel({ text: 'Please use Chrome, install Metamask and then try again!' })
    document.getElementById('btn-send').disabled = true
    document.getElementById('btn-claim').disabled = true
  }
});

document.getElementById('tx-list').innerHTML += template.txItem({ 
  title: 'Token Address', 
  url: 'https://ropsten.etherscan.io/token/' + token.contractAddress, 
  subtitle: token.contractAddress
})

document.body.innerHTML += template.forkMe({ 
  url: 'https://github.com/vldmkr/erc20-token-boilerplate'
})

document.getElementById('btn-send').onclick = function () {
  web3.eth.contract(token.contractABI).at(token.contractAddress).transfer(
    document.getElementById("input-recipient").value,
    document.getElementById("input-amount").value,
    function (error, result) {
      if ( ! error) {
        document.getElementById('tx-list').innerHTML += template.txItem({ 
          title: 'Send', 
          url: 'https://ropsten.etherscan.io/tx/' + result, 
          subtitle: result
        })
      } else {
        document.getElementById('tx-list').innerHTML += template.txItem({ 
          title: 'Send', 
          url: '#send', 
          subtitle: error.message.split('\n')[0]
        })
      }
    })
}

document.getElementById('btn-claim').onclick = function () {
  web3.eth.contract(token.contractABI).at(token.contractAddress).claim(
    function (error, result) {
      if ( ! error) {
        document.getElementById('tx-list').innerHTML += template.txItem({ 
          title: 'Claim', 
          url: 'https://ropsten.etherscan.io/tx/' + result, 
          subtitle: result
        })
      } else {
        document.getElementById('tx-list').innerHTML += template.txItem({ 
          title: 'Claim', 
          url: '#claim', 
          subtitle: error.message.split('\n')[0]
        })
      }
    })
}

route('send', function (isActive) {
  document.getElementById('send-form').style.display = isActive ? 'block' : 'none'
  document.getElementById('send-ref').className = isActive ? 'active' : ''
});

route('claim', function (isActive) {
  document.getElementById('claim-form').style.display = isActive ? 'block' : 'none'
  document.getElementById('claim-ref').className = isActive ? 'active' : ''
});
