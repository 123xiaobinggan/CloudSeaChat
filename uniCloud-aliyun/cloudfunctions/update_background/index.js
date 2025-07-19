'use strict';
exports.main = async (event, context) => {
	const { oldBackground , newBackground,account_id } = event;
	const db = uniCloud.database();
	const usersCollection = db.collection('users');
	const { data } = await usersCollection.where({ account_id }).field({ _id:1 }).get();
	if (data.length === 0) {
		return { code: 1, msg: '用户不存在' };
	}
	const updateData = { 
		background:newBackground 
	};
	const result = await usersCollection.doc(data[0]._id).update(updateData);
	const deleteRes = await uniCloud.deleteFile({
		fileList: [oldBackground]
	})
	console.log('删除结果',deleteRes);

	if(result.updated===0){
		return { code: 500, msg: '更新失败' };
	}
	
	console.log(result, 'result')
	return {
		code: 200,
		msg: '更新成功'
	}
};
