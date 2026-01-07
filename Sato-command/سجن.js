module.exports = {
  name: "سجن",
  category: "social",

  async run({ message, mentions, senderID, api, threadID, send }) {

    let targetID = null;

    // 🔹 أولوية الرد
    if (message.messageReply && message.messageReply.senderID) {
      targetID = message.messageReply.senderID;
    }
    // 🔹 ثم المنشن
    else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // ❌ لا رد ولا منشن
    if (!targetID) {
      return send("🚓 من تريد سجنه؟ رد على رسالته أو قم بعمل منشن.");
    }

    // ❌ منع سجن النفس
    if (targetID === senderID) {
      return send("😂 محاولة فاشلة… لا يمكنك سجن نفسك.");
    }

    // 🔹 جمل ساخرة عشوائية
    const reasons = [
      "بسبب كثرة الإزعاج بدون سبب.",
      "لأن الجرائم الكلامية زادت عن الحد.",
      "بتهمة الإزعاج العام في المجموعة.",
      "لأسباب أمنية لا يمكن الإفصاح عنها.",
      "لأنه كان في المكان الخطأ في الوقت الخطأ."
    ];

    const durations = [
      "10 سنوات",
      "مؤبد (حتى إشعار آخر)",
      "24 ساعة",
      "مدى الحياة",
      "إلى أن يهدأ الوضع 😌"
    ];

    const text =
`🚨 تم تنفيذ الحكم!

👮‍♂️ السجّان: السجّان
⛓️ السجين: السجين
📄 التهمة: ${reasons[Math.floor(Math.random() * reasons.length)]}
⏳ مدة الحكم: ${durations[Math.floor(Math.random() * durations.length)]}

🔒 نتمنى له حسن السلوك داخل الزنزانة.`;

    await api.sendMessage(
      {
        body: text,
        mentions: [
          { tag: "السجّان", id: senderID },
          { tag: "السجين", id: targetID }
        ]
      },
      threadID
    );
  }
};