// ===================================
// 🎉 أمر فعالية | Sato Bot
// ===================================

const activities = {}; // فعالية واحدة لكل مجموعة

// أسئلة جاهزة
const QUESTIONS = {
  تفكيك: [
    { q: 'ساتو بوت أفضل بوت', a: 'س ا ت و ب و ت أ ف ض ل ب و ت' },
    { q: 'الذكاء الاصطناعي', a: 'ا ل ذ ك ا ء ا ل ا ص ط ن ا ع ي' }
  ],
  تركيب: [
    { q: 'س ا ت و د ا ئ م ا ف ي ا ل خ د م ة', a: 'ساتو دائما في الخدمة' },
    { q: 'ب و ت ق و ي', a: 'بوت قوي' }
  ],
  عامة: [
    { q: 'أين توجد مدينة البندقية؟', a: 'إيطاليا' },
    { q: 'ما هو أكبر كوكب؟', a: 'المشتري' }
  ],
  دينية: [
    { q: 'من هو خاتم النبيين؟', a: 'محمد' },
    { q: 'كم عدد أركان الإسلام؟', a: '5' }
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = async function activityCommand({ api, event, body, botData }) {
  const { threadID, senderID, messageReply } = event;
  const PREFIX = botData.prefix || '.';

  // ========================
  // تشغيل الأمر
  // ========================
  if (body.trim() === PREFIX + 'فعالية') {
    if (activities[threadID]) {
      await api.sendMessage('⚠️ توجد فعالية شغالة بالفعل.', threadID);
      return true;
    }

    activities[threadID] = {
      players: {}, // id => { name, points }
      started: false,
      currentAnswer: null
    };

    await api.sendMessage(
`✨فــــعــــالـــــيــــــة✨
━━━━━━━━━━━━━━━━━━
📩 المرجو الرد على هذه الرسالة بذكر الإسم
(الرد فقط – كل إسم خاص بصاحبه)
━━━━━━━━━━━━━━━━━━
⏳ تبدأ بعد اكتمال العدد`,
      threadID
    );
    return true;
  }

  const act = activities[threadID];
  if (!act) return false;

  // ========================
  // تسجيل الأسماء (قبل البدء)
  // ========================
  if (!act.started && messageReply) {
    if (act.players[senderID]) return true;

    const name = body.trim();
    if (!name) return true;

    act.players[senderID] = { name, points: 0 };

    await api.sendMessage(
      `✅ تم إضافة ${name}\n👥 العدد: ${Object.keys(act.players).length}`,
      threadID
    );

    const count = Object.keys(act.players).length;

    // بدء الفعالية
    if (count >= 3 && count <= 8) {
      act.started = true;
      startRound(api, threadID);
    }

    return true;
  }

  // ========================
  // استقبال الإجابة
  // ========================
  if (act.started && act.currentAnswer) {
    if (!act.players[senderID]) return false;
    if (body.startsWith(PREFIX)) return false;

    if (body.trim() === act.currentAnswer) {
      act.players[senderID].points += 1;
      act.currentAnswer = null;

      await api.sendMessage(
        `❤️ إجابة صحيحة!\n${act.players[senderID].name} حصل على نقطة`,
        threadID
      );

      // فحص الفوز
      if (act.players[senderID].points >= 7) {
        endActivity(api, threadID);
        return true;
      }

      setTimeout(() => startRound(api, threadID), 1500);
    }
  }

  return false;
};

// ========================
// 🌀 جولة جديدة
// ========================
async function startRound(api, threadID) {
  const act = activities[threadID];
  if (!act) return;

  const types = Object.keys(QUESTIONS);
  const type = pickRandom(types);
  const qa = pickRandom(QUESTIONS[type]);

  act.currentAnswer = qa.a;

  // عرض النقاط
  let list = '✨فــــعــــالـــــيــــــة✨\n━━━━━━━━━━━━━━━━━━\n';
  Object.values(act.players).forEach(p => {
    list += `❀- ${p.name} [${p.points}]\n`;
  });

  await api.sendMessage(
`${list}
━━━━━━━━━━━━━━━━━━
⏳ 3...
2...
1...

🎯 النوع: ${type}
❓ السؤال:
${qa.q}`,
    threadID
  );

  // مهلة
  setTimeout(async () => {
    if (act.currentAnswer) {
      await api.sendMessage(
        `⌛ لم يجب أحد!\n🤖 الجواب: ${qa.a}`,
        threadID
      );
      act.currentAnswer = null;
      startRound(api, threadID);
    }
  }, 60 * 1000);
}

// ========================
// 🏆 إنهاء الفعالية
// ========================
async function endActivity(api, threadID) {
  const act = activities[threadID];
  if (!act) return;

  const sorted = Object.values(act.players)
    .sort((a, b) => b.points - a.points);

  await api.sendMessage(
`🏅 الـــــفــــــــائـــــــــزون 🏅
━━━━━━━━━━━━━━━━━━
🥇 ${sorted[0]?.name || '—'}
🥈 ${sorted[1]?.name || '—'}
🥉 ${sorted[2]?.name || '—'}

🎉 انتهت الفعالية`,
    threadID
  );

  delete activities[threadID];
    }
