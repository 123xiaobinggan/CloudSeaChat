'use strict';
exports.main = async (event, context) => {
    const { post_id, account_id } = event;

    const db = uniCloud.database();
    const dbCmd = db.command;
    const postCollection = db.collection('post');
    const commentCollection = db.collection('comment');
    const likeCollection = db.collection('user-liked');
    const userCollection = db.collection('users');

    // 并发获取帖子与评论数据
    const [postRes, commentRes] = await Promise.all([
        postCollection.doc(post_id).get(),
        commentCollection.where({ post_id }).get()
    ]);

    const post = postRes.data[0];
    if (!post) return { code: 404, msg: '帖子不存在' };

    const comments = commentRes.data || [];
    post.comments = comments;

    // 预提取所有用户 ID（作者 + 评论人 + 回复人）
    const commentUserIds = new Set(comments.map(c => c.account_id));
    const replyUserIds = new Set(comments.flatMap(c => (c.replies || []).map(r => r.account_id)));
    const allUserIds = Array.from(new Set([post.account_id, ...commentUserIds, ...replyUserIds]));

    // 并发获取所有相关用户信息
    const usersRes = await userCollection.where({
        account_id: dbCmd.in(allUserIds)
    }).get();

    const userMap = Object.fromEntries(
        usersRes.data.map(u => [u.account_id, u])
    );

    // 给帖子补充用户信息
    const author = userMap[post.account_id] || {};
    post.username = author.username || '未知用户';
    post.avatar = author.avatar || '';

    // 处理评论与回复中的用户信息与排序
    post.comments = comments.map(comment => {
        const user = userMap[comment.account_id] || {};
        comment.username = user.username || '未知用户';
        comment.avatar = user.avatar || '';
        comment.replies = (comment.replies || []).map(reply => {
            const replyUser = userMap[reply.account_id] || {};
            return {
                ...reply,
                username: replyUser.username || '未知用户',
                avatar: replyUser.avatar || ''
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 回复时间降序
        return comment;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 评论时间降序

    // 如果登录，查询点赞信息
    if (account_id) {
        const targetIds = [
            post_id,
            ...post.comments.map(c => c._id),
            ...post.comments.flatMap(c => (c.replies || []).map(r => r._id))
        ];

        const likesRes = await likeCollection.where({
            target_id: dbCmd.in(targetIds),
            account_id,
            liked: true
        }).get();

        const likedSet = new Set(likesRes.data.map(i => i.target_id));

        post.liked = likedSet.has(post_id);

        post.comments.forEach(comment => {
            comment.liked = likedSet.has(comment._id);
            (comment.replies || []).forEach(reply => {
                reply.liked = likedSet.has(reply._id);
            });
        });
    }

    return {
        code: 200,
        msg: '获取帖子成功',
        data: post
    };
};
