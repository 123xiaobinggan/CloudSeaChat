<template>
  <view class="login-container">
    <input v-model="userInfo.account_id" placeholder="ID(2-13个字符)" class="input-field" />
    <input v-model="userInfo.password" type="password" placeholder="密码" class="input-field" />
    <button @tap="handleLogin" class="login-button">登录</button>
    <view class="register-link" @tap="goToRegister">没有账号？去注册</view>
  </view>
</template>

<script >
export default {
  data() {
    return {
      userInfo:{
        account_id: '',
        username: '',
        password: '',
        description: '茶里茶气的生活家',
        avatar: '/static/info/头像.png',
        level: 2,
        activity: 24,
        coupon: 0,
        points: 24,
        balance: 99.9
      },
      loading: false
    }
  },
  watch:{
    loading(val){
      if(val){
        uni.showLoading({ title: '登录中...' })
      }else{
        uni.hideLoading()
      }
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      try {
        const res = await uniCloud.callFunction({
          name: 'login_register',
          data: {
            action: 'login',
            account_id: this.userInfo.account_id,
			      username: '',
            password: this.userInfo.password,
            has_token: false
          }
        })

        if (res.result.code === 200) {
          const app = getApp();
          app.userInfo = res.result.userInfo;
          app.login_status = true;
          uni.setStorageSync('uid', res.result.userInfo.account_id);
          this.loading = false;
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/my_info/my_info' })
          }, 1000)
        } else {
          uni.showToast({ title: res.result.msg, icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '登录失败', icon: 'none' })
        console.error(e)
      }finally{
        this.loading = false;
      }
    },
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      })
    },
  }
}
</script>

<style>
@import url(login.css);
</style>