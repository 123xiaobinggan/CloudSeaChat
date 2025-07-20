<template>
	<view class="personal-page">
		<!-- 头部区域 -->
		<view>
			<image @tap="changeBackground" class="background-image" :src="user.background" mode="aspectFill" />
		</view>
		<view class="header">
			<view class="top-user-info">
				<image class="top-avatar" :src="user.avatar" mode="aspectFill" @tap="previewAvatar(user.avatar)" />
				<view class="text-info">
					<text class="top-username">{{ user.username }}</text>
					<text class="user-id">ID: {{ user.account_id }}</text>
					<text class="description">{{ user.description }}</text>
				</view>
			</view>
		</view>

		<!-- 功能导航栏 -->
		<view class="scrollable-container">
			<!-- 功能导航栏 -->
			<view class="nav-bar">
				<view
					class="nav-item"
					:class="{ active1: activeTab === 'posts' }"
					@tap="activeTab = 'posts'"
				>
					<view class="icon-count-wrapper1">
						<image class="nav-icon1" src="/static/personal_info/post.png" mode="aspectFit" />
						<text class="nav-count">{{ user.post_count }}</text>
					</view>
				</view>

				<view
					class="nav-item"
					:class="{ active2: activeTab === 'visitors' }"
					@tap="activeTab = 'visitors'"
				>
					<view class="icon-count-wrapper2">
					<image class="nav-icon2" src="/static/personal_info/visitor.png" mode="aspectFit" />
					<text class="nav-count">{{ user.visitor_count }}</text>
					</view>
				</view>
			</view>

			<!-- 帖子 -->
			<view v-if="activeTab=='posts'">
				<!-- 帖子头 -->
				<view v-for="(post,postIndex) in userPosts" :key="postIndex" class="post">
					<view class="post-header">
						<image :src="user.avatar" class="avatar" mode="aspectFill" />
						<view class="user-info">
							<text class="username">{{ user.username }}</text>
							<br/>
							<text class="meta">{{ formatDate(post.create_time) }} · {{ post.ip }}</text>
						</view>
						<view v-show="(visitor.account_id === user.account_id) || visitor.admin" class="post-actions">
							<image src="/static/index/rubbish.png" class="action-icon" @tap="()=>confirmDeletePost(post)" />
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
				</view>

				<!-- 帖子操作按钮 -->
				<view class="post-actions">
					<view class="action like-action" @tap="()=>like(post,post,null,null,0)">
						<image 
						:src="post.liked ? '/static/index/liked.png' : '/static/index/like.png'" 
						class="action-icon" 
						:class="{ 'like-heart-animated': post.liked }" 
						/>

						<text>{{ post.like_count }}</text>
					</view>
					<view class="action" @tap="()=>toggleComments(post)">
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
					<view v-for="(comment,commentIndex) in post.comments" :key="commentIndex" class="comment" @longpress.stop="handleLongPressComment_Reply(postIndex,commentIndex,null,post,comment)">
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
			</view>

			<!-- 访客 -->
			<view v-else-if="activeTab=='visitors'">
				<view v-for="(group, index) in userVisitors" :key="index" class="date-group">
					<!-- 日期栏 -->
					<view class="date-header">
						<text class="date-text">{{ group.date }}</text>
					</view>

						<!-- 某日的所有访客 -->
					<view v-for="(visitor, vIndex) in group.visitors" :key="vIndex" class="visitor-card">
						<image class="avatar" :src="visitor.avatar" mode="aspectFill" />
						<view class="visitor-info">
							<text class="username">{{ visitor.username }}</text>
							<br/>
							<text class="meta">{{ formatDate(visitor.create_time) }} · {{ visitor.ip }}</text>
						</view>
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

			<view v-if="userPosts.length==0 && activeTab=='posts'" class="reminder">
				<text v-if="user.account_id==visitor.account_id">空空如也，去发一条帖子吧！</text>	
				<text v-else>啊欧，你打开了寂寞的百宝箱！</text>
			</view>

			<view v-else-if="userVisitors.length==0 && activeTab=='visitors'" class="reminder">
				<text>门可罗雀，没有访客哦！</text>
			</view>

		</view>

		<view 	class="back-to-top"
				:class="{ 'show': showBackToTop, 'hide': !showBackToTop }"
				@tap="scrollToTop"
		>
		<image
			class="arrow-icon"
			src="/static/personal_info/arrow-up.png"
			mode="aspectFit"
			:class="{ 'spin': showBackToTop }"
		/>
		</view>

  	</view>
</template>

