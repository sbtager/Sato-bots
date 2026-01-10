// ==================================
// 💰 أوامر الإقتصاد | Sato Bot
// (عمل - رصيد - إعطاء)
// ==================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'economy.json');

// تحميل القاعدة
function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return {};
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('❌ خطأ قراءة economy.json');
    return {};
  }
}

// حفظ القاعدة
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = async function economyCommand({ api, event, command, args }) {
  const { threadID, senderID, mentions } = event;
  const db = loadDB();

  // تهيئة المستخدم
  if (!db[senderID]) {
    db[senderID] = {
      cash: 0,
      bank: 0,
      lastWork: 0
    };
  }

  // ======================
  // 🧰 أمر عمل
  // ======================
  if (command === 'عمل') {
    const now = Date.now();
    const cooldown = Math.floor(Math.random() * (1500 - 50 + 1) + 50) * 1000;

    if (now < db[senderID].lastWork) {
      const remaining = Math.ceil((db[senderID].lastWork - now) / 1000);
      await api.sendMessage(
        `⏳ لقد عملت للتو، يجب أن ترتاح.\nالوقت المتبقي: ${remaining} ثانية`,
        threadID
      );
      return true;
    }

    const jobs = [
      'محامي',
      'مبرمج',
      'طبيب',
      'أستاذ',
      'مصلح سيارات',
      'شرطي',
      'سارق'
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const reward = Math.floor(Math.random() * (1500 - 100 + 1) + 100);

    db[senderID].cash += reward;
    db[senderID].lastWork = now + cooldown;
    saveDB(db);

    await api.sendMessage(
      `💼 لقد عملت كـ (${job}) وحصلت على 💵 ${reward}`,
      threadID
    );
    return true;
  }

  // ======================
  // 💳 أمر رصيد
  // ======================
  if (command === 'رصيد') {
    await api.sendMessage(
      `💰 رصيدك الحالي:\n\n💵 المال في اليد: ${db[senderID].cash}\n🏦 المال في البنك: ${db[senderID].bank}`,
      threadID
    );
    return true;
  }

  // ======================
  // 🎁 أمر إعطاء
  // ======================
  if (command === 'إعطاء') {
    const targetID = mentions && Object.keys(mentions)[0];
    const amount = parseInt(args[1]);

    if (!targetID || isNaN(amount)) {
      await api.sendMessage(
        '❗ الصيغة الصحيحة:\nإعطاء @الشخص المبلغ',
        threadID
      );
      return true;
    }

    if (amount <= 0) {
      await api.sendMessage('❌ المبلغ غير صالح.', threadID);
      return true;
    }

    if (db[senderID].cash < amount) {
      await api.sendMessage('❌ رصيدك غير كافٍ.', threadID);
      return true;
    }

    if (!db[targetID]) {
      db[targetID] = { cash: 0, bank: 0, lastWork: 0 };
    }

    db[senderID].cash -= amount;
    db[targetID].cash += amount;
    saveDB(db);

    await api.sendMessage(
      `🎁 تم تحويل ${amount} بنجاح.`,
      threadID
    );
    return true;
  }

  return false;
};
