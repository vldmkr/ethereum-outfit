(function () {
  window.App = window.App || {} 
  var items = []

  App.restoreItemsFromStorage = function () {
    items = JSON.parse(localStorage.getItem('items')) || []
    items.forEach(function (item) {
      App.drawItem.apply(this, Object.values(item))
    });
  }

  App.drawItem = function (title, url, subtitle) {
    var item = { 
      title: title, 
      url: url, 
      subtitle: subtitle
    }
    document.getElementById('tx-list').innerHTML += template.txItem(item)
    return {
      toStorage: function () {
        items.push(item)
        localStorage.setItem('items', JSON.stringify(items))
      }
    }
  }
})()

window.addEventListener('load', function () {
  App.restoreItemsFromStorage()
  if (web3 !== undefined) {
    window.web3 = new Web3(web3.currentProvider)
    web3.net.getListening( function(error, result) { 
      if( ! error && result) {
        if(web3.eth.defaultAccount !== undefined) {
          document.getElementById('input-claim').placeholder = web3.eth.defaultAccount
        } else {
          document.getElementById('error-label').innerHTML = template.errorLabel({ text: 'Please unlock Metamask and refresh the page!' })
        }
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

document.getElementById('btn-send').addEventListener('click', function () {
  web3.eth.contract(token.contractABI).at(token.contractAddress).transfer(
    document.getElementById("input-recipient").value,
    document.getElementById("input-amount").value,
    function (error, result) {
      if ( ! error) {
        App.drawItem('Send', 'https://ropsten.etherscan.io/tx/' + result, result).toStorage()
      } else {
        App.drawItem('Send', '#send', error.message.split('\n')[0])
      }
    })
})

document.getElementById('btn-claim').addEventListener('click', function () {
  web3.eth.contract(token.contractABI).at(token.contractAddress).claim(
    function (error, result) {
      if ( ! error) {
        App.drawItem('Claim', 'https://ropsten.etherscan.io/tx/' + result, result).toStorage()
      } else {
        App.drawItem('Claim', '#claim', error.message.split('\n')[0])
      }
    })
})

App.drawItem('Token Address', 'https://ropsten.etherscan.io/token/' + token.contractAddress, token.contractAddress)

window.route('send', function (isActive) {
  document.getElementById('send-form').style.display = isActive ? 'block' : 'none'
  document.getElementById('send-ref').className = isActive ? 'active' : ''
})

window.route('claim', function (isActive) {
  document.getElementById('claim-form').style.display = isActive ? 'block' : 'none'
  document.getElementById('claim-ref').className = isActive ? 'active' : ''
})