<script>
	export default {
		data() {
			return {
				user:{
					account_id: null,
					username: '未登录',
					description: '这个人很懒，什么都没有留下',
					avatar: '/static/info/not_login.png',
					background: '',
					post_count: 0,
					visitor_count: 0,
					level: 0,
					activity: 0,
					coupon: 0,
					points: 0,
					balance: 0,
					admin: false // 是否为管理员
				},
				visitor:{
					account_id: null,
					admin: false,
					ip: '未知',
				},
				activeTab: 'posts',
				userPosts: [],
				userVisitors: [
					
				],
				loading: false,
				loaded: false,
				newComment: '',
      			newReply: '',
      			newReplyReply: '',
				replyPlaceholder: '发表评论...', // 回复框的占位符
      			last_showInput: null, // 记录上一个显示的输入框
				showBackToTop: false,
				rotating: false,
				navBarTop: 0,
				lastScrollTop: 0,
				showBackToTop: false,
				newBackground: '',
				token: '',
			}
		},
		watch:{
			activeTab(newVal,oldVal){
				if(newVal == 'visitors' && this.userVisitors.length == 0){
					console.log('fetchUserVisitors')
					this.fetchUserVisitors()
				}
			}
		},
		async onLoad(option) {
			this.user.account_id = option.account_id;
			this.visitor.account_id= option.visitor_account_id;
			this.visitor.admin= option.visitor_admin==true || option.visitor_admin=='true';
			console.log('visitor',this.visitor)
			await this.fetchUserInfo();
			// console.log('user',this.user.account_id)
			if(this.user.account_id){
				this.fetchUserPosts();
			}
			if( (option.account_id !== option.visitor_account_id) &&  option.visitor_account_id){
				this.updateVisitor(option.account_id,option.visitor_account_id);
			}
		},
		onUnload(){
			if(this.token){
				PubSub.unsubscribe(this.token);
				this.token = ''
			}
		},
		onReachBottom() {
			if (this.activeTab === 'posts' && !this.loading) {
				this.loading = true;
				this.loaded = false;
				this.fetchUserPosts().then(() => {
					this.loading = false;
					this.loaded = true;
				});
				setTimeout(() => {
					this.loaded = false;
				}, 1000);
			}
			else if (this.activeTab === 'visitors' &&!this.loading) {
				this.loading = true;
				this.loaded = false;
				this.fetchUserVisitors().then(() => {
					this.loading = false;
					this.loaded = true;
				});
				setTimeout(() => {
					this.loaded = false;
				}, 1000);
			}	
		},
		onPageScroll(e) {
			// 向上滚动才触发
			if(this.lastScrollTop >= e.scrollTop) {
				if(e.scrollTop >= 220){
					this.showBackToTop = true;
				}
				else{
					this.showBackToTop = false;
				}
			}
			else{
				this.showBackToTop = false;
			}
			this.lastScrollTop = e.scrollTop;
		},
		methods: {
			//获取用户信息
			async fetchUserInfo() {
				try{
					const res = await uniCloud.callFunction({
						name: 'get_target_userInfo',
						data: {
							account_id: this.user.account_id,
						}
					})
					if(res.result.code === 200){
						console.log('获取用户信息成功', res.result.data)
						this.user = res.result.data;
						console.log('user',this.user)
					}
				}catch(err){
					console.error('获取用户信息失败', err);
				}
			},
			//获取用户帖子
			async fetchUserPosts() {
				try{
					const res = await uniCloud.callFunction({
						name: 'get_user_posts',
						data: {
							account_id: this.user.account_id,
							page_size: 5,
							create_time: this.userPosts.length > 0 ? this.userPosts[this.userPosts.length - 1].create_time : null,
							visitor_account_id: this.visitor.account_id
						}
					})
					if(res.result.code === 200){
						console.log('获取用户帖子成功', res.result.data)
						this.userPosts = this.userPosts.concat(res.result.data);
					}
				}catch(err){
					console.error('获取用户帖子失败', err);
					uni.showToast({
						title: '获取帖子失败',
						icon: 'none'
					})
				}
			},
			//获取用户访客
			async fetchUserVisitors() {
				try{
					const res = await uniCloud.callFunction({
						name: 'get_user_visitors',
						data: {
							account_id: this.user.account_id,
							day_count: 7,
							create_date: this.userVisitors.length > 0? this.userVisitors[this.userVisitors.length - 1].date : null
						}
					})
					if(res.result.code === 200){
						console.log('获取用户访客成功', res.result.data)
						this.userVisitors = this.userVisitors.concat(res.result.data);
					}
				}catch(err){
					console.error('获取用户访客失败', err);
					uni.showToast({
						title: '获取访客失败',
						icon: 'none'
					})
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
			//更新用户访客
			async updateVisitor(account_id,visitor_account_id){
				//获取访问者ip地址
				await this.getUserLocation();
				await this.resolve_ip();
				const res = await uniCloud.callFunction({
					name: 'update_visitor',
					data: {
						account_id: account_id,
						visitor_account_id: visitor_account_id,
						visitor_ip: this.visitor.ip
					}
				})
				this.user.visitor_count += res.result.data;
				console.log('update_visitor',res)
			},   
			//获取用户ip地址
			async getUserLocation() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get_ip',
						data: {}
					})
					if(res.result.code === 200){
					this.visitor.ip = res.result.data; // 设置用户的 IP 地址
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
				const querys = `ip=${encodeURIComponent(this.visitor.ip)}&coordsys=WGS84`;
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
						this.visitor.ip = city; // 设置用户的 IP 地址
						console.log('获取到的IP地址',this.visitor.ip)
					}
					}
				} catch (err) {
					console.error('resolve_ip 请求失败:', err);
				}
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
			// 预览头像
			previewAvatar(avatar){
				uni.previewImage({
					current: avatar, // 当前预览的媒体索引
					urls: [avatar],
				});
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
						this.posts = this.posts.filter(p => p._id !== post._id); // 从列表中移除已删除的帖子
					} else {
					uni.showToast({ title: '删除失败', icon: 'none' });
					}
				} catch (error) {
					console.error('删除失败:', error);
					uni.showToast({ title: '网络错误', icon: 'none' });
				}
			},
			//点赞
			async like(item, post, comment, reply, type) {
				if (!this.visitor.account_id) {
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
						account_id: this.visitor.account_id,
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
			//展示评论
			toggleComments(selectedPost) {
				this.userPosts.forEach(post => {
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
			// 提交评论或回复
			async submitComment(post,comment,reply,type,content) {
				if ((!this.newComment.trim() && type==0) || (!this.newReply.trim() && type==1) || (!this.newReplyReply.trim() && type==2)) {
					uni.showToast({ title: '评论不能为空', icon: 'none' });
					return;
				}
				if(!this.visitor.account_id){
					uni.showToast({ title: '请登录', icon: 'none' });
					return;
				}
				let showding = true;
				if(showding){
					uni.showToast({
						title: '提交中...',
						icon: 'loading'
					})
				}
				try {
					const res = await uniCloud.callFunction({
						name: 'submit_comment',
						data:{
							user:this.visitor,
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
						showding = false;
						uni.showToast({ title: '评论成功', icon: 'success' });
					} 
				}catch (error) {
					uni.showToast({ title: '评论失败', icon: 'none' }); 
				}
			},
			// 长按评论或回复处理
			handleLongPressComment_Reply(postIndex,commentIndex,replyIndex,parent,item){
				if(item.account_id && item.account_id !== this.visitor.account_id && !this.visitor.admin) {
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
								this.$set(this.userPosts[postIndex].comments[commentIndex],'replies',res.result.data.replies);
							}
							else{//item是comment
								// console.log('replies',res.result)
								// console.log('postIndex',postIndex,commentIndex,this.posts[postIndex])
								this.userPosts[postIndex].comments.splice(commentIndex, 1); // 从评论列表中移除已删除的评论
								this.userPosts[postIndex].comment_count -= 1; // 更新评论数量
							}
						}
				}catch (error) {
					console.error('删除失败:', error);
					uni.showToast({ title: '网络错误', icon: 'none' });
				}
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
			// 滚动到顶部
			scrollToTop() {
				// 启动旋转动画
				this.rotating = true;

				setTimeout(() => {
					this.rotating = false;
				}, 500); // 动画持续时间应与 CSS 一致

				// 平滑滚动
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 300
				});
			},
			changeBackground(){
				if(this.user.account_id!== this.visitor.account_id) {
					return;
				}
				uni.showActionSheet({
					itemList: ['更换背景'],
					success: (res) => {
					// 点击了“更换背景”
						if (res.tapIndex === 0) {
							uni.chooseImage({
								count: 1,
								sizeType: ['compressed'],
								sourceType: ['album', 'camera'],
								success: (res) => {
									this.newBackground = res.tempFilePaths[0];
									this.update_background();
									}
							});
						}
					}
				})
			},
			async update_background(){
				const ext = this.user.background.split('.').pop().toLowerCase();
				const cloudPath = `Personal_background/${this.user.account_id}-${this.user.username}-${new Date().toISOString()}.${ext}`;
				try{
					const uploadRes = await uniCloud.uploadFile({
						filePath: this.newBackground,
						cloudPath,
						fileType: ext,
						cloudPathAsRealPath:true,
						onUploadProgress: (progress) => {
						// 显示上传进度
							var percentage = Math.round(progress.loaded * 100)/progress.total;
							uni.showLoading({ title: `上传中...${percentage}%` });
						}
					})
					console.log('uploadRes',uploadRes)
					this.newBackground = uploadRes.fileID;
					const res = await uniCloud.callFunction({
						name: 'update_background',
						data: {
							oldBackground: this.user.background,
							newBackground: this.newBackground,
							account_id: this.user.account_id
						}
					})
					console.log('update_background',res)
					if(res.result.code === 200){
						this.user.background = this.newBackground;
						uni.showToast({ title: '更换成功', icon:'success' });
					}
					else{
						this.user.background = 'https://mp-ad47c7bd-10fe-4cc5-9ad0-a7ff552214bc.cdn.bspapp.com/Personal_background/sunset.jpg';
						uni.showToast({ title: '更换失败', icon: 'none' });
					}
				}catch(e){
					uni.showToast({ title: '图片上传失败', icon: 'none' });
					console.log('图片上传失败',e)
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
		}
	}
</script>

<style>
@import url(personal_info.css);
</style>