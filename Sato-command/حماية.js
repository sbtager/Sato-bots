// ================================
// 🛡️ نظام حماية ساتو (ملف واحد)
// ================================

// تخزين إعدادات الحماية لكل مجموعة
const protections = {};
/*
protections[threadID] = {
  name: false,
  nick: false,
  admin: false,
  leave: false
}
*/

// دالة جلب / إنشاء إعدادات الحماية
function getProtection(threadID) {
  if (!protections[threadID]) {
    protections[threadID] = {
      name: false,
      nick: false,
      admin: false,
      leave: false
    };
  }
  return protections[threadID];
}

// ================================
// 📌 أمر .حماية
// ================================
async function protectionCommand({ api, event, body, PREFIX }) {
  const { threadID } = event;
  const pData = getProtection(threadID);

  if (body === PREFIX + 'حماية') {
    await api.sendMessage(
`🛡️ نظام الحماية

1️⃣ حماية اسم المجموعة : ${pData.name ? 'ON' : 'OFF'}
2️⃣ حماية الكنيات : ${pData.nick ? 'ON' : 'OFF'}
3️⃣ حماية الأدمن : ${pData.admin ? 'ON' : 'OFF'}
4️⃣ حماية المغادرة : ${pData.leave ? 'ON' : 'OFF'}

✍️ أرسل الرقم مع on / off
مثال:
1 on
4 off`,
      threadID
    );
    return true;
  }

  return false;
}

// ================================
// 📌 أوامر الحماية (بدون بادئة)
// ================================
async function protectionToggle({ api, event, body }) {
  const { threadID } = event;
  const pData = getProtection(threadID);

  const match = body.match(/^([1-4])\s+(on|off)$/i);
  if (!match) return false;

  const num = match[1];
  const state = match[2].toLowerCase() === 'on';

  if (num === '1') pData.name = state;
  if (num === '2') pData.nick = state;
  if (num === '3') pData.admin = state;
  if (num === '4') pData.leave = state;

  const names = {
    1: 'حماية اسم المجموعة',
    2: 'حماية الكنيات',
    3: 'حماية الأدمن',
    4: 'حماية المغادرة'
  };

  await api.sendMessage(
    `${state ? '✅' : '❌'} تم ${state ? 'تشغيل' : 'إيقاف'} ${names[num]}`,
    threadID
  );

  return true;
}

// ================================
// 📌 الأحداث (تغيير / مغادرة)
// ================================
async function protectionEvents({ api, event }) {
  const { threadID } = event;
  const pData = getProtection(threadID);

  // ── حماية اسم المجموعة
  if (event.logMessageType === 'log:thread-name' && pData.name) {
    const oldName = event.logMessageData.old_name;
    if (oldName) {
      api.setTitle(oldName, threadID);
      api.sendMessage(
        '⚠️ حدث تغيير في اسم المجموعة، قمت بإعادته',
        threadID
      );
    }
  }

  // ── حماية الكنيات
  if (event.logMessageType === 'log:user-nickname' && pData.nick) {
    const userID = event.logMessageData.participant_id;
    const oldNick = event.logMessageData.old_nickname || '';
    api.changeNickname(oldNick, threadID, userID);
    api.sendMessage(
      '⚠️ هناك من غير كنيته، لقد أعدتها',
      threadID
    );
  }

  // ── حماية الأدمن
  if (event.logMessageType === 'log:admin-removed' && pData.admin) {
    const targetID = event.logMessageData.target_id;
    api.changeAdminStatus(threadID, targetID, true);
    api.sendMessage(
      '😤 عيب تنزع شخص أفضل منك',
      threadID
    );
  }

  // ── حماية المغادرة (يعيد فقط من غادر)
  if (event.logMessageType === 'log:unsubscribe' && pData.leave) {
    const leftID = event.logMessageData.leftParticipantFbId;

    // إذا كان طرد → لا نعيد
    if (event.author === leftID) return;

    api.addUserToGroup(leftID, threadID, (err) => {
      if (err) {
        api.sendMessage(
          '🚫 هناك من غادر، تمت المحاولة لكن لا أملك صلاحية الإضافة',
          threadID
        );
      } else {
        api.sendMessage(
          '🔄 هناك من غادر، تمت الإعادة',
          threadID
        );
      }
    });
  }
}

// ================================
// 📦 التصدير
// ================================
module.exports = {
  protectionCommand,
  protectionToggle,
  protectionEvents
};
