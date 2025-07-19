'use strict';
function generateFakeObjectId() {
	const timestamp = Math.floor(Date.now() / 1000).toString(16); // 4字节时间戳
	const random = 'xxxxxxxxxxxxxxxx'.replace(/x/g, () =>
	  Math.floor(Math.random() * 16).toString(16)
	);
	return (timestamp + random).slice(0, 24); // 拼接并截断为24位
  }
  
exports.main = async (event, context) => {
	const { user, post, comment, reply, type, content } = event;
	const db = uniCloud.database();
	const dbCmd = db.command;
	
	//更新用户活跃度
	const userRes = await db.collection('users').where({ 
		account_id: user.account_id 
	}).get();
	const User = userRes.data[0];

	if (User) {
		let newActivity = User.activity + 10;
		let newLevel = User.level;

		if (newActivity >= 100) {
			newActivity = newActivity % 100;
			newLevel += 1;
		}

		await db.collection('users').doc(User._id).update({
			activity: newActivity,
			level: newLevel
		});
	}

	// 回复帖子(comment)
	if (type === 0) 
	{
		const commentData = {
			post_id: post._id,
			account_id: user.account_id,
			content: content,
			like_count: 0,
			liked: false,
			ip: user.ip,
			create_time: new Date().toISOString(),
			replies: []
		};
		console.log(commentData.create_time);
		const res = await db.collection('comment').add(commentData);
		const db_post= db.collection('post');//更新帖子评论数
		await db_post.doc(post._id).update({
			comment_count: dbCmd.inc(1)
		});

		//更新用户未读消息数
		await db.collection('users').where({ 
			account_id: post.account_id
		}).update({
			unread_messages: dbCmd.inc(1)
		});

		commentData._id=res.id;
		if(!user.username){
			const userRes = await db.collection('users').where({
				account_id: user.account_id
			}).get();
			if (userRes.data.length > 0) {
				commentData.username = userRes.data[0].username;
				commentData.avatar = userRes.data[0].avatar;
			}
		}
		else{
			commentData.username=user.username;
			commentData.avatar=user.avatar;
		}

		await db.collection('user-log').add({
				account_id: post.account_id,
				actor_account_id: user.account_id, // 操作人ID
				action_type: 'comment', // 操作类型，例如 'comment' 表示评论
				target_type: 'post', // 目标类型，例如 'post' 表示帖子
				source_id: post._id,
				parent_source_id: post._id,
				comment_id: commentData._id,
				content:content,
				create_time: commentData.create_time,
				create_date: commentData.create_time.split('T')[0],
				ip: user.ip,
				read: false
		})

		return {
			msg: 'success',
			data: commentData
		};
	}

	// 回复评论或回复（type === 1）
	else  if(type > 0)
	{
		const replyData = {
			_id: generateFakeObjectId(), // 生成假的ObjectId
			account_id: user.account_id,
			content: content,
			like_count: 0,
			liked: false,
			ip: user.ip,
			create_time: new Date().toISOString(),
		};

		let account_id = comment.account_id || '';
		let source_id = comment._id || '';
		
		// 如果是回复某条回复，需要带上reply_username, reply_account_id
		if (reply) {
			account_id = reply.account_id;
			source_id = reply._id;
			replyData.reply_account_id = reply.account_id;
			replyData.reply_username=reply.username;
		}
		await db.collection('comment').doc(comment._id).update({
			replies: dbCmd.push(replyData)
		});
		replyData.username = user.username;
		replyData.avatar = user.avatar;

		await db.collection('user-log').add({
				account_id: account_id,
				actor_account_id: user.account_id,
				action_type: 'comment', // 操作类型，例如 'comment' 表示评论
				target_type: 'comment', // 目标类型，例如 'comment' 表示评论
				source_id: source_id, 	// 回复的评论ID
				parent_source_id: comment._id,
				comment_id: comment._id,
				content: content,
				create_time: replyData.create_time,
				create_date: replyData.create_time.split('T')[0],
				ip: user.ip,
				read: false
		})

		// 更新用户未读消息数
		await db.collection('users').where({
			account_id: account_id
		}).update({
			unread_messages: dbCmd.inc(1)
		});

		return {
			msg: 'success',
			data: replyData
		};
	}

	return {
		msg: 'invalid type',
		code: 400
	};
};
