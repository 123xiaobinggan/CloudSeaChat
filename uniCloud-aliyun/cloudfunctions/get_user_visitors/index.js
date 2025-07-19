'use strict';

function getBeijingDateString(date = new Date()) {
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().split('T')[0];
}

exports.main = async (event, context) => {
  const { account_id, day_count, create_date } = event;

  const db = uniCloud.database();
  const dbCmd = db.command;
  const visitorsCollection = db.collection('visitors');

  // 判断 create_date 是否存在，作为基准日期
  const baseDate = create_date ? new Date(create_date) : new Date();

  // 生成最近 day_count 天的日期字符串数组（不包含 baseDate 本身）
  const dateList = [];
  for (let i = 0; i < day_count; i++) {
	const d = new Date(baseDate);
	d.setDate(baseDate.getDate() - (create_date ? i + 1 : i));
	dateList.push(getBeijingDateString(d));
  }
  console.log('dataList', dateList)

  try {
    const res = await visitorsCollection
	.aggregate()
	.match({
		account_id,
		create_date: dbCmd.in(dateList)
	})
	.lookup({
		from: 'users',
		localField: 'visitor_account_id',
		foreignField: 'account_id',
		as: 'visitorInfo'
	})
	.unwind({
		path: '$visitorInfo'
	})
	.sort({ create_time: -1 })
	.end();

	console.log('res', res)
    const records = res.data;

    // 分组
	const grouped = {};
	for (const record of records) {
		const date = record.create_date;
		if (!grouped[date]) grouped[date] = [];
		grouped[date].push({
			avatar: record.visitorInfo.avatar,
			username: record.visitorInfo.username,
			account_id: record.visitor_account_id,
			ip: record.visitor_ip,
			create_time: record.create_time
		});
	}
	
	console.log('grouped', grouped)

	// 构造输出：只返回有记录的日期（并按时间从近到远排列）
	const groupedArray = Object.keys(grouped)
	.sort((a, b) => new Date(b) - new Date(a)) // 日期降序
	.map(date => ({
		date,
		visitors: grouped[date]
	}));


    return {
      code: 200,
      msg: 'success',
      data: groupedArray
    };
  } catch (e) {
    console.error('获取访客失败:', e);
    return {
      code: 500,
      msg: e.message || 'server error'
    };
  }
};
