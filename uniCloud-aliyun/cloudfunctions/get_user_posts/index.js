'use strict';
exports.main = async (event, context) => {
	const { account_id, page_size, create_time, visitor_account_id } = event;
	const db = uniCloud.database();
	const dbCmd = db.command;
	const postCollection = db.collection('post');
	const likeCollection = db.collection('user-liked');

	try {
		// 构建查询条件：account_id + create_time（分页）
		const postWhere = {
			account_id
		};
		if (create_time) {
			postWhere.create_time = dbCmd.lt(new Date(create_time));
		}

		// 查询帖子列表（已使用联合索引 account_id + create_time）
		const postRes = await postCollection
			.where(postWhere)
			.orderBy('create_time', 'desc') // 必须与索引顺序一致
			.limit(page_size)
			.get();

		const posts = postRes.data || [];

		// 查询访客是否点赞过这些帖子
		if (visitor_account_id && posts.length > 0) {
			const postIds = posts.map(post => post._id);

			const likeRes = await likeCollection.where({
				account_id: visitor_account_id,
				target_id: dbCmd.in(postIds),
				liked: true
			}).get();

			// 用 Set 优化判断效率
			const likedSet = new Set(likeRes.data.map(like => like.target_id));

			posts.forEach(post => {
				post.liked = likedSet.has(post._id);
			});
		}

		return {
			code: 200,
			msg: '查询成功',
			data: posts
		};
	} catch (e) {
		console.error('查询帖子时出错:', e);
		return {
			code: 500,
			msg: '查询失败',
			data: null
		};
	}
};
