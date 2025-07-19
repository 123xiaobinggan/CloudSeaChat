<template>
  <view class="home-page">
    <!-- 顶部输入框和发帖按钮 -->
    <view v-if="show_top_bar" :class="['top-bar', {'no-shadow': isAtTop}]">
      <view class="search-wrapper">
        <image src="/static/index/搜索.png" class="search-icon" />
        <input v-model="searchQuery" placeholder="搜索帖子..." class="search-input" @input="filterPosts()" />
      </view>
      <image src="/static/index/发帖.png" class="post-icon" @tap="to_post(null,0)" />
  </view>

    <!-- 帖子头 -->
    <view v-for="(post,postIndex) in filteredPosts" :key="post._id" class="post">
      <view class="post-header">
        <image :src="post.avatar" class="avatar" mode="aspectFill" @tap="to_personal_info(post)" />
        <view class="user-info">
          <text class="username">{{ post.username }}</text>
          <br/>
          <text class="meta">{{ formatDate(post.create_time) }} · {{ post.ip }}</text>
        </view>
        <view v-if="post.account_id == user.account_id || user.admin" class="post-actions">
          <image src="/static/index/垃圾桶.png" class="action-icon" @tap="()=>confirmDeletePost(post)" />
        </view>
      </view>

      <!-- 展示普通内容或是转发内容 -->
      <view class="post-content">
        <view v-if="post.post_type==0">
          <text>{{ post.content }}</text>
          <view v-if="post.media.length > 1">
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
          <view v-else-if="post.media.length == 1">
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

        <!-- 转发 -->
        <view v-else>
          <!-- 当前用户的附言 -->
          <text>{{ post.content }}</text>
          <!-- 嵌套展示原帖（source_post） -->
          <view class="source-post-card" @tap="to_source_post(post)">
            <view class="source-header">
              <image v-if="post.source_post.avatar" :src="post.source_post.avatar" class="avatar" mode="aspectFill" />
              <view class="user-info">
                <text v-if="post.source_post.username" class="username">{{ post.source_post.username }}</text>
                <br/>
                <text v-if="post.source_post.create_time" class="meta">{{ formatDate(post.source_post.create_time) }} · {{ post.source_post.ip }}</text>
              </view>
            </view>

            <view class="source-content">
              <view v-if="post.source_post.content" class="source-text">
                <text>{{ post.source_post.content }}</text>
              </view>
              <view v-if="post.source_post.media">
                <view v-if="post.source_post.media.length > 1">
                  <view
                    v-if="Array.isArray(post.source_post.media) && post.source_post.media.length"
                    :class="['media-grid', 'media-count-' + post.source_post.media.length]"
                  >
                    <view
                      v-for="(media, mediaIndex) in post.source_post.media"
                      :key="mediaIndex"
                      class="media-item"
                      @tap="()=>previewMedia(post.source_post.media, mediaIndex)"
                    >
                      <image v-if="media.type === 'image'" :src="media.url" class="post-media" mode="aspectFill" />
                      <video v-else-if="media.type === 'video'" :src="media.url" class="post-media" controls />
                    </view>
                  </view>
                </view>
                <view v-else-if="post.source_post.media.length == 1">
                  <view class="one-media-item" @tap="()=>previewMedia(post.source_post.media, 0)">
                    <image v-if="post.source_post.media[0].type === 'image'" 
                      :src="post.source_post.media[0].url" 
                      class="post-one-media"
                      mode="widthFix" 
                    />
                    <video v-else-if="post.source_post.media[0].type === 'video'" 
                      :src="post.source_post.media[0].url" 
                      controls 
                    />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 设备信息 -->
        <view class="device_model">
            <text>{{ post.device_model }}</text>
        </view>

        <!-- 可见权限 -->
        <view v-if="post.visibility=='仅我可见'" class="visibility">
            <text>仅自己可见</text>
        </view>

      </view>

      <!-- 帖子操作按钮 -->
      <view class="post-actions">
        <view class="action like-action" hover-class="none" @tap="()=>like(post,post,null,null,0)">
          <image 
            :src="post.liked ? '/static/index/已赞.png' : '/static/index/赞.png'" 
            class="action-icon" 
            :class="{ 'like-heart-animated': post.liked }" 
          />

          <text>{{ post.like_count }}</text>
        </view>
        <view class="action" hover-class="none" @tap="()=>toggleComments(post)">
          <image src="/static/index/评论.png" class="action-icon" />
          <text>{{ post.comment_count || 0 }}</text>
        </view>
        <view class="action" @tap="()=>to_post(post,1)">
          <image src="/static/index/转发.png" class="action-icon" />
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
                  <image :src="comment.liked ? '/static/index/已赞.png' : '/static/index/赞.png'" class="action-icon" />
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
            <view v-if="comment.replies.length && !comment.showReply"  class="showReply" @tap.stop="comment.showReply = true">
              <text>{{ comment.replies.length }}条回复</text>  
            </view>

            <!-- 回复列表 -->
            <view v-if="comment.showReply">
              <view v-for="(reply,replyIndex) in comment.replies" :key="reply._id" class="reply" @longpress.stop="handleLongPressComment_Reply(postIndex,commentIndex,replyIndex,comment,reply)">
              <image :src="reply.avatar" class="reply-avatar" mode="aspectFill" @tap="to_personal_info(reply)" />  
                <view class="reply-content">
                  <view class="reply-header">
                    <view class="reply-info">
                      <text class="reply-user">{{ reply.username }}</text>
                      <text class="reply-meta">{{ formatDate(reply.create_time) }} · {{ reply.ip }}</text>
                    </view>
                    <view class="reply-action">
                      <view class="reply-like-action" @tap.stop="()=>like(reply,post,comment,reply,2)">
                        <image :src="reply.liked ? '/static/index/已赞.png' : '/static/index/赞.png'" class="action-icon" />
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

    <!-- 加载中状态 -->
    <view class="loading-box" v-if="loading && !loaded">
      <view class="spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 加载完成 -->
    <view class="loaded-box" v-if="loaded && !loading">
      <text class="loaded-text">加载完成</text>
    </view>
  </view>
