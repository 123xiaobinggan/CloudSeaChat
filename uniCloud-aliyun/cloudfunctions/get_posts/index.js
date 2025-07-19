'use strict';
exports.main = async (event, context) => {
  const { post_create_time, page_size, lt, account_id } = event;
  const db = uniCloud.database();
  const dbCmd = db.command;

  try {
    const postCollection = db.collection('post');
    const userCollection = db.collection('users');
    const likeCollection = db.collection('user-liked');

    // 构造 visibility 逻辑：所有人可见 或 自己的私密帖
    const visibilityCondition = dbCmd.or([
      { visibility: "所有人可见" },
      { visibility: "仅我可见", account_id }
    ]);

    let finalCondition;
    if (post_create_time) {
      const timeCondition = {
        create_time: lt
          ? dbCmd.lt(new Date(post_create_time))
          : dbCmd.gt(new Date(post_create_time))
      };
      finalCondition = dbCmd.and([visibilityCondition, timeCondition]);
    } else {
      finalCondition = visibilityCondition;
    }

    // 获取帖子数据
    const postRes = await postCollection
      .where(finalCondition)
      .orderBy('create_time', 'desc')
      .limit(page_size)
      .get();

    const posts = postRes.data || [];

    if (posts.length === 0) {
      return {
        code: 0,
        msg: '暂无更多帖子',
        data: { posts: [] }
      };
    }

    const postIds = posts.map(post => post._id);
    const userIds = [...new Set(posts.map(post => post.account_id))];

    // 获取用户信息
    const userMap = {};
    if (userIds.length > 0) {
      const userRes = await userCollection
        .where({ account_id: dbCmd.in(userIds) })
        .field({ account_id: true, username: true, avatar: true })
        .get();
      userRes.data.forEach(user => {
        userMap[user.account_id] = {
          username: user.username,
          avatar: user.avatar
        };
      });
    }

    // 获取点赞信息
    const likedSet = new Set();
    if (account_id && postIds.length > 0) {
      const likeRes = await likeCollection.where({
        account_id,
        target_id: dbCmd.in(postIds),
        liked: true
      }).field({ target_id: true }).get();
      likeRes.data.forEach(like => {
        likedSet.add(like.target_id);
      });
    }

    // 合并帖子 + 用户信息 + 点赞状态
    const mergedPosts = posts.map(post => ({
      ...post,
      username: userMap[post.account_id]?.username || '',
      avatar: userMap[post.account_id]?.avatar || '',
      liked: likedSet.has(post._id)
    }));

    return {
      code: 0,
      msg: '获取帖子成功',
      data: {
        posts: mergedPosts
      }
    };
  } catch (error) {
    console.error('获取帖子时发生错误:', error);
    return {
      code: 1,
      msg: '获取帖子失败',
      error: error.message
    };
  }
};
