'use strict';
exports.main = async (event, context) => {
	
	const { account_id, amount } = event;

	const db = uniCloud.database();
	
	try {
		const res = await db.collection('users').where({
			account_id: account_id
		}).update({
			balance: db.command.inc(amount)
		});
		if(res.updated !== 0) {
			return {
				code: 200,
				msg: '充值成功'
			}
		}
		return {
			code: 1,
			msg: '充值失败'
		}
	}catch(e) {
		console.log(e);
	}
	return {
		code: 1,
		msg: '充值失败'
	}
};