</template>

<script>
import PubSub from 'pubsub-js';
export default {
  data() {
    return {
      searchQuery: '',
      posts: [
      ],
      filteredPosts: [],
      newComment: '',
      newReply: '',
      newReplyReply: '',
      user: {
        account_id: '',
        username: '未登录',
        description: '这个人很懒，什么都没有留下',
        avatar: '/static/info/头像.png',
        admin:false, // 是否为管理员
        ip: '未知',
      },
      replyPlaceholder: '发表评论...', // 回复框的占位符
      last_showInput: null, // 记录上一个显示的输入框
      loading: false, // 是否正在加载更多帖子
      loaded: false,
      token: '', // 用于订阅
      lastScrollTop: 0,
      show_top_bar: true, // 控制顶部栏的显示与隐藏
      isAtTop: true, // 是否滚动到顶部
    };
  },
  watch: {
    posts: {
      deep: true, // 深度监听 posts 数组
      handler() {
        this.filteredPosts = this.posts; // 更新过滤后的帖子列表
        this.filterPosts(); // 过滤帖子
      }
    },
    'user.account_id': {
      handler() {
        this.posts = []; // 清空帖子列表
        // console.log('watch用户信息更新:', this.user);
        this.fetchPosts(null,false); // 调用加载更多帖子的方法
      }
    }
  },
  onShow(){
    const app = getApp();
    if(app.userInfo) {
      if(app.userInfo.account_id !== this.user.account_id){
        this.user = app.userInfo; // 更新用户信息
        console.log('onShow用户信息更新:', this.user);
      }
    }
  },
  async onLoad() {

    const uid = uni.getStorageSync('uid'); // 获取本地存储的用户 ID
    if(uid){
      await this.login_register('login',uid,'','',true);
    }
    else{
      this.posts = [];
      this.fetchPosts(null,false); // 调用加载更多帖子的方法
    }

    this.token = PubSub.subscribe('return_index', (msg, data) => {
      this.posts.unshift(data); // 将新帖子添加到列表开头
      PubSub.publish('update_activity', 20); // 发布更新事件
    });
    
    uni.$on('return_from_source_post',(post_id)=>{
      this.posts = this.posts.filter(post => post._id !== post_id);
    })
    
  },
  onUnload() {
    if(this.token){
      PubSub.unsubscribe(this.token);
      this.token = null;
    }
    uni.$off('return_from_source_post');
  },
  onReachBottom() {
    // 页面滚动到底部时加载更多帖子
    if(this.loading) return; // 如果正在加载或没有更多帖子，直接返回
    this.loading = true; // 设置加载状态
    this.loaded = false; // 设置加载完成状态为 false
    let post = this.posts.length > 0 ? this.posts[this.posts.length - 1] : null; // 获取最后一个帖子
    this.fetchPosts(post,true).finally(() => {
        this.loading = false; 
        this.loaded = true; 
        setTimeout(() => {
          this.loaded = false; // 重置加载完成状态
        }, 2000); // 2秒后重置加载完成状态
    }); // 调用加载更多帖子的方法
  },
  onPullDownRefresh() {
    if(this.loading) return; // 如果正在加载或没有更多帖子，直接返回
    this.posts = []; // 清空帖子列表
    this.fetchPosts(null, false).finally(() => {
      uni.stopPullDownRefresh(); // 停止下拉刷新
    }); 
  },
  onPageScroll(e){
    const current = e.scrollTop;
    if(current === 0){
      this.isAtTop = true;
    }
    else{
      this.isAtTop = false;
    }
    // 向上滑动显示，向下隐藏
    if (current <= this.lastScrollTop) {
      this.show_top_bar = true;
    } 
    else {
      this.show_top_bar = false;
    }
    this.lastScrollTop = current;
  },
  methods: {
    //加载更多帖子
    async fetchPosts(post,lt) {
      try {
        // 调用云函数获取帖子
        const res = await uniCloud.callFunction({
          name: 'get_posts',
          data: {
            post_create_time: post ? post.create_time : null, // 传递最后一个帖子的 ID
            page_size: 5, // 每页显示的帖子数量
            lt: lt,
            account_id: this.user.account_id,
          }
        });

        // 判断云函数是否成功返回数据
        if (res.result.code === 0) {
          // 成功获取帖子
          const { posts } = res.result.data;
          console.log('获取帖子成功:', posts);
          this.posts = [...this.posts, ...posts];
        } else {
          console.error('获取帖子失败:', res.result.msg);
        }
      } catch (error) {
        console.error('获取帖子时发生错误:', error);
      }
    },
    // 过滤帖子
    filterPosts() {
      this.filteredPosts = this.posts.filter(post => {
        const query = this.searchQuery.trim().toLowerCase();
        // 检查主帖内容和用户名，确保属性存在
        const matchesMain = (post.content && post.content.toLowerCase().includes(query)) ||
                          (post.username && post.username.toLowerCase().includes(query));
        
        // 如果是转发帖，检查源帖内容和用户名，确保属性存在
        const matchesSource = post.post_type === 1 && 
                            ((post.source_post?.content && post.source_post.content.toLowerCase().includes(query)) || 
                             (post.source_post?.username && post.source_post.username.toLowerCase().includes(query)));
        
        return matchesMain || matchesSource;
      });
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
      // this.getUserLocation();
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
      
      uni.showToast({
        title:'删除中',
        icon:'loading'
      })
      
      try {
        const res = await uniCloud.callFunction({
          name: 'delete_post',
          data: { 
            post_id: post._id,
            account_id: post.account_id,
          }
        });
        
        if (res.result.code === 200) {
          uni.hideToast();
          uni.showToast({ title: '删除成功', icon: 'success' });
          this.posts = this.posts.filter(p => p._id !== post._id); // 从列表中移除已删除的帖子
        } else {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      } catch (error) {
        console.error('删除失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }finally{
        uni.hideToast();
      }
    },
    //点赞
    async like(item, post, comment, reply, type) {
      if (!this.user.account_id) {
        uni.showToast({ title: '请登录', icon: 'none' });
        return;
      }
      item.liked = !item.liked; // 切换点赞状态
      item.like_count += item.liked ? 1 : -1;
      await this.getUserLocation();
      await this.resolve_ip();
      try {
        const res = await uniCloud.callFunction({
          name: 'user-liked',
          data: {
            target_id: item._id,
            post: post,
            comment: comment,
            reply: reply,
            account_id: this.user.account_id,
            type: type,
            ip: this.user.ip
          }
        });
        
        if(res.result.msg === "请登录"){
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
          PubSub.publish('update_activity', 5);
        }
      } catch (err) {
        console.error('点赞失败:', err);
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    },
    //展示评论
    toggleComments(selectedPost) {
      this.filteredPosts.forEach(post => {
        if (post._id === selectedPost._id) {
          post.showComments = !post.showComments; // 切换当前帖子的评论显示状态
        } else {
          post.showComments = false; // 收起其他帖子的评论
        }
      });
      
      if(!selectedPost.comments){
      this.fetchComments(selectedPost); // 获取当前帖子的评论
      }
    },
    //获取评论
    async fetchComments(post) {
      // console.log('post.comment_count',post.comment_count)
      try{
        const res = await uniCloud.callFunction({
          name: 'get_comments',
          data: {
            post_id: post._id // 传递帖子 ID
          } 
        });
        
        if(res.result.msg == "success"){
          post.comments = res.result.data; // 更新评论列表 
          post.comment_count = post.comments.length; // 更新评论数量
          if(this.user.account_id){//如果用户已登录，获取用户点赞状态
            const db = uniCloud.database();
            const likeRes = await db.collection('user-liked').where({
              account_id: this.user.account_id,
              target_id: db.command.in(post.comments.map(item => item._id)),
              liked: true 
            }).get();
            const likedCommentIds = likeRes.result.data.map(item => item.target_id);
            let replies = [];
            for (const comment of post.comments) {
              comment.liked = likedCommentIds.includes(comment._id);
              replies = replies.concat(comment.replies);
            }
            if(replies.length>0){
              const likeRes = await db.collection('user-liked').where({
                account_id: this.user.account_id,
                target_id: db.command.in(replies.map(item => item._id)),
                liked: true
              }).get();
              const likedReplyIds = likeRes.result.data.map(item => item.target_id);
              post.comments.forEach(comment => {
                comment.replies.forEach(reply => {
                  reply.liked = likedReplyIds.includes(reply._id);
                });
              });
            }
          }
        }
      }catch (error) {
        console.error('获取评论失败:', error);
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
      
      uni.showToast({
        title: '评论中...',
        icon: 'loading'
      })
      
      await this.getUserLocation();
      await this.resolve_ip();
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
            loading = false
          }
          uni.hideToast();
          uni.showToast({ title: '评论成功', icon: 'success' });
          PubSub.publish('update_activity', 10);
        } 
      }catch (error) {
        uni.showToast({ title: '评论失败', icon: 'none' }); 
      }finally{
        uni.hideToast();
      }
    },
    //获取用户ip地址
    async getUserLocation() {
      try {
          const res = await uniCloud.callFunction({
              name: 'get_ip',
              data: {}
          })
          // console.log('res',res)
          if(res.result.code === 200){
            this.user.ip = res.result.data; // 设置用户的 IP 地址
          }
      }catch(e){
          console.error('获取位置失败', e);
      }
    },
    //解析ip地址
    async resolve_ip(){
        const host = "https://ipcity.market.alicloudapi.com";  // 请求地址 支持http 和 https 及 WEBSOCKET
        const path = "/ip/city/query";   // 后缀
        const appCode = "1dc84a4fe7fc40238d1a17ad665c59d3"; 
        // 构建查询参数
        const querys = `ip=${encodeURIComponent(this.user.ip)}&coordsys=WGS84`;
        const urlSend = `${host}${path}?${querys}`;   // 拼接完整请求链接
          try {
          const res = await uni.request({
                        url: urlSend,
                        method: 'GET',
                        header: {
                          "Authorization": `APPCODE ${appCode}`
                        }
                      });
          if (res.statusCode === 200) {
            if(res.data.code == 200){
              let city;
              if(res.data.data.result.city){
                city=res.data.data.result.city;
              }
              else if(res.data.data.result.prov){
                city=res.data.data.result.province;
              }
              else if(res.data.data.result.country){
                city=res.data.data.result.country;
              }
              else if(res.data.data.result.continuent){
                city=res.data.data.result.continent;
              }
              if(city.endsWith('市')){
                city=city.slice(0,-1)
              }
              else if(city.endsWith('省')){
                city=city.slice(0,-1)
              }
              this.user.ip = city; // 设置用户的 IP 地址
              console.log('获取到的IP地址',this.user.ip)
            }
          }
        } catch (err) {
          console.error('resolve_ip 请求失败:', err);
        }
    },
    // 长按评论或回复处理
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
      uni.showToast({
        title: '删除中...',
        icon: 'loading'
      })
      try {
        const res = await uniCloud.callFunction({
          name: 'delete_comment_reply',
          data: { 
            parent: parent,
            item: item
          }
        });
        
        if (res.result.code === 200) {
          uni.hideToast(); // 隐藏加载提示
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
      }finally{
        uni.hideToast(); // 隐藏加载中提示
      }
    },
    //转到原帖页
    to_source_post(post){
        uni.navigateTo({
          url: `/pages/source_post/source_post?post_id=${post.source_post.post_id}&account_id=${this.user.account_id}&admin=${this.user.admin}&username=${this.user.username}&avatar=${this.user.avatar}`,
        });
    },
    //转到个人信息页
    to_personal_info(item){
        uni.navigateTo({
          url: `/pages/personal_info/personal_info?account_id=${item.account_id}&visitor_account_id=${this.user.account_id}&visitor_admin=${this.user.admin}`,
        });
    },
    //时间格式化函数
    formatDate(create_time) {
      create_time= new Date(create_time);
      const pad = n => n.toString().padStart(2, '0');
      const year = create_time.getFullYear();
      const month = pad(create_time.getMonth() + 1);
      const day = pad(create_time.getDate());
      const hours = pad(create_time.getHours());
      const minutes = pad(create_time.getMinutes());
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    // 切换回复输入框的显示状态
    toggleReplyInput(item) {
      this.$set(item, 'showReplyInput', !item.showReplyInput);
      if(this.last_showInput && this.last_showInput !== item) {
        this.last_showInput.showReplyInput = false; // 隐藏上一个输入框
      }
      this.last_showInput = item; // 更新上一个输入框
    },
    // 登录
    async login_register(action, account_id, username,password, has_token) {
			const res = await uniCloud.callFunction({
				name: 'login_register',
				data: {
					action,
					account_id,
					username,
					password,
					has_token
				}
			});
      if (res.result.code === 200) {
				uni.showToast({title: '已登录',icon:'success'});
        const app = getApp();
        app.userInfo = res.result.userInfo; // 更新全局用户信息
        app.login_status = true; // 更新登录状态
				Object.keys(res.result.userInfo).forEach((key) => {
            this.user[key] = res.result.userInfo[key]; // 更新本地用户信息
        });
        if(this.user.unread_messages){
          uni.showTabBarRedDot({
            index: 1,
          });
        }
				uni.setStorageSync('uid', res.result.userInfo.account_id);
			}
      else{
        this.posts = [];
        this.fetchPosts(null,false); // 调用加载更多帖子的方法
        uni.removeStorageSync('uid');
      }
		},
  },
};
</script>

<style scoped>
@import url(index.css);
</style>