var telegram = require('telegram-bot-api');
let fs = require('fs');
let settings = JSON.parse(fs.readFileSync('settings.JSON', 'utf8'));
settings.telegramchatid
//var chatid = "-394686882";
//-1001413092859
let chatid = settings.telegramchatid;
var api = new telegram({
  token: settings.telegrambottoken, 
  updates: {
    enabled: true
}
});



api.on('message', function(message)
{
  //console.log(message);
  console.log(message.from.first_name + "chatid: " + message.chat.id);
  // && message.from.id == settings.ownerid
  if (message.text == "info" || message.text == "Info") { 
    let nachricht = "bin online ...";
    api.sendMessage({
              chat_id: chatid,
              parse_mode: "HTML",
              text: nachricht
            })
  }

//   if (message.text == "Info" || message.text == "info"){
//    let nachricht = "<b>USDT :</b> " + usdt + "  \n" +
//     "<b>BTC :</b> " + btc + "  \n"
//     api.sendMessage({
//         chat_id: chatid,
//         parse_mode: "HTML",
//         text: nachricht
//       })
    
//   }
  
    // -1001180960690 testgruppe
    //chatid = message.chat.id; //sobald bot im channel holt er sich die chatid des channels ( jemand muss was schreiben )
   
   
   
});

module.exports = function (textn){
  api.sendMessage({
  chat_id: chatid,
  parse_mode: "HTML",
  text: textn
})
}