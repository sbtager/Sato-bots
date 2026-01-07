module.exports = {
  name: "معلومات",
  category: "info",

  async run({ api, event, threadID, messageCounter }) {
    try {
      const targetID = event.messageReply
        ? event.messageReply.senderID
        : event.senderID;

      const userInfo = await api.getUserInfo(targetID);
      const user = userInfo[targetID];

      const name = user.name || "غير معروف";

      let gender = "غير معروف";
      if (user.gender === 1) gender = "أنثى 👩";
      if (user.gender === 2) gender = "ذكر 👨";

      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(a => a.id === targetID);
      const role = isAdmin ? "أدمن 🛡️" : "عضو 👤";

      const msgs = messageCounter?.[targetID] || 0;

      let status = "ميت 💀";
      if (msgs > 0 && msgs <= 10) status = "نشيط 😴";
      else if (msgs <= 30) status = "نشيط 😎";
      else if (msgs > 30) status = "نشيط إلى قليل الهيجان 🔥";

      const text = 
`👤 معلومات العضو

📛 الإسم : ${name}
⚧ الجنس : ${gender}
🏷 الدور : ${role}

📊 الحالة : ${status}
💬 عدد الرسائل اليوم : ${msgs}

━━━━━━━━━━━━━━━━━━`;

      api.sendMessage(text, threadID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ حدث خطأ أثناء جلب المعلومات.", threadID);
    }
  }
};