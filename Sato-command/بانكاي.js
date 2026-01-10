// ================================
// 🗡️ أمر بانكاي | Sato Bot
// ================================

module.exports = async function bankaiCommand({ api, event }) {
  const { threadID, senderID, messageReply, mentions } = event;

  // تحديد الهدف (رد أو منشن)
  let targetID = null;
  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  }

  if (!targetID) {
    await api.sendMessage('❓ من تريد طرده؟', threadID);
    return true;
  }

  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(a => a.id);
  const botID = api.getCurrentUserID();

  const senderIsAdmin = adminIDs.includes(senderID);
  const botIsAdmin = adminIDs.includes(botID);

  // 🔴 المرسل ليس أدمن
  if (!senderIsAdmin) {
    await api.sendMessage('هذا الأمر مخصص للرجال', threadID);
    return true;
  }

  // 🟡 المرسل أدمن لكن البوت ليس أدمن
  if (!botIsAdmin) {
    await api.sendMessage(
      'أحتاج صلاحيات… ولا أنا شينوبي ولا إيه؟ 😒',
      threadID
    );
    return true;
  }

  // 🟢 المرسل والبوت أدمن → طرد
  try {
    await api.removeUserFromGroup(targetID, threadID);
    await api.sendMessage('سلم لي على مادارا 😈👋', threadID);
  } catch (err) {
    await api.sendMessage('❌ لم أستطع تنفيذ البانكاي', threadID);
  }

  return true;
};
