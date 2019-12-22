var telegram = require('telegram-bot-api');
var chatid = "-394686882";
var api = new telegram({
  token: '900713379:AAEPXTCyrRLuQnWqwejLY44OwB78yqGnEgk', 
  updates: {
    enabled: true
}
});



api.on('message', function(message)
{
  console.log(message.from.first_name + "chatid: " + message.chat.id);

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