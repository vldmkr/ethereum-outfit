(function () {
  var items = []

  this.deserializeItems = function () {
    items = JSON.parse(localStorage.getItem('items')) || []
    items.forEach(function(item) {
      drawItem(item.title, item.url, item.subtitle, true)
    });
  }

  this.serializeItems = function () {
    localStorage.setItem('items', JSON.stringify(items))
  }

  this.drawItem = function (title, url, subtitle, ignore) {
    var item = { 
      title: title, 
      url: url, 
      subtitle: subtitle
    }
    document.getElementById('tx-list').innerHTML += template.txItem(item)
    if( ! ignore) {
      items.push(item)
      serializeItems()
    }
  }
})()

window.addEventListener('load', function () {
  deserializeItems()
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

document.body.innerHTML += template.forkMe({ 
  url: 'https://github.com/vldmkr/erc20-token-boilerplate'
})

document.getElementById('btn-send').onclick = function () {
  web3.eth.contract(token.contractABI).at(token.contractAddress).transfer(
    document.getElementById("input-recipient").value,
    document.getElementById("input-amount").value,
    function (error, result) {
      if ( ! error) {
        drawItem('Send', 'https://ropsten.etherscan.io/tx/' + result, result)
      } else {
        drawItem('Send', '#send', error.message.split('\n')[0])
      }
    })
}

document.getElementById('btn-claim').onclick = function () {
  web3.eth.contract(token.contractABI).at(token.contractAddress).claim(
    function (error, result) {
      if ( ! error) {
        drawItem('Claim', 'https://ropsten.etherscan.io/tx/' + result, result)
      } else {
        drawItem('Claim', '#claim', error.message.split('\n')[0])
      }
    })
}

drawItem('Token Address', 'https://ropsten.etherscan.io/token/' + token.contractAddress, token.contractAddress, true)

route('send', function (isActive) {
  document.getElementById('send-form').style.display = isActive ? 'block' : 'none'
  document.getElementById('send-ref').className = isActive ? 'active' : ''
})

route('claim', function (isActive) {
  document.getElementById('claim-form').style.display = isActive ? 'block' : 'none'
  document.getElementById('claim-ref').className = isActive ? 'active' : ''
})
