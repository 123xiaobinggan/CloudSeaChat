<template>
  <view class="register-container">
    <input v-model="userInfo.account_id" placeholder="ID(2-13个字符)" class="input-field" />
    <input v-model="userInfo.username" placeholder="用户名" class="input-field" />
    <input v-model="userInfo.password" type="password" placeholder="密码" class="input-field" />
    <button @tap="handleRegister" class="register-button">注册</button>
    <view class="login-link" @tap="goToLogin">已有账号？去登录</view>
  </view>
</template>

<script>
import PubSub from 'pubsub-js';
export default {
  data() {
    return {
      userInfo: {
        username: '',
        account_id: '',
        password: '',
        description: '这个人很懒，什么都没有留下',
        avatar: '/static/info/未登录.png',
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
      },
      loading : false,
    }
  },
  watch:{
    loading(val){
      if(val){
        uni.showLoading({ title: '注册中...', mask: true });
      }else{
        uni.hideLoading();
      }
    }
  },
  methods: {
    async handleRegister() {
      console.log('register')
      if (!this.userInfo.password || !this.userInfo.username || !this.userInfo.account_id) {
        uni.showToast({ title: '用户名或密码不能为空', icon: 'none' })
        return;
      }
      if(this.userInfo.account_id.length < 2 || this.userInfo.account_id.length > 8) {
        uni.showToast({ title: '账号长度需在2-8个字符之间', icon: 'none' })
        return;
      } 
      if(this.userInfo.username.length < 2 || this.userInfo.username.length > 10) {
        uni.showToast({ title: '用户名长度需在2-10个字符之间', icon: 'none' })
        return;
      }
      if (this.userInfo.password.length < 6 || this.userInfo.password.length > 16) {
        uni.showToast({ title: '密码长度需在6-16个字符之间', icon: 'none' })
        return;
      }
      this.loading = true;
      try {
        const res = await uniCloud.callFunction({
          name: 'login_register',
          data: {
            action: 'register',
            account_id: this.userInfo.account_id,
            username: this.userInfo.username,
            password: this.userInfo.password,
            has_token: false
          }
        });

        if (res.result.code === 200) {
          // PubSub.publish('Register', res.result);
          const app = getApp();
          app.userInfo = res.result.userInfo;
          app.login_status = true;
          uni.setStorageSync('uid', res.result.userInfo.account_id);
          this.loading = false;
          uni.showToast({ title: '注册成功', icon:'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/my_info/my_info' })
          },1000)
        } else {
          uni.showToast({ title: res.result.msg, icon: 'none'})
        }
      } catch (e) {
        uni.showToast({ title: '注册失败', icon: 'none' })
        console.error(e)
      }finally {
        this.loading = false;
      }
    },
    goToLogin() {
      uni.switchTab({
        url: '/pages/login/login'
      })
    }
  }
}
</script>

<style>
@import url(register.css);
</style>