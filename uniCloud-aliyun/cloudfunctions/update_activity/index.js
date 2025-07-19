'use strict';
exports.main = async (event, context) => {
	
	const { account_id, level, activity } = event;
	const db = uniCloud.database();
	
	const res = await db.collection('users').where({ 
		account_id : account_id
	}).update({
		level,
		activity
	})

	if(res.updated == 0){
		return {
			code: 400,
			msg: '更新失败'
		}
	}

	return {
		code: 200,
		msg: '更新成功'
	}

};
