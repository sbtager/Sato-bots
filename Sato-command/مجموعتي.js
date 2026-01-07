module.exports = {
  name: "مجموعتي",
  category: "info",

  async run({ api, event, threadID, threadMessageCounter, totalThreadMessages }) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);

      const groupName = threadInfo.threadName || "بدون اسم";
      const membersCount = threadInfo.participantIDs.length;
      const adminCount = threadInfo.adminIDs.length;

      const todayMsgs = threadMessageCounter?.[threadID] || 0;
      const totalMsgs = totalThreadMessages?.[threadID] || 0;

      const text =
`👥 معلومات المجموعة

📛 الإسم : ${groupName}
👤 عدد الأعضاء : ${membersCount}
🛡️ عدد الأدمن : ${adminCount}

💬 رسائل اليوم : ${todayMsgs}
📊 إجمالي الرسائل : ${totalMsgs}

━━━━━━━━━━━━━━━━━━`;

      api.sendMessage(text, threadID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ حدث خطأ أثناء جلب معلومات المجموعة.", threadID);
    }
  }
};