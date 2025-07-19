<template>
    <view class="post-page">
      <!-- 顶部栏 -->
      <view class="nav-bar">
        <text class="title">创作</text>
        <button class="publish-btn" size="mini" @tap="submitPost()">发表</button>
      </view>
  
      <!-- 内容输入框 -->
      <view class="content-card">
        <textarea
          v-model="content"
          class="content-input"
          :placeholder="'分享新鲜事...'"
          maxlength="500"
        />
        <!-- 媒体区域 -->
        <view v-if="type === 0">
          <view class="media-grid">
            <view
              v-for="(media, index) in mediaFiles"
              :key="index"
              class="media-item"
              @tap="()=>previewMedia(mediaFiles,index)"
            >
              <image v-if="media.type === 'image'" :src="media.url" class="post-media" mode="aspectFill" />
              <video v-else-if="media.type === 'video'" :src="media.url" class="post-media" controls />
              <!-- 删除按钮 -->
              <view class="delete-btn" @tap.stop="()=>removeMedia(index)">×</view>
            </view>
            <!-- 添加媒体按钮 -->
            <view
              v-if="mediaFiles.length < 9"
              class="media-item add-media"
              @tap="showMediaPicker"
            >
              <image src="/static/post/add_media.png" class="add-icon" />
              <text>图片/视频</text>
            </view>
          </view>
        </view>
        <!--如果是转发-->
        <view v-else>
          <view class="source-post-card">
            <view class="source-header">
              <image :src="source_post.avatar" class="avatar" mode="aspectFill" />
              <view class="user-info">
                <text class="username">{{ source_post.username }}</text>
                <br/>
                <text class="meta">{{ formatDate(source_post.create_time) }} · {{ source_post.ip }}</text>
              </view>
            </view>
            <view class="source-content">
              <view class="source-text">
                <text>{{ source_post.content }}</text>
              </view>
              <view
                v-if="Array.isArray(source_post.media) && source_post.media.length"
                :class="['media-grid', 'media-count-' + source_post.media.length]"
              >
                <view
                  v-for="(media, mediaIndex) in source_post.media"
                  :key="mediaIndex"
                  class="media-item"
                  @tap="()=>previewMedia(source_post.media,mediaIndex)"
                >
                  <image v-if="media.type === 'image'" :src="media.url" class="post-media" mode="aspectFill" />
                  <video v-else-if="media.type === 'video'" :src="media.url" class="post-media" controls />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
  
      <!-- 功能区 -->
      <view class="options-card">
        <view class="option-item">
          <text>添加标签</text>
        </view>
        <view class="option-item">
          <text>添加地点</text>
        </view>
      </view>
  
      <!-- 权限和定时 -->
      <view class="options-card">
        <view class="option-item">
          <text>权限设置</text>
          <picker mode="selector" :range="permissionOptions" @change="onPermissionChange">
            <text class="option-value">{{ permissionText }}</text>
          </picker>
        </view>
      </view>
    </view>
