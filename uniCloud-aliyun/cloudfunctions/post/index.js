'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	const db = uniCloud.database()
	const _ = db.command
	const { 
		user,
		content, 
		media, 
		post_type, 
		temp_source_post,
		visibility,
		create_time,
		ip,
		tags,
		status
	} = event;

	if(!user.account_id){
		return {
			code: 401,
			msg: '用户未登录'
		}
	}
	let source_post = {}
	if(temp_source_post){
		source_post = {
			post_id: temp_source_post._id || '',
			account_id: temp_source_post.account_id || '',
			username: temp_source_post.username || '',
			avatar: temp_source_post.avatar || '',
			content: temp_source_post.content || '',
			media: temp_source_post.media || [],
			post_type: temp_source_post.post_type || '',
			ip: temp_source_post.ip || '',
			create_time: temp_source_post.create_time || ''
		}
	}
	const device_model = [
		context.deviceBrand || '',
		context.deviceModel || ''
	].filter(Boolean).join(' ') || '未知设备'

	const data={
		account_id: user.account_id,
		content: content,
		media: media,
		post_type: post_type,
		source_post: source_post,
		like_count: 0,
		comment_count: 0,
		forward_count: 0,
		visibility: visibility,
		create_time: create_time,
		ip: ip,
		device_model: device_model,
		tags: tags,
		status: status
	}
	try{
		const addRes = await db.collection('post').add(data)

		// 并发处理：更新源贴和用户数据
		const updateTasks = []

		if (source_post.post_id) {
			updateTasks.push(
				db.collection('post').doc(source_post.post_id).update({
					forward_count: _.inc(1)
				})
			)
			updateTasks.push(
				db.collection('user-log').add({
					account_id: source_post.account_id,
					actor_account_id: user.account_id,
					action_type: 'share',
					target_type: 'post',
					source_id: source_post.post_id,
					content: content,
					create_time: create_time,
					create_date: create_time.split('T')[0],
					ip: ip,
					read: false
				})
			)
			updateTasks.push(
				db.collection('users').where({
					account_id: source_post.account_id
				}).update({
					unread_messages: _.inc(1)
				})
			)
		}

		updateTasks.push(
			db.collection('users').where({ 
				account_id: user.account_id 
			}).update({
				post_count: _.inc(1)
			})
		)
		const userRes = await db.collection('users').where({ 
			account_id: user.account_id
		}).get();
		const User = userRes.data[0];

		if (User) {
			let add = 20;
			let newActivity = User.activity + add;
			let newLevel = User.level;

			if (newActivity >= 100) {
				newActivity = newActivity % 100;
				newLevel += 1;
			}

			updateTasks.push(
				db.collection('users').doc(User._id).update({
					activity: newActivity,
					level: newLevel
				})
			);
		}

		await Promise.all(updateTasks)

		return {
			code: 200,
			msg: 'success',
			data:{
				_id: addRes.id,
				account_id: user.account_id,
				username: user.username,
				avatar: user.avatar,
				content: content,
				media: media,
				post_type: post_type,
				source_post: source_post,
				like_count: 0,
				liked: false,
				comment_count: 0,
				forward_count: 0,
				visibility: visibility,
				create_time: create_time,
				ip: ip,
				device_model: device_model,
				tags: tags,
				status: status,
				showComments: false,
				comments: ''
				}
			}
	}catch(e){
		console.log('发布失败',e)
		return {
			code: 500,
			msg: '发布失败'	
		}
	}
};
