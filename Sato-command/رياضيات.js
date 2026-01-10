// ================================
// 🎮 أمر رياضيات | Sato Bot
// ================================

const activeMath = {}; // لتتبع سؤال واحد لكل مجموعة

module.exports = async function mathCommand({ api, event, args, botData }) {
  const { threadID, senderID, body } = event;
  const PREFIX = botData.prefix || '.';

  // ========================
  // 1️⃣ تشغيل الأمر بالبادئة
  // ========================
  if (body.trim() === PREFIX + 'رياضيات') {
    // إذا كان هناك سؤال شغال
    if (activeMath[threadID]) {
      await api.sendMessage(
        '🧠 يوجد سؤال رياضيات قيد اللعب بالفعل، أجب عليه أولاً!',
        threadID
      );
      return true;
    }

    // توليد سؤال
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let answer;
    switch (op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '*': answer = a * b; break;
    }

    activeMath[threadID] = {
      answer,
      solved: false
    };

    await api.sendMessage(
      `🧮 سؤال رياضيات:\n\n${a} ${op} ${b} = ؟\n\n⏱️ لديك دقيقة واحدة للإجابة`,
      threadID
    );

    // ⏱️ مهلة دقيقة
    setTimeout(async () => {
      if (activeMath[threadID] && !activeMath[threadID].solved) {
        await api.sendMessage(
          `⌛ انتهى الوقت!\n\n🤖 الجواب الصحيح هو: ${answer}\nواضح أن الرياضيات تحتاج إعادة نظر 😏`,
          threadID
        );
        delete activeMath[threadID];
      }
    }, 60 * 1000);

    return true;
  }

  // ========================
  // 2️⃣ استقبال الإجابة (بدون بادئة)
  // ========================
  if (activeMath[threadID] && !activeMath[threadID].solved) {
    // تجاهل الرسائل التي تبدأ بالبادئة
    if (body.startsWith(PREFIX)) return false;

    const userAnswer = parseInt(body.trim());
    if (isNaN(userAnswer)) return false;

    if (userAnswer === activeMath[threadID].answer) {
      activeMath[threadID].solved = true;

      await api.sendMessage(
        `✅ إجابة صحيحة!\n\n🎉 مبروك، أول إجابة صحيحة كانت لك.`,
        threadID
      );

      delete activeMath[threadID];
      return true;
    }
  }

  return false;
};
