// ================================
// ➕ أمر إضافة | Sato Bot
// ================================

module.exports = async function addCommand({ api, event, args }) {
  const { threadID, senderID } = event;

  // التحقق من وجود الأيدي
  if (!args[0]) {
    await api.sendMessage(
      '❓ يرجى استعمال الأمر على النحو التالي:\n.إضافة 1000123456789',
      threadID
    );
    return true;
  }

  // تنظيف الأيدي
  const targetID = args[0].replace('id:', '').trim();

  // التحقق من صحة الأيدي
  if (!/^\d+$/.test(targetID)) {
    await api.sendMessage(
      '❌ الأيدي المُدخل غير صالح. يرجى إدخال أيدي رقمي صحيح.',
      threadID
    );
    return true;
  }

  // جلب معلومات المجموعة
  let threadInfo;
  try {
    threadInfo = await api.getThreadInfo(threadID);
  } catch (err) {
    await api.sendMessage(
      '❌ تعذّر جلب معلومات المجموعة.',
      threadID
    );
    return true;
  }

  const adminIDs = threadInfo.adminIDs.map(a => a.id);
  const botID = api.getCurrentUserID();

  const senderIsAdmin = adminIDs.includes(senderID);
  const botIsAdmin = adminIDs.includes(botID);

  // المستخدم ليس مشرفًا
  if (!senderIsAdmin) {
    await api.sendMessage(
      '⛔ هذا الأمر مخصص للمشرفين فقط.',
      threadID
    );
    return true;
  }

  // البوت ليس مشرفًا
  if (!botIsAdmin) {
    await api.sendMessage(
      '⚠️ أحتاج إلى صلاحيات المشرف لإتمام عملية الإضافة.',
      threadID
    );
    return true;
  }

  // تنفيذ الإضافة
  try {
    await api.addUserToGroup(targetID, threadID);
    await api.sendMessage(
      `✅ تمّت إضافة العضو بنجاح.\n🆔 الأيدي: ${targetID}`,
      threadID
    );
  } catch (err) {
    await api.sendMessage(
      '❌ تعذّرت إضافة العضو. قد تكون إعدادات الخصوصية تمنع ذلك.',
      threadID
    );
  }

  return true;
};
