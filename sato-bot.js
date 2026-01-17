// ================================
// 🤖 Sato Bot - Main Engine
// ================================

const fs = require("fs");
const path = require("path");

// تجاوز خطأ Public Suffix في Tough Cookie قبل تحميل facebook-chat-api
const tough = require("tough-cookie");
if (tough.CookieJar) {
  const originalSetCookie = tough.CookieJar.prototype.setCookie;
  tough.CookieJar.prototype.setCookie = function(cookieOrString, url, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};
    options.ignoreError = true;
    options.loose = true;
    return originalSetCookie.call(this, cookieOrString, url, options, cb);
  };
  
  const originalSetCookieSync = tough.CookieJar.prototype.setCookieSync;
  tough.CookieJar.prototype.setCookieSync = function(cookieOrString, url, options) {
    options = options || {};
    options.ignoreError = true;
    options.loose = true;
    return originalSetCookieSync.call(this, cookieOrString, url, options);
  };
}

const login = require("@anbuinfosec/fca-unofficial");

// ================================
// 📂 تحميل قاعدة البيانات
// ================================
let botDBs;
try {
  botDBs = JSON.parse(fs.readFileSync("./bots-db.json", "utf8"));
  if (!Array.isArray(botDBs)) botDBs = [botDBs];
  // تركيز فقط على سوتارو كما طلب المستخدم
  botDBs = botDBs.filter(b => b.name === "سوتارو");
} catch (e) {
  console.error("❌ فشل قراءة bots-db.json");
  process.exit(1);
}

// ================================
// 📌 جُمل ساخرة للأوامر غير الموجودة
// ================================
const sarcasticReplies = [
  "❌ الأمر غير موجود، مثل تركيزك.",
  "🤡 هذا ليس أمرًا… جرّب مرة أخرى.",
  "🧠 الأمر فارغ مثل رأسك.",
  "🙃 حتى أنا لم أفهم ماذا تريد.",
  "🚫 لا يوجد أمر بهذا الاسم يا عبقري."
];

// ================================
// 📂 تحميل الأوامر
// ================================
const commands = new Map();
const commandsPath = path.join(__dirname, "Sato-command");

if (fs.existsSync(commandsPath)) {
  fs.readdirSync(commandsPath).forEach(file => {
    if (!file.endsWith(".js")) return;
    const cmdName = file.replace(".js", "");
    try {
      commands.set(cmdName, require(`./Sato-command/${file}`));
    } catch (e) {
      console.error(`❌ فشل تحميل الأمر ${file}:`, e.message);
    }
  });
}

// ================================
// 🚀 تسجيل الدخول والاستماع
// ================================
function startBot(botConfig) {
  const currentSessionPath = path.join(__dirname, botConfig.session);
  let currentAppState;
  try {
    currentAppState = JSON.parse(fs.readFileSync(currentSessionPath, "utf8"));
  } catch (e) {
    console.error(`❌ [${botConfig.name}] فشل تحميل appState:`, e.message);
    return;
  }

  console.log(`⏳ [${botConfig.name}] جاري محاولة الاتصال بالجلسة...`);
  
  login({ appState: currentAppState }, (err, api) => {
    if (err) {
      console.error(`❌ [${botConfig.name}] فشل الاتصال بالجلسة:`, err.error || err.message || err);
      setTimeout(() => startBot(botConfig), 60000); // إعادة محاولة كل دقيقة
      return;
    }

    // حفظ الجلسة الجديدة تلقائياً عند نجاح الاتصال
    try {
      const newAppState = api.getAppState();
      fs.writeFileSync(currentSessionPath, JSON.stringify(newAppState, null, 2));
      console.log(`💾 [${botConfig.name}] تم تحديث ملف الجلسة تلقائياً بنجاح`);
    } catch (e) {
      console.error(`⚠️ [${botConfig.name}] فشل تحديث ملف الجلسة:`, e.message);
    }

    console.log(`✅ [${botConfig.name}] متصل الآن بنجاح وجاهز للإجابة`);

    const PREFIX = botConfig.prefix || ".";
    const BOT_NAME = botConfig.name || "Sato";
    const DEV_ID = botConfig.devId || "..";
    const DEV_NAME = botConfig.devName || "مطور غير معروف";

    api.setOptions({ 
      listenEvents: true, 
      selfListen: true,
      updatePresence: true,
      forceLogin: false,
      autoMarkRead: true,
      logLevel: "silent",
      online: true,
      forcePoll: true // لضمان استلام الرسائل فوراً
    });

    const handleEvent = async (event) => {
      // إرسال رسالة في الكونسول عند وصول أي حدث
      console.log(`📡 [${BOT_NAME}] حدث جديد مستلم: ${event.type} من ${event.senderID || 'نظام'}`);

      if (event.type !== "message" && event.type !== "message_reply") return;
      
      const messageBody = event.body;
      if (!messageBody) return;
      
      console.log(`📩 [${BOT_NAME}] رسالة من ${event.senderID}: ${messageBody}`);

      if (!messageBody.startsWith(PREFIX)) return;

      const body = messageBody.slice(PREFIX.length).trim();
      const args = body.split(/\s+/);
      const commandName = args.shift();

      const command = commands.get(commandName);
      if (!command) {
        const reply = sarcasticReplies[Math.floor(Math.random() * sarcasticReplies.length)];
        api.sendMessage(reply, event.threadID);
        return;
      }

      try {
        await command({
          api,
          event,
          command: commandName,
          args,
          BOT_NAME,
          PREFIX,
          DEV_NAME,
          DEV_ID,
          botDB: botConfig
        });
        console.log(`[Status] [${BOT_NAME}] تم الرد على الأمر ${commandName} بنجاح`);
      } catch (e) {
        api.sendMessage("⚠️ حدث خطأ أثناء تنفيذ الأمر", event.threadID);
        console.error(`❌ [${BOT_NAME}] خطأ في تنفيذ الأمر ${commandName}:`, e);
      }
    };

    console.log(`👂 [${BOT_NAME}] جاري بدء الاستماع للرسائل...`);
    api.listen((err, event) => {
      if (err) {
        console.error(`❌ [${BOT_NAME}] خطأ في الاستماع:`, err);
        // في حال حدوث خطأ في الاستماع، نعيد تشغيل الجلسة فوراً
        setTimeout(() => startBot(botConfig), 5000);
        return;
      }
      
      if (!event) {
        console.warn(`⚠️ [${BOT_NAME}] تم استلام حدث فارغ من الاستماع.`);
        return;
      }
      
      handleEvent(event);
    });
  });
}

// بدء تشغيل البوت المختار
botDBs.forEach(config => {
  startBot(config);
});

// Keep-Alive نظام إحياء
setInterval(() => {
  const now = new Date().toLocaleTimeString();
  process.stdout.write(`\r[إحياء الجلسة] نظام سوتارو يعمل بنجاح - ${now}  `);
}, 30000);

process.on('uncaughtException', (err) => {
  if (err.message && (err.message.includes('successful_results') || err.message.includes('getSeqId'))) return;
  console.error('\n🚫 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  if (reason && reason.message && reason.message.includes('successful_results')) return;
  console.error('\n🚫 Unhandled Rejection:', reason);
});
