'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database()
	const _ = db.command
	const { post_id, account_id } = event;

	try {
		// 获取帖子详情
		const postRes = await db.collection('post').doc(post_id).get()
		if (!postRes.data.length) {
			return { code: 404, msg: '帖子未找到或已被删除' }
		}
		const post = postRes.data[0]
		const mediaFiles = Array.isArray(post.media) ? post.media : []

		// 删除 media 文件（如果存在）
		if (mediaFiles.length > 0) {
			const fileIDs = mediaFiles.map(item => item.url).filter(Boolean)
			if (fileIDs.length) {
				await uniCloud.deleteFile({ fileList: fileIDs })
			}
		}

		// 并发执行：更新转发数、更新用户发帖数、删除评论和点赞
		const tasks = []

		// 更新源帖转发数（如果是转发帖）
		if (post.source_post?.post_id) {
			tasks.push(
				db.collection('post').doc(post.source_post.post_id).update({
					forward_count: _.gte(1) ? _.inc(-1) : 0
				})
			)
		}

		// 更新用户发帖数
		tasks.push(
			db.collection('users').where({
				account_id:account_id}).update({
				post_count: _.gte(1) ? _.inc(-1) : 0
			})
		)

		// 删除相关评论
		tasks.push(
			db.collection('comment').where({ post_id }).remove()
		)

		// 删除相关点赞记录
		tasks.push(
			db.collection('user-liked').where({ target_id: post_id }).remove()
		)

		await Promise.all(tasks)

		// 删除帖子
		const result = await db.collection('post').doc(post_id).remove()
		if (result.deleted === 1) {
			return { code: 200, msg: 'success' }
		} else {
			return { code: 404, msg: '帖子未找到或已被删除' }
		}

	} catch (error) {
		console.error('删除帖子失败:', {
			error: error.message || error,
			event
		})
		return {
			code: 500,
			msg: '服务器错误，请稍后再试'
		}
	}
};
