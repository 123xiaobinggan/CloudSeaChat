'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	const db = uniCloud.database()
	const _ = db.command
	const { action, parent, item } = event;
	console.log('parent', parent);
	console.log('item', item);
	try{
		if(!('post_id' in item)){//item是reply
			const ComentRes = await db.collection('comment').where({
				_id: parent._id
			}).get()
			const comment = ComentRes.data[0];
			const updateReplies = comment.replies.filter(reply => reply._id !== item._id);
			console.log('updateReplies', updateReplies);
			const updateRes = await db.collection('comment').doc(parent._id).update({
				replies: updateReplies
			});

			await db.collection('user-log').where({
				actor_account_id: item.account_id,
				action_type: 'comment', // 操作类型，例如 'comment' 表示评论
				target_type: 'comment', // 目标类型，例如 'comment' 表示评论
				source_id: item._id, // 回复的评论ID
			}).remove();

			if(updateReplies.length > 0){
				const userIds = updateReplies.map(reply => reply.account_id);
				const userRes = await db.collection('users').where({
					account_id: _.in(userIds)
				}).get();
				const userMap = {};
				userRes.data.forEach(user => {
					userMap[user.account_id] = user;
				});
				updateReplies.forEach(reply => {
					reply.username = userMap[reply.account_id].username;
					reply.avatar = userMap[reply.account_id].avatar;
				});
			}
			return{
				code: 200,
				msg: 'success',
				data: {
					replies: updateReplies
				}
			}
		}
		else{//item是comment
			const delCommentRes = await db.collection('comment').doc(item._id).remove();
			const updatePostRes = await db.collection('post').doc(item.post_id).update({
				comment_count: _.inc(-1)
			});

			await db.collection('user-log').where({
				actor_account_id: item.account_id,
				action_type: 'comment', // 操作类型，例如 'comment' 表示评论
				target_type: 'comment', // 目标类型，例如 'comment' 表示评论
				source_id: item._id, // 回复的评论ID				source_id: item._id, // 回复的评论ID
			}).remove();

			if(delCommentRes.deleted === 0) {
				return {
					code: 404,
					msg: '评论未找到或已被删除'
				}
			}
			else {
				return {
					code: 200,
					msg:'success'
				}
			}
		}
	}catch (error) {
		console.error('删除评论回复失败:', error);
		return {
			code: 500,
			msg: '服务器错误，请稍后再试'
		}
	}
};
