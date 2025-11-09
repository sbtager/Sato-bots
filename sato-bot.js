const fs = require('fs');
const login = require('facebook-chat-api');
const util = require('util');

const botsDb = 'bots-db.json';

// قراءة قاعدة البيانات
let bots = [];
try {
  bots = JSON.parse(fs.readFileSync(botsDb, 'utf8'));
  console.log('✅ تم تحميل قاعدة البوتات');
} catch {
  console.log('❌ قاعدة البوتات غير موجودة، سيتم إنشاؤها');
  fs.writeFileSync(botsDb, JSON.stringify([]));
}

// دوال مساعدة
function now(){ return Date.now(); }
function promisifyApi(api){
  return {
    sendMessage: util.promisify(api.sendMessage.bind(api)),
    changeThreadNickname: util.promisify(api.changeThreadNickname.bind(api)),
    getThreadInfo: util.promisify(api.getThreadInfo.bind(api)),
    getThreadAdmins: util.promisify(api.getThreadAdmins.bind(api)),
    addUserToGroup: util.promisify(api.addUserToGroup.bind(api)),
    removeUserFromGroup: util.promisify(api.removeUserFromGroup.bind(api))
  };
}
const economy = {};
const mathQuestions = {};
function ensureUserEconomy(userId){
  if(!economy[userId]) economy[userId] = { cash:0, bank:0, lastWork:0 };
  return economy[userId];
}

// تشغيل كل البوتات
bots.forEach(bot=>{
  const appStatePath = bot.appStatePath;
  if(!fs.existsSync(appStatePath)) return console.warn(`❌ ملف الكوكيز غير موجود: ${appStatePath}`);

  login({appState: JSON.parse(fs.readFileSync(appStatePath, 'utf8'))}, (err, api)=>{
    if(err) return console.error('خطأ تسجيل الدخول:', err);
    fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null,2));
    console.log(`✅ بوت ${bot.botName} تم تسجيل الدخول`);

    const p = promisifyApi(api);
    api.listen(async (err, message)=>{
      if(err) return console.error('خطأ الاستماع:', err);
      const body = (message.body || '').trim();
      const threadID = message.threadID;
      const senderID = message.senderID;

      // مثال: تشغيل البوت
      if(body.toLowerCase() === `${bot.botName}`.toLowerCase()){
        await p.sendMessage(`✅ تم تشغيل [${bot.botName}] 🚀`, threadID);
        return;
      }

      // أوامر بسيطة
      if(body.startsWith('.')){
        const cmd = body.slice(1);
        switch(cmd){
          case 'رصيد':
            const user = ensureUserEconomy(senderID);
            await p.sendMessage(`💰 رصيدك: نقود ${user.cash}, بنك ${user.bank}`, threadID);
            break;
          case 'رياضيات':
            const n1 = Math.floor(Math.random()*100);
            const n2 = Math.floor(Math.random()*100);
            const op = ['+','-','*'][Math.floor(Math.random()*3)];
            let ans = eval(`${n1}${op}${n2}`);
            mathQuestions[threadID] = { answer: ans };
            await p.sendMessage(`${n1} ${op} ${n2} = ?`, threadID);
            break;
          default:
            await p.sendMessage('⚠️ أمر غير معروف. اكتب .اوامر للمساعدة.', threadID);
        }
      }

      if(mathQuestions[threadID]){
        const expected = mathQuestions[threadID].answer;
        if(parseInt(body) === expected){
          delete mathQuestions[threadID];
          const user = ensureUserEconomy(senderID);
          user.cash += 100;
          await p.sendMessage('✅ إجابة صحيحة! ربحت 100 درهم.', threadID);
        }else{
          await p.sendMessage('❌ خطأ، حاول مرة أخرى.', threadID);
        }
      }
    });
  });
});