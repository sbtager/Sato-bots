// Sato-command/تشغيل.js

module.exports = {
  name: "تشغيل",
  aliases: ["تشغيل ساتو"],
  description: "تشغيل البوت",

  async execute({ api, event, config, state }) {
    const { threadID, senderID } = event;
    const { ADMIN_ID, BOT_NAME, PREFIX } = config;

    try {
      // التحقق من الصلاحية
      const allowAll = ADMIN_ID === "..";
      const isAdmin = senderID === ADMIN_ID;

      if (!allowAll && !isAdmin) {
        return api.sendMessage(
          "❌ هذا الأمر مخصص للمطور فقط",
          threadID
        );
      }

      // منع التشغيل المكرر
      if (state.started === true) {
        return api.sendMessage(
          "⚠️ البوت شغال بالفعل",
          threadID
        );
      }

      // تفعيل التشغيل
      state.started = true;

      // محاولة تغيير كنية البوت (بدون إيقاف الأمر إذا فشلت)
      try {
        const botID = api.getCurrentUserID();
        const nickname = `${BOT_NAME}(${PREFIX})`;

        await api.changeNickname(
          nickname,
          threadID,
          botID
        );
      } catch (nickErr) {
        console.warn("⚠️ فشل تغيير الكنية:", nickErr.message);
        // لا نوقف التشغيل
      }

      // رسالة التشغيل (كما اتفقنا حرفيًا)
      api.sendMessage(
`✅ تم التشغيل
إصدار القالب: 0.1
إسم البوت: ${BOT_NAME}

✳️ اكتب ${PREFIX}اوامر لرؤية الأوامر المتوفرة`,
        threadID
      );

    } catch (err) {
      console.error("❌ خطأ في أمر تشغيل:", err);
      api.sendMessage(
        "❌ حدث خطأ غير متوقع أثناء تشغيل البوت",
        threadID
      );
    }
  }
};