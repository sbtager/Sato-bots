module.exports = {
  name: "زوجني",
  category: "social",

  async run({ senderID, mentions, threadInfo, send, userGender }) {

    const participants = threadInfo.participantIDs.filter(id => id !== senderID);
    if (participants.length === 0) {
      return send("🤨 لا يوجد أحد هنا لأتزوجه بك.");
    }

    // 🔹 تحديد الشخص المختار
    let targetID;
    const mentioned = Object.keys(mentions || {});

    if (mentioned.length > 0) {
      targetID = mentioned[0];
    } else {
      // اختيار عشوائي
      targetID = participants[Math.floor(Math.random() * participants.length)];
    }

    // 🔹 تحديد الجنس
    const senderGender = userGender(senderID);     // male | female | null
    const targetGender = userGender(targetID);     // male | female | null

    // 🔹 إذا فشل التعرف على الجنس → اختيار عشوائي
    let finalSenderGender = senderGender;
    let finalTargetGender = targetGender;

    if (!finalSenderGender || !finalTargetGender) {
      const random = Math.random() < 0.5;
      finalSenderGender = random ? "male" : "female";
      finalTargetGender = random ? "female" : "male";
    }

    // 🔹 رفض نفس الجنس
    if (finalSenderGender === finalTargetGender) {
      const jokes = [
        "😂 حاولنا… لكن الزواج من نفس الجنس هنا مرفوض.",
        "🤡 لا يا صديقي، هذا ليس Tinder.",
        "😅 فكرة جريئة، لكنها لن تمر."
      ];
      return send(jokes[Math.floor(Math.random() * jokes.length)]);
    }

    // 🔹 تحديد الأدوار
    const الزوج = finalSenderGender === "male" ? senderID : targetID;
    const الزوجة = finalSenderGender === "female" ? senderID : targetID;

    // 🔹 الرد النهائي
    const replies = [
      `💍 تم الزواج بنجاح!\n🤵 الزوج: @${الزوج}\n👰 الزوجة: @${الزوجة}`,
      `🎉 ألف مبروك!\n💑 @${الزوج} × @${الزوجة}`,
      `😎 زواج تم بدون مشاكل!\n❤️ @${الزوج} مع @${الزوجة}`
    ];

    await send(
      replies[Math.floor(Math.random() * replies.length)],
      [الزوج, الزوجة]
    );
  }
};