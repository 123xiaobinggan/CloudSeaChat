"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        account_id: "",
        username: "",
        password: "",
        description: "茶里茶气的生活家",
        avatar: "/static/info/头像.png",
        level: 2,
        activity: 24,
        coupon: 0,
        points: 24,
        balance: 99.9
      },
      loading: false
    };
  },
  watch: {
    loading(val) {
      if (val) {
        common_vendor.index.showLoading({ title: "登录中..." });
      } else {
        common_vendor.index.hideLoading();
      }
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "login_register",
          data: {
            action: "login",
            account_id: this.userInfo.account_id,
            username: "",
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
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          setTimeout(() => {
            common_vendor.index.switchTab({ url: "/pages/my_info/my_info" });
          }, 1e3);
        } else {
          common_vendor.index.showToast({ title: res.result.msg, icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "登录失败", icon: "none" });
        common_vendor.index.__f__("error", "at pages/login/login.vue:68", e);
      } finally {
        this.loading = false;
      }
    },
    goToRegister() {
      common_vendor.index.navigateTo({
        url: "/pages/register/register"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.userInfo.account_id,
    b: common_vendor.o(($event) => $data.userInfo.account_id = $event.detail.value),
    c: $data.userInfo.password,
    d: common_vendor.o(($event) => $data.userInfo.password = $event.detail.value),
    e: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    f: common_vendor.o((...args) => $options.goToRegister && $options.goToRegister(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
