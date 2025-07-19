'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	const db = uniCloud.database();
	const usersCollection = db.collection('users');
	const { avatar_change,userInfo } = event;
	
	// 先查询用户是否存在
	const { data } = await usersCollection.where({
		account_id: userInfo.account_id
	}).get();

	if (data.length === 0) {
		return { code: 1, msg: '用户不存在' };
	}

	// 如果是更新密码，则需要验证旧密码是否正确
	if(userInfo.newPassword)
	userInfo.newPassword = userInfo.newPassword.trim();
	if(userInfo.password)
	userInfo.password = userInfo.password.trim();
	if (userInfo.newPassword) {
		const password = userInfo.password;
		if (password !== data[0].password) {
			return { code: 2, msg: '旧密码错误' };
		}
	}
	
	if(avatar_change){
		let res=await uniCloud.deleteFile({
			fileList: [data[0].avatar]
		});
		console.log('delete_res',res)
	}

	// 准备更新数据
	const updateData = {
		username: userInfo.username || data[0].username,
		description: userInfo.description || data[0].description,
		avatar: userInfo.avatar || data[0].avatar,
	};
	
	// 如果有新密码则更新密码
	if (userInfo.newPassword) {
		updateData.password = userInfo.newPassword;
	}
	
	// 更新用户信息
	const result = await usersCollection.doc(data[0]._id).update(updateData);
	
	// 返回更新结果
	return {
		code: 0,
		msg: '更新成功',
		data: result
	};
};