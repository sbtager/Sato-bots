// ================================
// 💋 أمر تقبيل | Sato Bot
// ================================

module.exports = async function kissCommand({ api, event }) {
  const { threadID, senderID, messageReply, mentions } = event;

  // تحديد الهدف (رد أو منشن)
  let targetID = null;
  let targetName = null;

  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
    targetName = mentions[targetID];
  }

  // لا يوجد هدف
  if (!targetID) {
    await api.sendMessage('❓ من تريد تقبيله؟ (رد أو تاغ)', threadID);
    return true;
  }

  // لا يمكن تقبيل النفس
  if (targetID === senderID) {
    await api.sendMessage('😐 لا يمكنك تقبيل نفسك… حاول مجددًا.', threadID);
    return true;
  }

  try {
    // جلب أسماء الطرفين
    const users = await api.getUserInfo([senderID, targetID]);
    const senderName = users[senderID]?.name || 'أحدهم';
    const tName = users[targetID]?.name || targetName || 'شخص ما';

    // رسالة مع تاغ واضح
    await api.sendMessage(
      {
        body: ` قام ${senderName} بتقبيل ${tName}… يا للّطافة!`,
        mentions: [
          { tag: senderName, id: senderID },
          { tag: tName, id: targetID }
        ]
      },
      threadID
    );
  } catch (err) {
    await api.sendMessage('❌ حدث خطأ أثناء تنفيذ أمر التقبيل.', threadID);
  }

  return true;
};
