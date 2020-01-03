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
var cron = require('node-cron');

///////////////////////////////////////////
let symbol = "USDT-TUSD"; //symbol
let programversion = "1.0.1"
///////////////////////////////////////////

let ticker; //variable für preise
let account; // walletinhalt
let buyorders = [];
let sellorders = [];
let initordergemacht = false; // erste order beim programmstart
let ausgangtusdt = 0;
let usdt = 0.0;
let tusd = 0.0;
let trades = 0;   // anzahl trades
let gewinnProzent = 0;
let date_ob = new Date();
let date = (date_ob.getDate());
let month = ((date_ob.getMonth() + 1));
//LIZENZ 
let tag = 15;
let monat = 1;
//LIZENZ

//start gui
console.clear();
telegrambot("|- SECURUS ARBITRAGE v"+programversion+" -|  |- ALPHA -| ")
log(chalk.yellow("|- SECURUS ARBITRAGE v"+programversion+" -| " +chalk.green(" |- ALPHA -| ")));
log();

if (date < tag && month <= monat) {
  
  log(chalk.green("LICENCE is valid"));
  telegrambot("LICENCE is valid")
  setInterval(getTicker,5000) //settings.interval
}
else {
  log(chalk.red("Please buy a LICENCE"));
  telegrambot("Please buy a LICENCE")
} 

async function getTicker() {
    try {
      ticker = await api.getTicker(symbol)
      await getAccounts()  // wallet prüfen
      await getBuysOrder()
      await getSellsOrder()
      await gui()  // zeige werte
    } catch(err) {
      console.log(err)
    } 
    console.log("ghallo")
  }

  setInterval(getTicker,100)

  /////////////////////// FUNKTIONEN /////////////////////////
  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  // GUI
async function gui()    {
    console.clear()
    log(chalk.gray("_________________________________________________________________________________________________________________________"));
    log(chalk.gray(" | price: ") + chalk.magenta(ticker.data.price) + chalk.gray(" | bestAsk: ") + chalk.red(ticker.data.bestAsk) + chalk.gray(" | bestBid: ") + 
    chalk.green(ticker.data.bestBid) + chalk.gray(" | bestAskSize: ") + chalk.cyan(ticker.data.bestAskSize) + chalk.cyan(" USDT") + chalk.gray(" | bestBidSize: ") + chalk.dim(ticker.data.bestBidSize) + chalk.dim(" USD \n") +
    chalk.gray("_________________________________________________________________________________________________________________________"));
    log(chalk.gray("USDT  | balance: ") + chalk.magenta(usdt.balance) + chalk.gray(" | in use: ") + chalk.red(usdt.holds) + chalk.gray(" | available: ") + 
    chalk.green(usdt.available) + chalk.gray(" | TUSDT balance: ") + chalk.cyan(tusd.balance) + chalk.cyan(" TUSD") + chalk.gray(" | TUSDT avaliable: ") + chalk.dim(tusd.available) + chalk.dim(" TUSD"));
    log(chalk.gray("ACTIVE ORDERS: Buy | Sell ") + chalk.green(buyorders.data.items.length) + " | "+ chalk.red(sellorders.data.items.length));
  }


  //zum aufräumen
  // INITIAL ORDER BEIM START
async function initOrder(){  
    ausgangtusdt = tusd.balance;
    
    var i = 0;
    var j = 1;
      
      
  
  
       if (buyorders.data.items.length < 1 && sellorders.data.items.length < 1 && initordergemacht == false){
         telegrambot("starte initial buy");
         while (i < settings.lines.length) {
          await buy(shortid.generate(),settings.lines[String(i)],Tradingamount())
          console.log("BUYLIMIT " + j + " Price: " + (settings.lines[i]) + " amount: "+ Tradingamount())
          telegrambot("BUYLIMIT " + j + " Price: " + (settings.lines[i]) + " amount: "+ Tradingamount())
          i+=1;
          j+=1;
          
         }
        initordergemacht = true;
        
       }
      
   
  }
  cron.schedule('0 * * * *', () => {
    telegrambot("orders: Buy | Sell "+ buyorders.data.items.length + " | " + sellorders.data.items.length + "\n" +
    "price: " + ticker.data.price + "\n" +
    "available: "+ usdt.available + " USDT \navailable: "+ tusd.available + " TUSD"
  )});
  
  //CRON
  //NEUE FUNKTIONEN
  // let initordergemacht = false; // erste order beim programmstart
  // let nachgekauft = false;
  // let verkaufen = false;
  
  async function refillOrder(){  
    
  
      let verkaufeusdt = parseFloat(usdt.available);
      let amount = verkaufeusdt.toFixed(4);
  
        if (buyorders.data.items.length < 1 && sellorders.data.items.length < 1 && initordergemacht == true){
          initordergemacht = false;
          telegrambot("INFO DEBUG  buyanzahl : "+ buyorders.data.items.length + " sellanzahl : " + sellorders.data.items.length + "initordervariable: ")+initordergemacht;
        }
      
    // await sell(shortid.generate(),"1.9","20")
        else if (initordergemacht == true && buyorders.data.items.length < settings.lines.length && usdt.available > 1) {
          await sell(shortid.generate(),settings.sellprice,amount)
          trades++;
          gewinnProzent = (tusd.balance * 100 / ausgangtusdt ) - 100;
          console.log("gewinn: "+gewinnProzent);
          console.log("trades: "+trades);
          telegrambot("Trade: "+trades+ "\nSetze Sellorder - Preis: " + settings.sellprice + " amount: "+ usdt.available + "\nGewinn % : "+gewinnProzent.toFixed(8));
          
          //amount jetzt x 100 / settingsamount - 100 = %
  
        }
        else if (initordergemacht == true && buyorders.data.items.length < settings.lines.length && Tradingamount() < tusd.available){
  
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
      //console.log("Kauforders: ")
      buyorders.data.items.forEach(element => {
       // console.log(element.id)
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
      //console.log("Sellorders: ")
      sellorders.data.items.forEach(element => {
       // console.log(element.id)
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
  
  
  
    
    
