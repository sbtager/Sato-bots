// ================================
// 🗑️ أمر حذف رسالة البوت | Sato Bot
// ================================

module.exports = async function deleteBotMessage({ api, event }) {
  const { threadID, messageReply } = event;

  // يجب الرد على رسالة
  if (!messageReply) {
    await api.sendMessage(
      '❗ يرجى الرد على رسالة البوت التي تريد حذفها.',
      threadID
    );
    return true;
  }

  const botID = api.getCurrentUserID();

  // التأكد أن الرسالة هي رسالة البوت
  if (messageReply.senderID !== botID) {
    await api.sendMessage(
      '❌ لا يمكنني حذف إلا رسائلي فقط.',
      threadID
    );
    return true;
  }

  // حذف الرسالة
  try {
    await api.unsendMessage(messageReply.messageID);
  } catch (err) {
    await api.sendMessage(
      '⚠️ تعذّر حذف الرسالة.',
      threadID
    );
  }

  return true;
};
