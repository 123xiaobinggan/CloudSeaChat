'use strict';
exports.main = async (event, context) => {
    const { target_id, post,comment, reply, account_id, type, ip } = event;
    const db = uniCloud.database();

    if (!account_id) {
      return {
        code: 401,
        msg: '请登录'
      };
    }

    let first = false;

    // 查找当前用户是否已点赞该目标
    const { data } = await db.collection('user-liked').where({
      account_id,
      target_id,
    }).get();

    let returnData = 0;

    if (data.length > 0) {
      // 已点过赞 → 更新记录
      const currentLiked = data[0].liked;
      const newLiked = !currentLiked;
      returnData = newLiked ? 1 : -1;

      await db.collection('user-liked').doc(data[0]._id).update({
        liked: newLiked,
        create_time: new Date() // 更新点赞时间
      });
    } 
    else {
      // 没点过赞 → 新增记录
      first = true;
      await db.collection('user-liked').add({
        account_id,
        target_id,
        liked: true,
        create_time: new Date() // 新增点赞时间
      });
      returnData = 1;

      //更新用户活跃度
      const userRes = await db.collection('users').where({ account_id }).get();
      const user = userRes.data[0];

      if (user) {
        let newActivity = user.activity + 5;
        let newLevel = user.level;

        if (newActivity >= 100) {
          newActivity = newActivity % 100;
          newLevel += 1;
        }

        await db.collection('users').doc(user._id).update({
          activity: newActivity,
          level: newLevel
        });
      }
    }

    // 更新目标的点赞数量
    let postUpdateResult = null;
    if(type==0){//post点赞

      postUpdateResult = await db.collection('post').doc(target_id).update({
        like_count: db.command.inc(returnData) // 增加或减少点赞数
      });
      
      if(returnData == 1){
        await db.collection('user-log').add(
          {
            account_id: post.account_id,
            actor_account_id: account_id,
            action_type: 'like',
            target_type: 'post',
            source_id: target_id,
            parent_source_id: target_id,
            create_time: new Date().toISOString(),
            create_date: new Date().toISOString().split('T')[0],
            ip: ip,
            read: false
          }
        )
        await db.collection('users').where({
          account_id: post.account_id,
        }).update({
          unread_messages: db.command.inc(1)
        })
      }
      else{
        await db.collection('user-log').where({
          account_id: post.account_id,
          actor_account_id: account_id,
          action_type: 'like',
          target_type: 'post',
          source_id: target_id,
          parent_source_id: target_id
        }).remove();
        await db.collection('users').where({
          account_id: post.account_id,
        }).update({
          unread_messages: db.command.inc(-1)
        })
      }

    }
    else if(type==1){//comment点赞
      postUpdateResult = await db.collection('comment').doc(target_id).update({
        like_count: db.command.inc(returnData) // 增加或减少点赞数
      }); 

      if(returnData == 1){
        await db.collection('user-log').add(
          {
            account_id: comment.account_id,
            actor_account_id: account_id,
            action_type: 'like',
            target_type: 'comment',
            source_id: target_id,
            parent_source_id: target_id,
            create_time: new Date().toISOString(),
            create_date: new Date().toISOString().split('T')[0],
            ip: ip,
            read: false
          }
        )
        await db.collection('users').where({
          account_id: comment.account_id,
        }).update({
          unread_messages: db.command.inc(1)
        })
      }
      else{
        await db.collection('user-log').where({
          account_id: comment.account_id,
          actor_account_id: account_id,
          action_type: 'like',
          target_type: 'comment',
          source_id: target_id
        }).remove();
        await db.collection('users').where({
          account_id: comment.account_id,
        }).update({
          unread_messages: db.command.inc(-1)
        })
      }

    }
    else if(type==2){//reply点赞
      const commentDoc = await db.collection('comment').doc(comment._id).get();
      let replies = commentDoc.data[0].replies;
      let replyIndex = replies.findIndex(r => r._id === reply._id);
      replies[replyIndex].like_count += returnData;
      postUpdateResult = await db.collection('comment').doc(comment._id).update({
          replies: replies
      });

      if(returnData == 1){
        await db.collection('user-log').add({
            account_id: reply.account_id,
            actor_account_id: account_id,
            action_type: 'like',
            target_type: 'comment',
            source_id: target_id,
            parent_source_id: comment._id,
            create_time: new Date().toISOString(),
            create_date: new Date().toISOString().split('T')[0],
            ip: ip,
            read: false
        })
        await db.collection('users').where({
          account_id: reply.account_id,
        }).update({
          unread_messages: db.command.inc(1)    
        })
        
      }
      else{
        await db.collection('user-log').where({
          account_id: reply.account_id,
          actor_account_id: account_id,
          action_type: 'like',
          target_type: 'comment',
          source_id: target_id,
          parent_source_id: comment._id
        }).remove();
        await db.collection('users').where({
          account_id: reply.account_id,
        }).update({
          unread_messages: db.command.inc(-1)
        })
      }

    }
    
    if (postUpdateResult.updated === 0) {
      return {
        code: 500,
        msg: '更新点赞数量失败'
      };
    }

    return {
      code: 0,
      msg: 'success',
      data: returnData, // 1 表示点赞成功，-1 表示取消点赞
      first: first
    };
};
