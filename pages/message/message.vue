<template>
    <view class="page-container" @touchstart="onTouchStart" @touchend="onTouchEnd" @touchmove="onTouchMove">
        <!-- 顶部导航栏 -->
        <view class="nav-tabs">
            <view
                v-for="(tab, index) in tabs"
                :key="index"
                class="tab-item"
                :class="{ active: activeTab === index }"
                @tap="switchTab(index)"
            >
                <view class="tab-wrap">
                    <image :src="tab.icon" class="tab-icon" mode="aspectFit" />
                    <view class="tab-count" v-if="tab.count > 0">
                        <text class="tab-count-text">{{ tab.count }}</text>
                    </view>
                </view>

            </view>
        </view>

        <view class="all-read-container">
            <button class="all-read-btn" @tap="markMessagesAsRead(groupedMessagesByType[tabs[activeTab].type])">
                <text class="btn-icon">✔</text> 全部已读
            </button>
        </view>

        <!-- 内容区，横向滑动 -->
        <view class="content-wrapper" :style="contentStyle" >
            <view class="content-page" v-for="(tab, index) in tabs" :key="index">
                
                <view v-if="groupedMessagesByType[tab.type].length === 0" class="no-messages">
                    <text>暂无消息</text>
                </view>

                <view
                    v-for="(group, gIndex) in groupedMessagesByType[tab.type]"
                    :key="gIndex"
                    class="date-group"
                >
                    <view class="date-header">
                        <text class="date-text">{{ group.create_date }}</text>
                    </view>

                    <view class="message-card"
                        v-for="(msg, mIndex) in group.messages"
                        :key="mIndex"
                        @tap="markMessagesAsRead([{ create_date: group.create_date, messages: [msg] }])"
                    >
                        <view class="header">
                            <image class="avatar" :src="msg.actor_avatar" mode="aspectFill" @tap="to_personal_info(msg)" />
                            <view class="message-info">
                                <view>
                                    <text class="username">{{ msg.actor_username || '未知' }}</text>
                                    <text class="text">{{ getMessageText(msg) }}</text>
                                </view>
                                <br />
                                <text class="meta">{{ formatDate(msg.create_time) }} · {{ msg.ip }}</text>
                            </view>
                            <view v-if="!msg.read" class="unread-dot"></view>
                        </view>

                        <text v-if="msg.content && msg.action_type !== 'like'" class="content">{{ msg.content }}</text>

                        <view v-if="msg.target_type === 'post'" class="source-post-card" @tap="to_source_post(msg)">
                            <view class="source-header">
                                <image class="avatar" :src="msg.source_post.avatar" />
                                <view class="user-info">
                                    <text class="username">{{ msg.source_post.username || '未知' }}</text>
                                    <text class="meta">{{ formatDate(msg.source_post.create_time) }} · {{ msg.source_post.ip }}</text>
                                </view>
                            </view>

                            <view class="source-text">
                                <text>{{ msg.source_post.content }}</text>
                            </view>
                        </view>

                        <view v-if="msg.target_type === 'comment'" class="source-comment-card">
                            <text>| {{ msg.source_comment.username || '未知' }}: {{ msg.source_comment.content }}</text>
                        </view> 

                        <view v-if="msg.action_type=='comment' " class="reply-action" @tap.stop="toggleReplyInput(msg)">
                            <text style="color:grey">回复</text>
                        </view>

                        <view v-if="msg.action_type=='comment' && msg.showInput" class="comment-input-wrapper" @tab.stop>
                            <input
                                v-model="newReply"
                                class="comment-input"
                                :placeholder=" '回复' + msg.actor_username  + '...' "
                            />
                            <button class="reply-button" @tap.stop="()=>submitComment(msg,newReply)">回复</button>
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
        </view>
    </view>

</template>

