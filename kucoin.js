// Copyrights by SECURUS
"use strict"
let fs = require('fs');
let settings = JSON.parse(fs.readFileSync('settings.JSON', 'utf8'));
const api = require('kucoin-node-api')
const config = {
    apiKey: settings.apiKey,
    secretKey: settings.secretKey,
    passphrase: settings.passphrase,
    environment: settings.environment
  }

  api.init(config)
  //
  //cancelAllOrders()
  
  
 

 