</template>
  
  
<script>
import PubSub from 'pubsub-js';
  export default {
    data() {
      return {
        content: '',
        mediaFiles: [], // 存储图片和视频
        type: 0,
        source_post:{},
        permissionText: '所有人可见',
        permissionOptions: ['所有人可见', '仅我可见'],
        user:{
          account_id: null,
          username: '未登录',
          avatar: '',
          ip:'未知'
        },
        subtoken:null,
        loading:false,
      };
    },
    watch: {
      loading(newVal, oldVal) {
        if(newVal == true){
          uni.showLoading({ title: '正在发布...' });
        }
      }
    },
    onLoad() {
      this.subtoken=PubSub.subscribe('to_post', (msg, data) => {
        this.user.account_id = data.account_id; 
        this.user.username = data.username;
        this.user.avatar = data.avatar;
        this.type = data.type;
        if(data.share_post){
          this.source_post = data.share_post;
        }
        console.log('to_post',this.source_post,this.user);
      });
    },
    onUnload() {
      if(this.subtoken) {
        PubSub.unsubscribe(this.subtoken);
        this.subtoken = null;
      }
    },
    methods: {
      // 选择媒体类型
      showMediaPicker() {
        uni.showActionSheet({
          itemList: ['照片', '视频'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.chooseImage();
            } else if (res.tapIndex === 1) {
              this.chooseVideo();
            }
          }
        });
      },
      // 选择图片
      chooseImage() {
        uni.chooseImage({
          count: 9 - this.mediaFiles.length,
          sourceType: ['album', 'camera'],
          success: (res) => {
            res.tempFilePaths.forEach((filePath) => {
              this.mediaFiles.push({
                url: filePath,
                type: 'image'
              });
            });
          }
        });
      },
      // 选择视频
      chooseVideo() {
        uni.chooseVideo({
          count: 9 - this.mediaFiles.length,
          sourceType: ['album', 'camera'],
          duration: 30,
          success: (res) => {
            if (this.mediaFiles.length < 9) {
              this.mediaFiles.push({
                url: res.tempFilePath,
                type: 'video'
              });
            } else {
              uni.showToast({ title: '最多只能上传9个媒体文件', icon: 'none' });
            }
          }
        });
      },
      // 预览媒体文件
      previewMedia(media,index) {
        uni.previewMedia({
          sources: media.map((file) => ({ 
            url: file.url, 
            type: file.type 
          })),
          current: index
        });
      },
      // 删除媒体文件
      removeMedia(index) {
        this.mediaFiles.splice(index, 1); // 删除选中的媒体
      },
      // 改变权限
      onPermissionChange(e) {
        this.permissionText = this.permissionOptions[e.detail.value];
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
      //提交帖子
      async submitPost(){
        if(this.loading){
          return;
        }
        if(!this.user.account_id){
          uni.showToast({
            title: '请登录',
            icon: 'none'
          });
          return;
        }
        if (!this.content.trim() && this.mediaFiles.length === 0) {
          uni.showToast({
            title: '内容不能为空',
            icon: 'none'
          });
          return;
        } 
        this.loading = true;

        if (this.mediaFiles.length) {
          this.mediaFiles = await Promise.all(this.mediaFiles.map(async (file) => {
            try {
              const ext = file.url.split('.').pop().toLowerCase(); // 自动取原扩展名
              const cloudPath = `Post/${this.user.account_id}-${this.user.username}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
              const res = await uniCloud.uploadFile({
                filePath: file.url,
                cloudPath,
                fileType: file.type,
                cloudPathAsRealPath: true,
                onUploadProgress: (progress) => {
                  var percentage = Math.round(progress.loaded * 100)/progress.total;
                  uni.showLoading({ title: `上传中...${percentage}%` });
                },
                header:{
                  'Cache-Control':'max-age=2592000'
                }
              });
              return {
                url: res.fileID, // 云端路径
                type: file.type
              };
            } catch (e) {
              console.error('文件上传失败', file.url, e);
              return null; // 或抛出异常 / 提示用户
            }
          }));
          // 过滤掉上传失败的
          this.mediaFiles = this.mediaFiles.filter(item => item !== null);
        }

        //获取ip地址
        await this.getUserLocation();
        //解析ip地址
        await this.resolve_ip();

        try{
          const res = await uniCloud.callFunction({
            name: 'post',
            data: {
                user:this.user,
                content: this.content,
                media: this.mediaFiles,
                post_type: this.type,
                temp_source_post: this.source_post,
                visibility: this.permissionText,
                create_time: new Date().toISOString(),
                ip: this.user.ip,
                tags: [],
                status: 1
            }
          });
          
          if(res.result.code === 200){
              uni.showToast({
                  title: '发布成功',
                  icon: 'success'
              });
              PubSub.publish('return_index', res.result.data);
              setTimeout(() => {
                uni.navigateBack();
                this.loading = false;
              }, 500);
          } 
          else if(res.result.code === 401){
              uni.showToast({
                  title: '请登录',
                  icon: 'none'
              });
              this.loading = false;
          }
          else{
              uni.showToast({
                  title: '发布失败',
                  icon: 'none'
              });
              this.loading = false;
              console.log('发布失败',res.result);
          }
        }catch(e){
          console.error('发布失败', e);
          uni.showToast({
            title: '发布失败',
            icon: 'none'
          });
          this.loading = false;
        }
      },
      //时间格式化函数
      formatDate(date) {
        date= new Date(date);
        const pad = n => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      },
    }
  }
</script>
  
<style scoped>
@import url('post.css');
</style>