<script>
import PubSub from 'pubsub-js';
    export default {
        data() {
            return {
                user:{
                    account_id: '',
                    ip: '未知'
                },
                tabs: [
                    {
                        icon: '/static/index/赞.png',
                        type: 'like',
                        count: 0
                    },
                    {
                        icon: '/static/index/评论.png',
                        type: 'comment',
                        count: 0
                    },
                    {
                        icon: '/static/index/转发.png',
                        type: 'share',
                        count: 0
                    }
                ],
                activeTab: 0,
                groupedMessagesByType: {
                    like: [],
                    comment: [],
                    share: []
                },
                token: '',
                loading: false,
                loaded: false,
                StartX: '',
                dragging: false,
                translateX: 0,
                windowWidth: 375,
                newReply: '',
                lastShowInput: null,
            }
        },
        computed: {
            currentMessages() {
                return this.groupedMessagesByType[this.tabs[this.activeTab].type];
            },
            contentStyle() {
                const transition = this.dragging ? 'none' : 'transform 0.3s ease';
                return `width: ${this.tabs.length * 100}%; display: flex; transform: translateX(${this.translateX}px); transition: ${transition};`;
            }
        },
        watch:{
            'user.account_id'(){
                console.log('account_id change')
                this.groupedMessagesByType.like = [];
                this.groupedMessagesByType.comment = [];
                this.groupedMessagesByType.share = [];
                this.fetchMessages('like');
                this.fetchMessages('comment');
                this.fetchMessages('share');
            },
            activeTab(){
                this.translateX = -this.windowWidth * this.activeTab;
            },
            tabs:{
                deep: true,
                handler(){
                    if(this.tabs[0].count+this.tabs[1].count+this.tabs[2].count > 0){
                        uni.showTabBarRedDot({
                            index: 1,
                        })
                    }
                    else{
                        uni.hideTabBarRedDot({
                            index: 1,
                        })
                    }
                }
            }
        },
        mounted(){
            uni.getSystemInfo({
                success: res => {
                    this.windowWidth = res.windowWidth;
                    this.translateX = -this.activeTab * res.windowWidth;
                }
            });
        },
        onShow(){
            const app = getApp();
            if(app.userInfo){
                this.user.account_id = app.userInfo.account_id;
                console.log('messges收到用户信息',this.user)
            }
        },
        onPullDownRefresh(){
            if(this.loading) return;
            this.groupedMessagesByType[this.tabs[this.activeTab].type] = [];
            this.fetchMessages(this.tabs[this.activeTab].type).finally(()=>{
                uni.stopPullDownRefresh();
            })
        },
        onReachBottom(){
            console.log('OnreachBottom')
            // 页面滚动到底部时加载更多帖子
            if(this.loading) return; // 如果正在加载或没有更多帖子，直接返回
            this.loading = true; // 设置加载状态
            this.loaded = false; // 设置加载完成状态为 false
            this.fetchMessages(this.activeTab).finally(() => {
                this.loading = false; 
                this.loaded = true; 
                setTimeout(() => {
                this.loaded = false; // 重置加载完成状态
                }, 2000); // 2秒后重置加载完成状态
            }); // 调用加载更多帖子的方法
        },
        methods: {
            async switchTab(tab){
                this.activeTab = tab;
            },
            async fetchMessages(type){
                if(!this.user.account_id){
                    console.log('请登录');
                    return;
                }

                try {
                    const currentType = type;
                    const groupedList = this.groupedMessagesByType[currentType] || [];
                    const len = groupedList.length;

                    const res = await uniCloud.callFunction({
                        name: 'get_messages',
                        data: {
                            account_id: this.user.account_id,
                            type: currentType,
                            create_date: len > 0 ? groupedList[len - 1].create_date : null,
                            day_count: 7
                        }
                    });

                    if (res.result.code === 200) {
                        console.log('收到消息', res.result.data);
                        this.groupedMessagesByType[currentType] = groupedList.concat(res.result.data);
                        this.updateTabCounts();
                    } 
                    else {
                        uni.showToast({
                            title: '获取消息失败',
                            icon: 'none'
                        });
                    }
                } catch (e) {
                    console.log(e);
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
            async markMessagesAsRead(messages){
                console.log('click')
                let update_messages = []
                console.log('messages',messages);
                messages.forEach(group => {
                    const message = group.messages || [];
                    message.forEach(msg => {
                        if(msg.action_type==this.tabs[this.activeTab].type){
                            msg.read = true;
                            update_messages.push(msg)
                        }
                    });
                });
                if(!update_messages){
                    console.log('no_need_update')
                    return;
                }
                try{
                    await uniCloud.callFunction({
                        name:'update_read',
                        data: {
                            messages: update_messages
                        }
                    });
                    this.updateTabCounts();
                }catch(e){
                    console.log(e)
                }
            },
            updateTabCounts() {
                this.tabs[0].count = 0;
                this.tabs[1].count = 0;
                this.tabs[2].count = 0;

                // 遍历所有分组和消息，统计各类型未读消息数量
                Object.values(this.groupedMessagesByType).forEach(groupList => {
                    if (Array.isArray(groupList)) { // 增加数组类型检查
                        groupList.forEach(group => {
                            const messages = group.messages || [];
                            messages.forEach(msg => {
                                if (!msg.read ) {
                                    this.tabs[this.return_index(msg.action_type)].count++;
                                }
                            });
                        });
                    }
                });
            },
            return_index(type){
                if(type === 'like') return 0;
                if(type === 'comment') return 1;
                if(type === 'share') return 2;
            },
            getMessageText(msg) {
                if (msg.target_type === 'post' && msg.action_type === 'like') return '点赞了你的帖子';
                if (msg.target_type === 'comment' && msg.action_type === 'like') return '点赞了你的评论';
                if (msg.target_type === 'post' && msg.action_type === 'comment') return '评论了你的帖子';
                if (msg.target_type === 'comment' && msg.action_type === 'comment') return '回复了你的评论';
                if (msg.target_type === 'post' && msg.action_type === 'share') return '转发了你的帖子';
                return '';
            },
            onTouchStart(e) {
                this.startX = e.touches[0].clientX;
                this.dragging = true;
            },
            onTouchMove(e) {
                if (!this.dragging) return;
                const deltaX = e.touches[0].clientX - this.startX;
                this.translateX = -this.activeTab * this.windowWidth + deltaX;
            },
            onTouchEnd(e) {
                const deltaX = e.changedTouches[0].clientX - this.startX;
                const threshold = this.windowWidth / 4;

                if (deltaX > threshold && this.activeTab > 0) {
                    this.activeTab--;
                } 
                else if (deltaX < -threshold && this.activeTab < Object.keys(this.tabs).length - 1) {
                    this.activeTab++;
                }

                this.translateX = -this.activeTab * this.windowWidth;
                this.dragging = false;
            },
            //转到个人信息页
            to_personal_info(msg){
                const admin = msg.source_post?msg.source_post.admin:msg.source_comment.admin;
                console.log('admin',admin)
                uni.navigateTo({
                    url: `/pages/personal_info/personal_info?account_id=${msg.actor_account_id}&visitor_account_id=${this.user.account_id}&visitor_admin=${admin}`,
                });
            },
            //转到原帖页
            to_source_post(msg){
                uni.navigateTo({
                    url: `/pages/source_post/source_post?post_id=${msg.source_post._id}&account_id=${this.user.account_id}&admin=${msg.source_post.admin}&username=${msg.source_post.username}&avatar=${msg.source_post.avatar}`,
                });
            },
            toggleReplyInput(msg){
                if(this.lastShowInput && this.lastShowInput !== msg){
                    this.lastShowInput.showInput = false;
                }
                msg.showInput = !msg.showInput;
                this.lastShowInput = msg;
                console.log('msg',msg.showInput)
            },
            // 提交评论或回复
            async submitComment(msg,content) {
                if (!content.trim() ) {
                    uni.showToast({ title: '评论不能为空', icon: 'none' });
                    return;
                }
                if(!this.user.account_id){
                    uni.showToast({ title: '请登录', icon: 'none' });
                    return;
                }
                let loading = true;
                if(loading){
                    uni.showToast({
                        title: '评论中...',
                        icon: 'loading'
                    })
                }
                await this.getUserLocation();
                await this.resolve_ip();
                const comment={
                    _id: msg.comment_id,
                    account_id: msg.actor_account_id,
                    content: content,
                }
                const reply={
                    account_id: msg.actor_account_id,
                    username: msg.actor_username,
                    avatar: msg.actor_avatar,
                    content: content,
                }
                
                try {
                    const res = await uniCloud.callFunction({
                    name: 'submit_comment',
                        data:{
                            user: this.user,
                            post: null,
                            comment: comment,
                            reply: reply,
                            type: 1,
                            content: content,
                        } 
                    });
                        
                    if(res.result.msg == "success"){
                        msg.showInput = false; // 隐藏输入框
                        this.newReply = ''; // 清空输入框内容
                        loading = false;
                        uni.showToast({ title: '评论成功', icon: 'success' });
                    } 
                }catch (error) {
                    uni.showToast({ title: '评论失败', icon: 'none' }); 
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
        }
    }
</script>

<style scoped>
@import url(message.css)
</style>