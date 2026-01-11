// ================================
// 🤖 Sato Bot - Main Engine
// ================================

const fs = require("fs");
const path = require("path");
const login = require("facebook-chat-api");

// ================================
// 📂 تحميل قاعدة البيانات
// ================================
let botDB;
try {
  botDB = JSON.parse(fs.readFileSync("./bots-db.json", "utf8"));
} catch (e) {
  console.error("❌ فشل قراءة bots-db.json");
  process.exit(1);
}

// ================================
// ⚙️ إعدادات البوت
// ================================
const BOT_NAME = botDB.botName || "Sato";
const PREFIX = botDB.prefix || ".";
const DEV_ID = botDB.devId || ".."; // .. = أي شخص
const DEV_NAME = botDB.devName || "مطور غير معروف";

let BOT_STARTED = false;

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

fs.readdirSync(commandsPath).forEach(file => {
  if (!file.endsWith(".js")) return;
  const cmdName = file.replace(".js", "");
  commands.set(cmdName, require(`./Sato-command/${file}`));
});

// ================================
// 🔐 تحميل appState أو cookies
// ================================
let appState;
try {
  appState = JSON.parse(
    fs.readFileSync(`./Sessions/${botDB.sessionFile}`, "utf8")
  );
} catch {
  console.error("❌ فشل تحميل appState");
  process.exit(1);
}

// ================================
// 🚀 تسجيل الدخول
// ================================
login({ appState }, (err, api) => {
  if (err) {
    console.error("❌ فشل تسجيل الدخول");
    return;
  }

  console.log("✅ تم تسجيل الدخول");

  api.setOptions({ listenEvents: true });

  api.listenMqtt(async (err, event) => {
    if (err) return;

    if (!event.body || !event.body.startsWith(PREFIX)) return;

    const body = event.body.slice(PREFIX.length).trim();
    const commandName = body.split(" ")[0];

    // ================================
    // ⛔ منع الأوامر قبل التشغيل
    // ================================
    if (!BOT_STARTED && commandName !== "تشغيل") {
      return;
    }

    // ================================
    // ▶️ تشغيل البوت
    // ================================
    if (commandName === "تشغيل") {
      if (DEV_ID !== ".." && event.senderID !== DEV_ID) {
        api.sendMessage("❌ هذا الأمر خاص بالمطور", event.threadID);
        return;
      }

      BOT_STARTED = true;

      // تغيير الكنية (لا يوقف البوت إذا فشل)
      try {
        api.changeThreadNickname(
          `${BOT_NAME} (${PREFIX})`,
          event.threadID,
          api.getCurrentUserID()
        );
      } catch {}

      api.sendMessage(
        `✅ تم التشغيل\nإصدار القالب: 0.1\nإسم البوت: ${BOT_NAME}\nاكتب ${PREFIX}اوامر لرؤية الأوامر`,
        event.threadID
      );
      return;
    }

    // ================================
    // 📦 تنفيذ الأوامر
    // ================================
    const command = commands.get(commandName);

    if (!command) {
      const reply =
        sarcasticReplies[Math.floor(Math.random() * sarcasticReplies.length)];
      api.sendMessage(reply, event.threadID);
      return;
    }

    try {
      await command({
        api,
        event,
        BOT_NAME,
        PREFIX,
        DEV_NAME,
        DEV_ID,
        botDB
      });
    } catch (e) {
      api.sendMessage("⚠️ حدث خطأ أثناء تنفيذ الأمر", event.threadID);
      console.error(e);
    }
  });
});