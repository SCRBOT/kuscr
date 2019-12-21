exports = function gui(){
    
    log(zeit + chalk.gray(" | price: ") + chalk.magenta(ticker.data.price) + chalk.gray(" | bestAsk: ") + chalk.red(ticker.data.bestAsk) + chalk.gray(" | bestBid: ") + 
    chalk.green(ticker.data.bestBid) + chalk.gray(" | bestAskSize: ") + chalk.cyan(ticker.data.bestAskSize) + chalk.cyan(" USDT") + chalk.gray(" | bestBidSize: ") + chalk.dim(ticker.data.bestBidSize) + chalk.dim(" USD"));
    log(chalk.gray("_________________________________________________________________________________________________________________________"));

    
}

exports = async function getTicker() {
    try {
      ticker = await api.getAccounts()
      console.log(ticker.data)
    
      
    } catch(err) {
      console.log(err)
    } 
  }

exports = async function kaufenverkaufen(){
    if (ticker.data.price <= 0.9990 && order == false){
        //buy()
        order = true;
        log("gekauft für " + ticker.data.price)
        telegrambot("gekauft für " + ticker.data.price);
    }
    else if (ticker.data.price >= 0.9999 && order == true){
        //sell()
        order = false;
        trades++;
        log("vekauft für " + ticker.data.price)
        telegrambot("verkauft für " + ticker.data.price + " das ist Trade: " + trades);
        
    }
}

exports = async function getTicker() {
    try {
      ticker = await api.getTicker(symbol)
      //console.log(ticker.data)
      gui()
      kaufenverkaufen()
      
    } catch(err) {
      console.log(err)
    } 
  }

  
  ///////////////// BUY /////////////////
exports = async function buy() {
    try {
        let buy = {
            clientOid: '2ew',
            side: 'buy',
            symbol: symbol,
            type: 'limit',
            price: ticker.data.price,
            size: '100'
          }
      let buyinfo = await api.getAccounts(buy)
      console.log(buyinfo.data)
      
    } catch(err) {
      console.log(err)
    } 
  }

///////////////// SELL /////////////////
exports = async function sell() {
    try {
        let sell = {
            clientOid: '2ew',
            side: 'sell',
            symbol: symbol,
            type: 'limit',
            price: price,
            size: string
          }
      let buyinfo = await api.getAccounts(buy)
      console.log(buyinfo.data)
      
    } catch(err) {
      console.log(err)
    } 
  }
//////////////////////////////////////////////