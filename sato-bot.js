/**
 * Sato Bot Engine
 * تشغيل عدة بوتات من قاعدة واحدة
 * By Al-Qaysar
 */

const fs = require("fs");
const path = require("path");
const login = require("facebook-chat-api");

// =====================
// إعدادات عامة
// =====================
const BOT_DB_FILE = "bot-db.json";
const SESSION_DIR = "Session";
const ECONOMY_FILE = "economy.json";

// =====================
// أدوات مساعدة
// =====================
function log(type, msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] [${type}] ${msg}`);
}

function safeReadJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const data = fs.readFileSync(file, "utf8");
    if (!data.trim()) return fallback;
    return JSON.parse(data);
  } catch (err) {
    log("ERROR", `JSON error in ${file}: ${err.message}`);
    return fallback;
  }
}

function safeWriteJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// =====================
// تحميل القاعدة
// =====================
const botDB = safeReadJSON(BOT_DB_FILE, { bots: [] });

if (!Array.isArray(botDB.bots)) {
  log("FATAL", "bot-db.json لا يحتوي على bots[]");
  process.exit(1);
}

log("OK", `تم تحميل ${botDB.bots.length} بوت/بوتات`);

// =====================
// تحميل الاقتصاد
// =====================
const economy = safeReadJSON(ECONOMY_FILE, {});

// =====================
// تشغيل كل بوت
// =====================
botDB.bots.forEach((bot, index) => {
  startBot(bot, index);
});

// =====================
// دالة تشغيل بوت واحد
// =====================
function startBot(bot, index) {
  const {
    botName,
    prefix = ".",
    developerName,
    developerId,
    sessionFile
  } = bot;

  if (!botName || !sessionFile) {
    log("SKIP", `بوت رقم ${index} ناقص معلومات`);
    return;
  }

  const sessionPath = path.join(SESSION_DIR, sessionFile);

  if (!fs.existsSync(sessionPath)) {
    log("ERROR", `Session غير موجود للبوت ${botName}`);
    return;
  }

  let appState;
  try {
    appState = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  } catch (e) {
    log("ERROR", `appState تالف للبوت ${botName}`);
    return;
  }

  log("START", `تشغيل البوت: ${botName}`);

  login({ appState }, (err, api) => {
    if (err) {
      log("LOGIN_FAIL", `${botName}: ${err.error || err}`);
      return;
    }

    api.setOptions({
      listenEvents: true,
      selfListen: false
    });

    log("ONLINE", `${botName} متصل`);

    api.listenMqtt((err, event) => {
      if (err) return;

      if (event.type !== "message" || !event.body) return;

      const body = event.body.trim();
      const threadID = event.threadID;
      const senderID = event.senderID;

      // =====================
      // أمر الأوامر
      // =====================
      if (body === prefix + "اوامر") {
        api.sendMessage(
`✨ أوامـر ${botName} ✨

🔹 أوامر عامة
• ${prefix}اوامر
• ${prefix}المطور

🔹 أوامر ترفيه
• ${prefix}زوجني
• ${prefix}صفع

🔹 أوامر إقتصاد
• ${prefix}رصيد
• ${prefix}عمل

────────────────
المطور: ${developerName}
`, threadID);
        return;
      }

      // =====================
      // المطور
      // =====================
      if (body === prefix + "المطور") {
        api.sendMessage(
`👤 المطور
${developerName}
ID: ${developerId}`, threadID);
        return;
      }

      // =====================
      // رصيد
      // =====================
      if (body === prefix + "رصيد") {
        if (!economy[senderID]) {
          economy[senderID] = { cash: 0 };
          safeWriteJSON(ECONOMY_FILE, economy);
        }

        api.sendMessage(
`💰 رصيدك: ${economy[senderID].cash}`, threadID);
        return;
      }

      // =====================
      // عمل
      // =====================
      if (body === prefix + "عمل") {
        if (!economy[senderID]) economy[senderID] = { cash: 0 };

        const reward = Math.floor(Math.random() * 500) + 100;
        economy[senderID].cash += reward;
        safeWriteJSON(ECONOMY_FILE, economy);

        api.sendMessage(
`💼 عملت وربحت ${reward}`, threadID);
        return;
      }

    });
  });
}