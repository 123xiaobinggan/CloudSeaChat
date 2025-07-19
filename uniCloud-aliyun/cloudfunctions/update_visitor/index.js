'use strict';
function getBeijingDateString(date = new Date()) {
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().split('T')[0];
}

exports.main = async (event, context) => {
  const { account_id, visitor_account_id, visitor_ip } = event;

  const db = uniCloud.database();
  const _ = db.command;
  const visitorCollection = db.collection('visitors');
  const userCollection = db.collection('users');

  const now = new Date();
  const currentDateStr = getBeijingDateString(); // YYYY-MM-DD
  const isoTimestamp = now.toISOString();

  try {
    // 检查是否今天已经访问过
    const existing = await visitorCollection.where({
      account_id,
      visitor_account_id,
      create_date: currentDateStr
    }).get();

    if (existing.data.length > 0) {
      console.log('已访问，更新记录',existing.data[0])
      // 已访问，更新记录（只更新时间/IP）
      await visitorCollection.doc(existing.data[0]._id).update({
        visitor_ip,
        create_time: isoTimestamp
      });
    } 
    else {
      console.log('未访问，插入记录')
      // 未访问，插入记录
      await visitorCollection.add({
        account_id,
        visitor_account_id,
        visitor_ip,
        create_time: isoTimestamp,
        create_date: currentDateStr
      });

      // 用户表中访客计数 +1
      await userCollection.where({
        account_id: account_id
      }).update({
        visitor_count: _.inc(1)
      });

      return {
        code: 200,
        msg:'success',
        data: 1
      };
    }

    return {
      code: 200,
      msg: 'success',
      data: 0
    };
  } catch (e) {
    return {
      code: 500,
      msg: e.message || 'Server Error',
      data: 0
    };
  }
};
