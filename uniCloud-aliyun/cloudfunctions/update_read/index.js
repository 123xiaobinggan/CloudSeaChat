'use strict';
exports.main = async (event, context) => {
  const { messages } = event;
  const db = uniCloud.database();
  const dbCmd = db.command;
  const user_logCollection = db.collection('user-log');

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      code: 400,
      msg: '参数错误:messages 应为非空数组'
    };
  }

  const ids = messages
    .filter(msg => msg._id)
    .map(msg => msg._id);

  if (ids.length === 0) {
    return {
      code: 400,
      msg: '无有效 _id'
    };
  }

  const res = await user_logCollection.where({
    _id: dbCmd.in(ids)
  }).update({
    read: true
  });

  await db.collection('users').where({
    account_id: dbCmd.in(messages.map(msg => msg.account_id))
  }).update({
    unread_messages: dbCmd.inc(-res.updated)
  });

  return {
    code: 200,
    msg: `更新成功：${res.updated} 条`,
    updated: res.updated
  };
};
