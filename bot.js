// Copyrights by SECURUS
"use strict"
let fs = require('fs');
let settings = JSON.parse(fs.readFileSync('settings.JSON', 'utf8'));

const kucoin = require('./kucoin.js')
const api = require('kucoin-node-api')
let moment = require('moment');
const chalk = require('chalk');
let telegrambot = require("./telegram.js");
const shortid = require('shortid');
const log = console.log;


///////////////////////////////////////////
let symbol = "USDT-TUSD"; //symbol
let programversion = "1.0.0"
///////////////////////////////////////////

let ticker; //variable für preise
let account; // walletinhalt
let orders; //tradeinformation
let buyorders = [];
let sellorders = [];
let orderid = []; // array mit den tradeids zum canceln
let orderactive = false; // variable für order 


let usdt = 0.0;
let tusd = 0.0;


let trades = 0;   // anzahl trades
let gewinnProzent = 0;
let unter = false;
let oben = false;


//start gui
console.clear();
log(chalk.yellow("|- SECURUS ARBITRAGE v"+programversion+" -| " +chalk.green(" |- ALPHA -| ")));
log();

setInterval(getTicker,5000); // Initialisiere Grundfunktion
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GUI
async function gui(){
  //log(zeit); 
  //console.clear() 
  log(chalk.gray("_________________________________________________________________________________________________________________________"));
  log(chalk.gray(" | price: ") + chalk.magenta(ticker.data.price) + chalk.gray(" | bestAsk: ") + chalk.red(ticker.data.bestAsk) + chalk.gray(" | bestBid: ") + 
  chalk.green(ticker.data.bestBid) + chalk.gray(" | bestAskSize: ") + chalk.cyan(ticker.data.bestAskSize) + chalk.cyan(" USDT") + chalk.gray(" | bestBidSize: ") + chalk.dim(ticker.data.bestBidSize) + chalk.dim(" USD \n") +
  chalk.gray("_________________________________________________________________________________________________________________________"));
  log(chalk.gray("USDT  | balance: ") + chalk.magenta(usdt.balance) + chalk.gray(" | in use: ") + chalk.red(usdt.holds) + chalk.gray(" | available: ") + 
  chalk.green(usdt.available) + chalk.gray(" | TUSDT balance: ") + chalk.cyan(tusd.balance) + chalk.cyan(" TUSD") + chalk.gray(" | TUSDT avaliable: ") + chalk.dim(tusd.available) + chalk.dim(" TUSD"));
  log(chalk.gray("Orders: ") + chalk.yellow(orders.data.totalNum));
  
}
//algo um kauf und sell zu definieren
async function setzeOrder(){  
    if (orderactive == false && orders.data.totalNum < 1 ){
        
      var i = 0;
      var j = i + 1;
      function f() {
      buy(shortid.generate(),settings.lines[i],Tradingamount())//buy(String(i),String(settings.lines[i],"5"))
      console.log("BUYLIMIT " + j + " Preis: " + settings.lines[i] + " betrag: "+ Tradingamount())
      i++;
      j++;
      if( i < settings.lines.length ){
        setTimeout( f, 1000 );
    }
}
f();
    orderactive = true;
}
  
}

//function zur Berechnung  des Tradingeinsatzes
function Tradingamount()  {
  let wert = settings.maxamount / settings.lines.length
  return wert.toFixed(2)
}
//
//aktuelle preise ansehen - alle 5 Sekunden 
async function getTicker() {
    try {
      ticker = await api.getTicker(symbol)
      await getAccounts()  // wallet prüfen
      await getOrder()
      await getBuysOrder()
      await getSellsOrder()
      

      await gui()  // zeige werte
      setzeOrder()
      trysell()
      meldePreise()

      

      
    } catch(err) {
      console.log(err)
    } 
  }

//funktion telegrambenachrichtigung
function meldePreise()  {
  
  if (ticker.data.price <= 0.9994 && unter == false){
    telegrambot("Preis USDT : " + ticker.data.price + " würde kaufen")
    unter = true
  }

  else if (ticker.data.price >= 0.9999 && oben == false){
    trades++;
  
    telegrambot("Preis USDT : " + ticker.data.price + " würde verkaufen. Trades: " + trades)
    
    oben = true
  }
}


//////////////////////////////////////////////
// Wallet ansehen - zeige assets
async function getAccounts() {
  let params = {
    
    "type": "trade"
}
  try {
    
    account = await api.getAccounts(params)
    //console.log(account.data[0])
    account.data.forEach(element => {
        usdt = account.data.find(item => item.currency == "USDT");
        tusd = account.data.find(item => item.currency == "TUSD");
    });

    
  } catch(err) {
    console.log(err)
  } 
}

//BUYS ORDER anzeigen
async function getBuysOrder() {
  
  let params = {
    status: 'active',
    symbol: symbol,
    side: 'buy'
  }
  try {
    buyorders = await api.getOrders(params)
    console.log("Kauforders: ")
    buyorders.data.items.forEach(element => {
      console.log(element.id)
    });
      //console.log(orders)
      // console.log("kauforders: "+ buyorders.data.items[0].id)
    
    
    
  } catch(err) {
    console.log(err)
  } 
}
//SELL ORDER anzeigen
async function getSellsOrder() {
  
  let params = {
    status: 'active',
    symbol: symbol,
    side: 'sell'
  }
  try {
    sellorders = await api.getOrders(params)
    console.log("Sellorders: ")
    sellorders.data.items.forEach(element => {
      console.log(element.id)
    });
    
    
    
  } catch(err) {
    console.log(err)
  } 
}
//ORDER anzeigen
async function getOrder() {
  
  let params = {
    status: 'active',
    symbol: symbol,
  }
  try {
    orders = await api.getOrders(params)
    
      //console.log(orders)
      //console.log(orders.data.items[0].id)
    
    
    
  } catch(err) {
    console.log(err)
  } 
}
 ///////////////// BUY ORDER /////////////////
 async function buy(Oid,price,amount) {
  try {
      let buy = {
          clientOid: Oid,
          side: 'buy',
          symbol: 'USDT-TUSD',
          type: 'limit',
          price: price,
          size: amount,
          hidden: true
        }
    let buyinfo = await api.placeOrder(buy)
    orderid.push(buyinfo.data.orderId);
    
  } catch(err) {
    console.log(err)
  } 
}

///////////////// SELL ORDER /////////////////
async function sell(Oid,price,amount) {
  try {
      let sell = {
          clientOid: Oid,
          side: 'sell',
          symbol: 'USDT-TUSD',
          type: 'limit',
          price: price,
          size: amount,
          hidden: true
        }
    let buyinfo = await api.placeOrder(sell)
    orderid.push(buyinfo.data.orderId);
    
  } catch(err) {
    console.log(err)
  } 
}



async function cancel(element) {
  try {
      
        let cancel = {
          id: element
          }

          let cancelinfo = await api.cancelOrder(cancel)
          if(cancelinfo.data.cancelledOrderIds) {
            orderid.shift()
          }
          
          
          
    
  } catch(err) {
    console.log(err)
  } 
}

//SLEEP
function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function trysell()  {
  if(ticker.data.price >= 0.9999 && orders.data.totalNum < settings.lines.length && orderactive == true)  {

    orderid.forEach(element => {
      cancel(element)
    });

    sell(shortid.generate(),"0.9999",usdt.balance)


    

  }
}
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  










 
 







