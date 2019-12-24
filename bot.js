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
let initorder = false; // erste order beim programmstart

let usdt = 0.0;
let tusd = 0.0;

let trades = 0;   // anzahl trades
let gewinnProzent = 0;


//start gui
console.clear();
telegrambot("ARBITRAGE gestartet")
log(chalk.yellow("|- SECURUS ARBITRAGE v"+programversion+" -| " +chalk.green(" |- ALPHA -| ")));
log();

setInterval(getTicker,5000); // Initialisiere MAINFUNCTION
/////////////////////////////    MAIN FUNCTION  TICKER  /////////////////////////////////////////////////////////////////////////////////////
async function getTicker() {
  try {
    ticker = await api.getTicker(symbol)
    await getAccounts()  // wallet prüfen
    await getBuysOrder()
    await getSellsOrder()
    await gui()  // zeige werte
    await initOrder() // starte ersten kauf - anschliessend setze variable initorder auf true
  
    //await refillOrder()
    setTimeout(refillOrder,5000)
    //await trysell()
  } catch(err) {
    console.log(err)
  } 
}
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
  log(chalk.gray("ACTIVE ORDERS: Buy | Sell ") + chalk.green(buyorders.data.items.length) + " | "+ chalk.red(sellorders.data.items.length));
  
}
//algo um kauf und sell zu definieren
async function initOrder(){  
 
  
  var i = 0;
  var j = 1;
     if (buyorders.data.items.length < 1 && initorder == false){
       telegrambot("starte initial buy");
       while (i < settings.lines.length) {
        await buy(shortid.generate(),settings.lines[String(i)],Tradingamount())
        console.log("BUYLIMIT " + j + " Preis: " + (settings.lines[i]) + " betrag: "+ Tradingamount())
        telegrambot("BUYLIMIT " + j + " Preis: " + (settings.lines[i]) + " betrag: "+ Tradingamount())
        i+=1;
        j+=1;
        
       }
      initorder = true; // setze inital order auf ok, damit nur beim programmstart gekauft wird
      
     }
    
    //  ////////////////////////////////////////////////////////////////////////////////////
    //  else if (initorder == true && buyorders.data.items.length < settings.lines.length) { //wenn minimum ein bid erfolgreich war
    //   await sell(shortid.generate(),"1.9","1")
    // telegrambot("Verkaufe: - SELL ORDER: 0.9999 betrag: "+ usdt.balance)
    // console.log("Verkaufe: - SELL ORDER: 0.9999 betrag: "+ usdt.balance)
    //  }

}

async function refillOrder(){  

    let verkaufeusdt = parseFloat(usdt.available);
    let amount = verkaufeusdt.toFixed(4);

      if (buyorders.data.items.length < 1 && sellorders.data.items.length < 1 && initorder == true){
        initorder = false;
        telegrambot("Abverkauf - führe inital buy durch");
      }
    
  // await sell(shortid.generate(),"1.9","20")
      else if (initorder == true && buyorders.data.items.length < settings.lines.length && usdt.available > 1) {
        await sell(shortid.generate(),settings.sellprice,amount)
        trades++;
        gewinnProzent = (tusd.balance * 100 / settings.maxamount) - 100;
        console.log("gewinn: "+gewinnProzent);
        console.log("trades: "+trades);
        telegrambot("Trade: "+trades+ "\nSetze Sellorder - Preis: " + settings.sellprice + " amount: "+ usdt.available + "\nGewinn % : "+gewinnProzent);
        
        //amount jetzt x 100 / settingsamount - 100 = %

      }
      else if (initorder == true && buyorders.data.items.length < settings.lines.length && Tradingamount() < tusd.available){

      await buy(shortid.generate(),settings.lines[0],Tradingamount())
      telegrambot("Nachkauf: - BUY ORDER: " + (settings.lines[0]) + " betrag: "+ Tradingamount())
      console.log("Nachkauf: - BUY ORDER: " + (settings.lines[0]) + " betrag: "+ Tradingamount())
     }
}

//function zur Berechnung  des Tradingeinsatzes
function Tradingamount()  {
  let wert = settings.maxamount / settings.lines.length
  return wert.toFixed(0)
}
 
//////////////////////////////////////////////
//SELL
// Wallet ansehen - zeige assets
async function trysell()  {

  if (initorder == true && buyorders.data.items.length < settings.lines.length){

    await sell(shortid.generate(),"0.009",usdt.balance)
    telegrambot("Nachkauf: - BUY ORDER: 0.9999 betrag: "+ usdt.balance)
    console.log("Nachkauf: - BUY ORDER: 0.9999 betrag: "+ usdt.balance)
   }




  if(initorder == true &&  buyorders.data.items.length < settings.lines.length)  { //ticker.data.price >= 0.9999 &&
    console.log("ok")
    buyorders.data.items.forEach(element => {
      cancel(element.id)
    });

    //sell(shortid.generate(),"0.9999",usdt.balance)
    //telegrambot("SELL " +usdt.balance + " for 0.9999");


    // buyorders.data.items.forEach(element => {
    //   console.log(element.id)
    // });
    //initorder = false
  }
}

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
 ///////////////// BUY ORDER /////////////////
 async function buy(Oid,price,amount) {
  try {
      let buy = {
          clientOid: Oid,
          side: 'buy',
          symbol: 'USDT-TUSD',
          type: 'limit',
          price: price,
          size: amount
        }
    let buyinfo = await api.placeOrder(buy)
    if (buyinfo.msg){ // debug wenn fehler kommz msg
      console.log(buyinfo.msg)
      telegrambot(buyinfo.msg)
    } 
    

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
          size: amount
        }
    let buyinfo = await api.placeOrder(sell); 
    if (buyinfo.msg){ // debug wenn fehler kommz msg
      console.log(buyinfo.msg)
      telegrambot(buyinfo.msg)
    } 
  } catch(err) {
    console.log(err)
  } 
}

// ORDER LÖSCHEN
async function cancel(element) {
  try {
      
        let cancel = {
          id: element
          }

          let cancelinfo = await api.cancelOrder(cancel)
          

  } catch(err) {
    console.log(err)
  } 
}

//SLEEP
function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function trysell()  {
  if(ticker.data.price >= 0.9999 && buyorders.data.items.length < settings.lines.length && initorder == true)  {
    
    buyorders.data.items.forEach(element => {
      cancel(element.id)
    });

    sell(shortid.generate(),"0.9999",usdt.balance)


    // buyorders.data.items.forEach(element => {
    //   console.log(element.id)
    // });

  }
}
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  










 
 







