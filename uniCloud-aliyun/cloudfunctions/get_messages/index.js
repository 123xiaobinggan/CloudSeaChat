'use strict';

function getBeijingDateString(date = new Date()) {
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().split('T')[0];
}

exports.main = async (event, context) => {
  const { account_id, type, create_date, day_count } = event;

  const db = uniCloud.database();
  const dbCmd = db.command;

  const userLogCol = db.collection('user-log');
  const userCol = db.collection('users');
  const postCol = db.collection('post');
  const commentCol = db.collection('comment');

  try {
    const baseDate = create_date ? new Date(create_date) : new Date();
    const dateList = [];
    for (let i = 0; i < day_count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - (create_date ? i + 1 : i));
      dateList.push(getBeijingDateString(d));
    }

    const query = userLogCol.where({
      account_id,
      create_date: dbCmd.in(dateList),
      action_type: type,
      actor_account_id: dbCmd.neq(account_id)
    });

    const logRes = await query.orderBy('create_time', 'desc').limit(200).get();
    const logs = logRes.data;
    if (logs.length === 0) {
      console.log('no_data')
      return { code: 200, data: [] };
    }

    console.log('logs',logs);

    const postIds = logs.filter(log => log.target_type === 'post').map(log => log.source_id);
    const commentIds = logs
      .filter(log => log.target_type === 'comment')
      .map(log => log.parent_source_id);
    
    
    // console.log('postIds',postIds);

    const [postRes, commentRes] = await Promise.all([
      postCol.where({ _id: dbCmd.in(postIds) }).get(),
      commentCol.where({ _id: dbCmd.in(commentIds) }).get()
    ]);

    // console.log('postRes',postRes)

    const actorIds = [...new Set(logs.map(log => log.actor_account_id))];
    const postAuthorIds = [...new Set(postRes.data.map(post => post.account_id))];
    const receiverIds = logs.map(log => log.account_id);
    const allUserIds = [...new Set([...actorIds, ...postAuthorIds, ...receiverIds])];

    const allUserRes = await userCol.where({ account_id: dbCmd.in(allUserIds) }).get();


    const postMap = Object.fromEntries(postRes.data.map(p => [p._id, p]));
    const commentMap = Object.fromEntries(commentRes.data.map(c => [c._id, c]));
    const allUserMap = Object.fromEntries(allUserRes.data.map(u => [u.account_id, u]));

    const enrichedLogs = logs.map(log => {
      const actor = allUserMap[log.actor_account_id] || {};
      const msg = {
        _id: log._id,
        account_id: log.account_id,
        actor_account_id: log.actor_account_id,
        actor_avatar: actor.avatar || '/static/info/头像.png',
        actor_username: actor.username || '未知用户',
        source_post: null,
        source_comment: null,
        source_id: log.source_id,
        parent_source_id: log.parent_source_id,
        comment_id: log.comment_id,
        action_type: log.action_type,
        target_type: log.target_type,
        create_time: log.create_time,
        ip: log.ip || '',
        content: log.content || '',
        read: log.read || false,
        create_date: log.create_date,
        showInput: false,
      };

      if (log.target_type === 'post') {
        const post = postMap[log.source_id] || null;
        console.log('post',postMap,post)
        if (post) {
          const postAuthor = allUserMap[post.account_id] || {};
          msg.source_post = {
            ...post,
            avatar: postAuthor.avatar || '/static/info/头像.png',
            username: postAuthor.username || '未知用户',
            admin: postAuthor.admin || false
          };
        } 
      }

	    else if (log.target_type === 'comment') {
        const parent = commentMap[log.parent_source_id] || null;
        console.log('parent',parent,log.source_id)
        
        if (parent && (log.action_type=='comment' || log.action_type=='like') ) {
          if(log.source_id === parent._id){
            msg.source_comment = parent;
          }
          else{
			      msg.source_comment = parent.replies.find(reply => reply._id===log.source_id);
          }
          if (msg.source_comment) {
            const receiverUser = allUserMap[log.account_id];
            msg.source_comment.username = receiverUser ? (receiverUser.username || '未知') : '未知';
            msg.source_comment.admin = receiverUser? (receiverUser.admin || false) : false;
          }
        } 
        // console.log('msg.source_comment',msg.source_comment)
      }

      return msg;
    });

    const grouped = {};
    for (const msg of enrichedLogs) {
      if (!grouped[msg.create_date]) {
        grouped[msg.create_date] = [];
      }
      grouped[msg.create_date].push(msg);
    }

    const resultData = Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        create_date: date,
        messages: grouped[date]
      }));

    console.log('resultData',resultData);
    
    return {
      code: 200,
      data: resultData
    };
  } catch (e) {
    console.error('get_messages error:', e);
    return {
      code: 500,
      msg: '服务器错误',
      error: e
    };
  }
};