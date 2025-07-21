<template>
    <view class="home-page">
        <view class="post" v-if="!isLoading">
            <view v-if="!no_post">
                <view class="post-header">
                    <image :src="post.avatar" class="avatar" mode="aspectFill" />
                    <view class="user-info">
                      <text class="username">{{ post.username }}</text>
                      <br/>
                      <text class="meta">{{ formatDate(post.create_time) }} · {{ post.ip }}</text>
                    </view>
                    <view v-if="post.account_id == user.account_id || user.admin" class="post-actions">
                      <image src="/static/index/rubbish.png" class="action-icon" @tap="()=>confirmDeletePost(post)" />
                    </view>
                </view>

                <view class="post-content">
                    <text>{{ post.content }}</text>
                    <view v-if="post.media?.length > 1">
                        <view
                        v-if="Array.isArray(post.media) && post.media.length"
                        :class="['media-grid', 'media-count-' + post.media.length]"
                        >
                        <view
                            v-for="(media, mediaIndex) in post.media"
                            :key="mediaIndex"
                            class="media-item"
                            @tap="()=>previewMedia(post.media, mediaIndex)"
                        >
                            <image v-if="media.type === 'image'" :src="media.url" class="post-media" mode="aspectFill" />
                            <video v-else-if="media.type === 'video'" :src="media.url" class="post-media" controls />
                        </view>
                        </view>
                    </view>
                    <view v-else-if="post.media?.length === 1">
                        <view class="one-media-item" @tap="()=>previewMedia(post.media, 0)">
                        <image v-if="post.media[0].type === 'image'" :src="post.media[0].url" class="post-one-media" mode="widthFix" />
                        <video v-else-if="post.media[0].type === 'video'" 
                            :src="post.media[0].url"  
                            :autoplay="false" 
                            controls 
                        />
                        </view>
                    </view>
                </view>
                
                <view class="post-actions">
                    <view class="action like-action" @tap="()=>like(post,post,null,null,0)">
                    <image 
                    :src="post.liked ? '/static/index/liked.png' : '/static/index/like.png'" 
                    class="action-icon" 
                    :class="{ 'like-heart-animated': post.liked }" />

                    <text>{{ post.like_count }}</text>
                    </view>
                    <view class="action">
                    <image src="/static/index/comment.png" class="action-icon" />
                    <text>{{ post.comment_count || 0 }}</text>
                    </view>
                    <view class="action" @tap="()=>to_post(post,1)">
                    <image src="/static/index/forward.png" class="action-icon" />
                    <text>{{ post.forward_count || 0 }}</text>
                    </view>
                </view>

                <!-- 帖子评论 -->
                <view v-if="post.showComments" class="comments">
                    <view v-for="(comment,commentIndex) in post.comments" :key="comment._id" class="comment" @longpress.stop="handleLongPressComment_Reply(postIndex,commentIndex,null,post,comment)">
                    <image :src="comment.avatar" class="comment-avatar" mode="aspectFill" @tap="to_personal_info(comment)" />
                    <view class="comment-content">
                        <view class="comment-header">
                        <view class="comment-info">
                            <text class="comment-user">{{ comment.username }}</text>
                            <text class="comment-meta">{{ formatDate(comment.create_time) }} · {{ comment.ip }}</text>
                        </view>

                        <view class="comment-actions">
                            <view class="like-action" @tap.stop="()=>like(comment,post,comment,null,1)">
                              <image :src="comment.liked ? '/static/index/liked.png' : '/static/index/like.png'" class="action-icon" />
                              <text>{{ comment.like_count }}</text>
                            </view>
                        </view>
                        </view>
                        <text class="comment-text">{{ comment.content }}</text>

                        <view class="reply-action" @tap.stop="()=>toggleReplyInput(comment)">
                            <text style="color:grey ">回复</text>
                        </view>

                        <!-- 回复comment-->
                        <view v-if="comment.showReplyInput" class="reply-input-wrapper">
                        <input
                            v-model="newReply"
                            class="reply-input"
                            :placeholder="'回复'+ comment.username + '...' "
                        />
                        <button class="reply-button" @tap="()=>submitComment(post,comment,null,1,newReply)">回复</button>
                        </view>

                        <!-- 展示回复 -->
                        <view v-if="comment.replies?.length && !comment.showReply"  class="showReply" @tap.stop="comment.showReply = true">
                        <text>{{ comment.replies.length }}条回复</text>  
                        </view>

                        <!-- 回复列表 -->
                        <view v-if="comment.showReply">
                        <view v-for="(reply,replyIndex) in comment.replies" :key="reply._id" class="reply" @longpress.stop="handleLongPressComment_Reply(postIndex,commentIndex,replyIndex,comment,reply)">
                        <image :src="reply.avatar" class="reply-avatar" mode="aspectFill" @tap="to_personal_info(reply)"/>  
                            <view class="reply-content">
                            <view class="reply-header">
                                <view class="reply-info">
                                <text class="reply-user">{{ reply.username }}</text>
                                <text class="reply-meta">{{ formatDate(reply.craete_time) }} · {{ reply.ip }}</text>
                                </view>
                                <view class="reply-action">
                                <view class="reply-like-action" @tap.stop="()=>like(reply,post,comment,reply,2)">
                                    <image :src="reply.liked ? '/static/index/liked.png' : '/static/index/like.png'" class="action-icon" />
                                    <text>{{ reply.like_count }}</text>
                                </view>
                                </view>
                            </view>

                            <!-- 评论内容 -->
                            <text class="reply-text">
                                <text v-if="reply.reply_username">
                                回复
                                <text class="relpy_username">{{ reply.reply_username }}: </text>
                                </text>
                                {{ reply.content }}
                            </text>

                            <!--回复按钮-->
                            <view class="reply-action" @tap.stop="()=>toggleReplyInput(reply)">
                                <text>回复</text>
                            </view>

                            <!-- 回复输入框 --><!-- 回复reply -->
                            <view v-if="reply.showReplyInput" class="reply-input-wrapper">
                                <input
                                v-model="newReplyReply"
                                class="reply-input"
                                :placeholder=" '回复' + reply.username + '...' "
                                />
                                <button class="reply-button" @tap="()=>submitComment(post,comment,reply,2,newReplyReply)">回复</button>
                            </view>

                            </view>

                        </view>
                        </view>
                    </view>
                    </view>

                    <!--评论输入框--><!-- 回复post -->
                    <view class="comment-input-wrapper" @tap.stop>
                    <input
                        v-model="newComment"
                        class="comment-input"
                        placeholder="发表评论..."
                    />
                    <button class="reply-button" @tap="()=>submitComment(post,null,null,0,newComment)">回复</button>
                    </view>
                </view>
            </view>
            <view v-else class="no-post">
                <text>帖子已删除</text>
            </view>
            
        </view>
    </view>
