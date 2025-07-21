<template>
  <view class="content">
    <image class="background-image" :src="'/static/info/background.png'" mode="aspectFill" />
    <view class="profile-card">
      <view class="header">
        <image class="avatar" :src="userInfo.avatar" mode="aspectFill" @tap="to_detail" />
        <view class="user-main">
          <view class="nickname-and-tags">
            <text class="nickname">{{ userInfo.username }}</text>
            <view class="account_id-and-tags">
              <text class="account-id">ID: {{ userInfo.account_id }}</text>
              <view class="level-and-activity">
                <text class="level-tag">V{{ userInfo.level }}</text>
                <text class="activity">活力值 {{ userInfo.activity }}</text>
              </view>
            </view>
          </view>
          <text class="desc">{{userInfo.description}}</text>
        </view>
        <!-- 编辑 -->
        <view class="edit-btn" v-show="login_status" @tap="goToEdit">
            <image src="/static/info/edit.png" mode="aspectFit" />
        </view>
      </view>
      <!-- 登录 -->
      <button class="login-btn" v-show="!login_status" @tap="login">立即登录</button>
      <button class="login-btn" v-show="login_status" @tap="logout">退出登录</button>

      <view class="stats">
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.coupon }}</text>
          <text class="stat-label">优惠券</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.points }}</text>
          <text class="stat-label">我的积分</text>
        </view>
        <view class="stat-item" @tap="deposit">
          <text class="stat-value">{{ userInfo.balance }}</text>
          <text class="stat-label">余额</text>
        </view>
      </view>

      <view class="progress-text">
        距离升级还差 {{ 100-userInfo.activity%100 }} 活力值
      </view>
      <view class="progress-bar">
        <view class="progress-inner" :style="'width:' + userInfo.activity + '%'"></view>
      </view>
    </view>
    <view class="meteor-container">
      <view
        v-for="meteor in meteors"
        :key="meteor.id"
        class="meteor"
        :style="meteor.style"
      />
    </view>
  </view>
</template>

<script>
import PubSub from 'pubsub-js';
 export default {
   data() {
     return {
       meteors: [],
       meteorId: 0,
       userInfo: {
        account_id: '',
        username: '未登录',
        description: '这个人很懒，什么都没有留下',
        avatar: '/static/info/not_login.png',
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
        admin: false 
       },
       login_status: false,
       token: ''
     };
   },
   watch:{
   },
   onShow() {
    setTimeout(() => {
      const app = getApp();
      if(app.userInfo) {
        Object.assign(this.userInfo,app.userInfo);
        this.login_status = app.login_status;
        if(this.userInfo.unread_messages>0){
          uni.showTabBarRedDot({
            index: 1,
          });
        }
      }
      console.log('onShow',this.userInfo);
    }, 100);
   },
   moundted(){
    this.startMeteorShower();
   },
   methods: {
     goToEdit() { 
      uni.navigateTo({
        url: `/pages/edit/edit`,
      });
     },
     to_detail(){
      uni.showActionSheet({
        itemList: ['编辑资料','个人主页'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.goToEdit();
          }
          else if (res.tapIndex === 1) {
            uni.navigateTo({
              url: `/pages/personal_info/personal_info?account_id=${this.userInfo.account_id}&visitor_account_id=${this.userInfo.account_id}&visitor_admin=${this.userInfo.admin}`,
            });
          }
        }
      });
     },
     startMeteorShower() {
       setInterval(() => {
         const id = this.meteorId++;
         const startLeft = Math.random() * 100;
         const startTop = Math.random() * 100;
         const length = 100 + Math.random() * 100;
         const opacity = 0.3 + Math.random() * 0.5;
         const duration = 0.5 + Math.random();
   
         const color = ['#fff', '#bde2ff', '#f0c9ff'][Math.floor(Math.random() * 3)];
   
         this.meteors.push({
           id,
           style: `
             left: ${startLeft}%;
             top: ${startTop}%;
             width: ${length}rpx;
             height: 2rpx;
             opacity: ${opacity};
             background: linear-gradient(to right, ${color}, transparent);
             animation: meteor-fly ${duration}s linear forwards;
           `
         });
   
         setTimeout(() => {
           this.meteors = this.meteors.filter(m => m.id !== id);
         }, duration * 1000);
       }, 300);
     },
     login() {
       uni.navigateTo({
           url: '/pages/login/login'
         })
     },
     logout() {
      uni.showToast({ title: '退出登录', icon:'success' })
      this.login_status = false
      this.userInfo = {
        username: '未登录',
        account_id: '',
        description: '这个人很懒，什么都没有留下',
        avatar: '/static/info/not_login.png',
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
        admin: false
      },
      uni.removeStorageSync('uid');
      const app = getApp();
      app.userInfo = this.userInfo;
      app.login_status = this.login_status;
      uni.hideTabBarRedDot({
        index: 1,
      });
     },
     deposit(){
      uni.navigateTo({
        url: "/pages/deposit/deposit"
      })
     }
   }
 };
</script>

<style lang="scss" scoped>
@import url(my_info.css);
</style>