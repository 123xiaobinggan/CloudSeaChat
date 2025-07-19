'use strict';
exports.main = async (event, context) => {
	const { account_id } = event;
	const db = uniCloud.database();
	const userCollection = db.collection('users');

	try {
		const user = await userCollection.where({
			account_id
		}).get();
		console.log('user',user)
		if (user.data.length === 0) {
			return {code: 400, msg: '用户不存在'};
		} else {
			return {code: 200, msg: '用户存在', data: user.data[0]};
		}
	}catch (error) {
		return {code: 500, msg: '服务器错误'};
	}
};