</template>

<script >
import PubSub from 'pubsub-js';
export default {
  data() {
    return {
        post_id: '',
        user: {
            account_id: '',
            username: '',
            avatar: '/static/info/not_login.png',
            admin: false,
        },
        post: {},
        newComment: '',
        newReply: '',
        newReplyReply: '',
        replyPlaceholder: '发表评论...', // 回复框的占位符
        last_showInput: null, // 记录上一个显示的输入框
        isLoading: true, // 是否正在加载
        no_post: false, // 是否没有帖子
        token: ''
    };
  },
  onLoad(option) {
    this.post_id = option.post_id;
    this.user.account_id = option.account_id;
    this.user.username = option.username || '未登录';
    this.user.avatar = option.avatar || '/static/info/not_login.png';
    this.user.admin = option.admin;
    uni.showLoading({ 
        title: '加载中...', 
        mask: true 
    });
    this.fetchPost(this.post_id)
  },
  onUnload(){
    if(this.no_post){
        uni.$emit('return_from_source_post',this.post_id);
    }
    if(this.token){
      PubSub.unsubscribe(this.token);
      this.token = '';
    }
  },
  methods: {
    //获取帖子和评论
    async fetchPost(post_id) {
      try {
        const res = await uniCloud.callFunction({
          name: 'get_target_post',
          data:{
            post_id: post_id,
            account_id: this.user.account_id,
          }
        });
        if(res.result.code === 200){
          this.post = res.result.data;
          this.post.showComments = true;
          console.log('comments',this.post.comments);
          uni.showToast({
            title: '加载成功',
            icon: 'success',
            duration: 1000
          });
        }else{
            this.no_post = true; // 设置没有帖子
        }
      }catch(e){
        console.error('获取帖子失败', e);
      }finally {
        uni.hideLoading();
        this.isLoading = false; // 加载完成
      }
    },
    //时间格式化函数
    formatDate(date) {
      date = new Date(date);
      const pad = n => n.toString().padStart(2, '0');
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    // 预览媒体
    previewMedia(media, currentIndex) {
      uni.previewMedia({
        sources: media.map(item => ({
          url: item.url,
          type: item.type
        })),
        current: currentIndex, // 当前预览的媒体索引
      });
    },
    //点赞
    async like(item, post, comment, reply, type) {
      if (!this.user.account_id) {
        uni.showToast({ title: '请登录', icon: 'none' });
        return;
      }
      item.liked = !item.liked; // 切换点赞状态
      item.like_count += item.liked ? 1 : -1;
      try {
        const res = await uniCloud.callFunction({
          name: 'user-liked',
          data: {
            target_id: item._id,
            post: post,
            comment: comment,
            reply: reply,
            account_id: this.user.account_id,
            type: type
          }
        });
        
        if(res.result.msg === "请登录")
        {
          uni.showToast({
            title: '请登录',
            icon: 'none'
          });
        }
        else if(res.result.msg != "success") {
          item.liked = !item.liked; // 还原点赞状态
          item.like_count -= item.liked ? -1 : 1;
          uni.showToast({
            title: res.result.message || '操作失败',
            icon: 'none'
          });
        }
        else if(res.result.first){
          PubSub.publish('update_activity',5);
        }
      } catch (err) {
        console.error('点赞失败:', err);
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    },
    // 确认删除帖子
    confirmDeletePost(post) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条帖子吗？',
        success: (res) => {
          if (res.confirm) {
            this.deletePost(post); // 调用删除函数
          }
        }
      });
    },
    //删除帖子
    async deletePost(post) {
      try {
        const res = await uniCloud.callFunction({
            name: 'delete_post',
            data: { post_id: post._id }
        });
        if (res.result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' });
            this.post = {}; // 清空当前帖子数据
            this.no_post = true; // 设置没有帖子
        } else {
            uni.showToast({ title: '删除失败', icon: 'none' });
        }
      } catch (error) {
            console.error('删除失败:', error);
            uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    // 提交评论或回复
    async submitComment(post,comment,reply,type,content) {
      if ((!this.newComment.trim() && type==0) || (!this.newReply.trim() && type==1) || (!this.newReplyReply.trim() && type==2)) {
        uni.showToast({ title: '评论不能为空', icon: 'none' });
        return;
      }
      if(!this.user.account_id){
        uni.showToast({ title: '请登录', icon: 'none' });
        return;
      }
      try {
        const res = await uniCloud.callFunction({
          name: 'submit_comment',
          data:{
            user:this.user,
            post: post,
            comment: comment,
            reply:reply,
            type: type,
            content: content,
          } 
        });
		    
        if(res.result.msg == "success"){
          if(type==0){
            post.comment_count += 1; // 更新评论数量
            post.comments.unshift(res.result.data);
            this.newComment = ''; // 清空输入框
          } 
          else{
            comment.replies.unshift(res.result.data);
            if(reply){
              this.newReplyReply = '',
              reply.showReplyInput=false; // 清空输入框
            }
            else{
              this.newReply = '',
              comment.showReplyInput=false; // 清空输入框
            }
          }
          uni.showToast({ title: '评论成功', icon: 'success' });
        } 
      }catch (error) {
        uni.showToast({ title: '评论失败', icon: 'none' }); 
      }
    },
    //处理长按事件删除comment或reply
    handleLongPressComment_Reply(postIndex,commentIndex,replyIndex,parent,item){
      if(item.account_id && item.account_id !== this.user.account_id && !this.user.admin) {
        return;
      }
      uni.showActionSheet({
        itemList: ['删除'],
        success: (res) => {
          // 点击了“删除”
          if (res.tapIndex === 0) {
            uni.showModal({
              title: '确认删除',
              content: '确定要删除这条评论吗？',
              success: (res) => {
                if (res.confirm) {
                  this.deleteComment_Reply(postIndex,commentIndex,replyIndex,parent, item); // 删除操作
                }
              }
            });
          }
        }
      });
    },
    // 删除评论或回复
    async deleteComment_Reply(postIndex,commentIndex,replyIndex,parent,item) {
      let loading = true;
      if(loading){
        uni.showToast({
          title: '删除中...',
          icon: 'loading'
        })
      }
      try {
        const res = await uniCloud.callFunction({
          name: 'delete_comment_reply',
          data: { 
            parent: parent,
            item: item
          }
        });
        loading = false;
        if (res.result.code === 200) {
          uni.showToast({ title: '删除成功', icon:'success' }); 
          if(!('post_id' in item)) {//item是reply
            console.log('replies',res.result.data.replies)
            this.$set(this.posts[postIndex].comments[commentIndex],'replies',res.result.data.replies);
          }
          else{//item是comment
            this.posts[postIndex].comments.splice(commentIndex, 1); // 从评论列表中移除已删除的评论
            this.posts[postIndex].comment_count -= 1; // 更新评论数量
          }
        }
      }catch (error) {
        console.error('删除失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    // 切换回复输入框的显示状态
    toggleReplyInput(item) {
      this.$set(item, 'showReplyInput', !item.showReplyInput);
      if(this.last_showInput && this.last_showInput !== item) {
        this.last_showInput.showReplyInput = false; // 隐藏上一个输入框
      }
      this.last_showInput = item; // 更新上一个输入框
    },
    //跳转到发帖页面
    to_post(post, type) {
      let share_post = {}
      if (post) { // 如果是转发帖子{
        if (post.post_type == 1 && post.source_post) {
          share_post = post.source_post; // 获取原帖信息
        }
        else {
          share_post = post; // 获取当前帖子信息
        }
      }
      uni.navigateTo({ 
        url: '/pages/post/post' ,
        success: () => {
          PubSub.publish('to_post', {
          share_post: share_post,
          type: type,
          account_id: this.user.account_id,
          username: this.user.username,
          avatar: this.user.avatar
          })
        }
      });
    },
    //跳转到个人信息页面
    to_personal_info(user) {
      if(user.account_id == this.user.account_id){
        return;
      }
      uni.navigateTo({
          url: `/pages/personal_info/personal_info?account_id=${user.account_id}&visitor_account_id=${this.user.account_id}&visitor_admin=${this.user.admin}`,
      });
    }
  }
}

</script>

<style scoped>
@import url(source_post.css);
</style>
