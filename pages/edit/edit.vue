<template>
  <view class="edit-container">
    <view class="avatar-upload">
      <image class="avatar" :src="userInfo.avatar" mode="aspectFill" @tap="previewAvatar(userInfo.avatar)" />
      <button class="upload-btn" @tap="chooseAvatar">更换头像</button>
    </view>
    
    <input v-model="userInfo.username" placeholder="用户名" class="input-field" />
    <input v-model="userInfo.description" placeholder="个人简介" class="input-field" />
    <input v-model="userInfo.oldPassword" type="password" placeholder="原密码" class="input-field" />
    <input v-model="userInfo.password" type="password" placeholder="新密码" class="input-field" />
    <input v-model="userInfo.confirmPassword" type="password" placeholder="确认密码" class="input-field" />
    
    <button class="save-btn" @tap="saveProfile">保存修改</button>
  </view>
</template>

<script>
import PubSub from 'pubsub-js';
export default {
  data() {
    return {
      userInfo: {
        account_id: '',
        username: '',
        description: '',
        avatar: '/static/info/头像.png',
        oldPassword: '',
        password: '',
        confirmPassword: ''
      },
      avatar_change: false, // 是否更换头像
      token: '', // 用于订阅
    }
  },
  methods: {
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.userInfo.avatar = res.tempFilePaths[0]
          this.avatar_change = true;
        }
      })
    },
    async saveProfile() 
    {
      if(this.userInfo.password){
          if (!this.userInfo.oldPassword) 
          {
              uni.showToast({ title: '请输入原密码', icon: 'none' })
              return
          }
          
          if (this.userInfo.password !== this.userInfo.confirmPassword) 
          {
              uni.showToast({ title: '两次密码不一致', icon: 'none' })
              return
          }
      }
      try {
        if(this.avatar_change){
              const ext = this.userInfo.avatar.split('.').pop().toLowerCase();
              const cloudPath = `User/${this.userInfo.account_id}-${this.userInfo.username}-${new Date().toISOString()}.${ext}`;
              try{
                const uploadRes = await uniCloud.uploadFile({
                  filePath: this.userInfo.avatar,
                  cloudPath,
                  fileType: ext,
                  cloudPathAsRealPath: true,
                  onUploadProgress: (progress) => {
                  // 显示上传进度
                      var percentage = Math.round(progress.loaded * 100)/progress.total;
                      uni.showLoading({ title: `上传中...${percentage}%` });
                  }
                });
                this.userInfo.avatar = uploadRes.fileID;
              }catch(err){
                uni.showToast({ title: '图片上传失败', icon: 'none' });
                return
              }
        }
        const res = await uniCloud.callFunction({
        name: 'update_userInfo',
        data: {
            old_avatar: this.old_avatar,
            userInfo:{
              ...this.userInfo
            }
        }
        })
        if (res.result.code === 0) {
          const app = getApp();
          app.userInfo = res.result.data;
          uni.showToast({ title: '保存成功', icon: 'success' })
          uni.navigateBack()
        } else {
        uni.showToast({ title: res.result.msg, icon: 'none' })
        }
      }catch (e) {
          uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },
    previewAvatar(url){
      uni.previewImage({
        urls: [url],
        current: url
      })
    }
  },
  onLoad(){
    const app = getApp();
    this.userInfo = app.userInfo;
    this.userInfo.oldPassword = '';
    this.userInfo.password = '';
    this.userInfo.confirmPassword = '';
  }
}
</script>

<style>
@import url('/pages/edit/edit.css');
</style>