module.exports = {
  name: "صفع",
  category: "social",

  async run({ message, mentions, senderID, api, threadID, send }) {

    let targetID = null;

    // 🔹 الرد له أولوية
    if (message.messageReply && message.messageReply.senderID) {
      targetID = message.messageReply.senderID;
    }
    // 🔹 ثم التاغ
    else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // ❌ لا رد ولا تاغ
    if (!targetID) {
      return send("🤨 تريد أن تصفع الفراغ؟ رد أو منشن الشخص أولاً.");
    }

    // ❌ منع صفع النفس
    if (targetID === senderID) {
      return send("😂 محاولة فاشلة… لا يمكنك صفع نفسك.");
    }

    // 🔹 جمل ساخرة عشوائية
    const reactions = [
      "💥 نتمنى أن لا تكون الصفعة قوية… لكن يبدو أنها كانت كذلك.",
      "😬 صفعة مفاجئة بدون سابق إنذار.",
      "😂 الجماعة شاهدة على ما حدث!",
      "😈 صفعة خفيفة… أو هكذا يقول الفاعل.",
      "🤕 أوتش! هذه ستُذكر طويلًا."
    ];

    const text =
`👋 قام شخص ما بصفع شخص آخر!
${reactions[Math.floor(Math.random() * reactions.length)]}`;

    await api.sendMessage(
      {
        body: text,
        mentions: [
          { tag: "الفاعل", id: senderID },
          { tag: "المفعول به", id: targetID }
        ]
      },
      threadID
    );
  }
};