"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        username: "",
        account_id: "",
        password: "",
        description: "这个人很懒，什么都没有留下",
        avatar: "/static/info/未登录.png",
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0
      },
      loading: false
    };
  },
  watch: {
    loading(val) {
      if (val) {
        common_vendor.index.showLoading({ title: "注册中...", mask: true });
      } else {
        common_vendor.index.hideLoading();
      }
    }
  },
  methods: {
    async handleRegister() {
      common_vendor.index.__f__("log", "at pages/register/register.vue:42", "register");
      if (!this.userInfo.password || !this.userInfo.username || !this.userInfo.account_id) {
        common_vendor.index.showToast({ title: "用户名或密码不能为空", icon: "none" });
        return;
      }
      if (this.userInfo.account_id.length < 2 || this.userInfo.account_id.length > 8) {
        common_vendor.index.showToast({ title: "账号长度需在2-8个字符之间", icon: "none" });
        return;
      }
      if (this.userInfo.username.length < 2 || this.userInfo.username.length > 10) {
        common_vendor.index.showToast({ title: "用户名长度需在2-10个字符之间", icon: "none" });
        return;
      }
      if (this.userInfo.password.length < 6 || this.userInfo.password.length > 16) {
        common_vendor.index.showToast({ title: "密码长度需在6-16个字符之间", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "login_register",
          data: {
            action: "register",
            account_id: this.userInfo.account_id,
            username: this.userInfo.username,
            password: this.userInfo.password,
            has_token: false
          }
        });
        if (res.result.code === 200) {
          const app = getApp();
          app.userInfo = res.result.userInfo;
          app.login_status = true;
          common_vendor.index.setStorageSync("uid", res.result.userInfo.account_id);
          this.loading = false;
          common_vendor.index.showToast({ title: "注册成功", icon: "success" });
          setTimeout(() => {
            common_vendor.index.switchTab({ url: "/pages/my_info/my_info" });
          }, 1e3);
        } else {
          common_vendor.index.showToast({ title: res.result.msg, icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "注册失败", icon: "none" });
        common_vendor.index.__f__("error", "at pages/register/register.vue:88", e);
      } finally {
        this.loading = false;
      }
    },
    goToLogin() {
      common_vendor.index.switchTab({
        url: "/pages/login/login"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.userInfo.account_id,
    b: common_vendor.o(($event) => $data.userInfo.account_id = $event.detail.value),
    c: $data.userInfo.username,
    d: common_vendor.o(($event) => $data.userInfo.username = $event.detail.value),
    e: $data.userInfo.password,
    f: common_vendor.o(($event) => $data.userInfo.password = $event.detail.value),
    g: common_vendor.o((...args) => $options.handleRegister && $options.handleRegister(...args)),
    h: common_vendor.o((...args) => $options.goToLogin && $options.goToLogin(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/register.js.map
