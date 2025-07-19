'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	const { post_id } = event;
	const db = uniCloud.database();
	const dbcmd = db.command;

	const res= await db.collection('comment').where({
		post_id:post_id
	}).get();
	// console.log('res.data',res.data);
	const userIds = [
		...new Set(res.data.map(comment => comment.account_id)),
		...new Set(res.data
		  .map(comment => comment.replies.map(reply => reply.account_id))
		  .flat()
		)
	];
	// console.log('userIds',userIds);
	const userMap = {};
	
	if(userIds.length > 0){
		try{
			const userData = await db.collection('users').where({
				account_id: dbcmd.in(userIds)
			}).get();
			// console.log('userData.data',userData.data);
			userData.data.forEach(item => {
				userMap[item.account_id] = item;
			})
			res.data.sort((a, b) => {
				return new Date(b.create_time) - new Date(a.create_time); // 按评论时间降序排序
			});// 按评论时间降序排序
			res.data.forEach(comment => {
				const user = userMap[comment.account_id];
				if(user){
					comment.username = user.username;
					comment.avatar = user.avatar;
				}
				comment.replies?.forEach(reply => {
					const replyuser = userMap[reply.account_id];
					// console.log('replyuser',replyuser);
					if(replyuser){
						reply.username = replyuser.username;
						reply.avatar = replyuser.avatar;
					}
				})
				comment.replies.sort((a, b) => {
					return new Date(b.create_time) - new Date(a.create_time); // 按回复时间降序排序
				})// 按回复时间降序排序
			})
		}catch(error){
			console.error('获取用户信息时发生错误:', error);
			return {
				msg: '获取评论失败',
				error: error.message
			};
		}
	}
	console.log('获取评论',res.data);
	return {
		msg:'success',
		data:res.data	
	}
};
