"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      meteors: [],
      meteorId: 0,
      userInfo: {
        account_id: "",
        username: "未登录",
        description: "这个人很懒，什么都没有留下",
        avatar: "/static/info/未登录.png",
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
        admin: false
      },
      login_status: false,
      token: ""
    };
  },
  watch: {},
  onShow() {
    setTimeout(() => {
      const app = getApp();
      if (app.userInfo) {
        Object.assign(this.userInfo, app.userInfo);
        this.login_status = app.login_status;
        if (this.userInfo.unread_messages) {
          common_vendor.index.showTabBarRedDot({
            index: 1
          });
        }
      }
      common_vendor.index.__f__("log", "at pages/my_info/my_info.vue:99", "onShow", this.userInfo);
    }, 100);
  },
  moundted() {
    this.startMeteorShower();
  },
  onLoad() {
  },
  onUnload() {
    if (this.token) {
      common_vendor.PubSub.unsubscribe(this.token);
      this.token = null;
    }
  },
  methods: {
    goToEdit() {
      common_vendor.index.navigateTo({
        url: `/pages/edit/edit`
      });
    },
    to_detail() {
      common_vendor.index.showActionSheet({
        itemList: ["编辑资料", "个人主页"],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.goToEdit();
          } else if (res.tapIndex === 1) {
            common_vendor.index.navigateTo({
              url: `/pages/personal_info/personal_info?account_id=${this.userInfo.account_id}&visitor_account_id=${this.userInfo.account_id}&visitor_admin=${this.userInfo.admin}`
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
        const color = ["#fff", "#bde2ff", "#f0c9ff"][Math.floor(Math.random() * 3)];
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
          this.meteors = this.meteors.filter((m) => m.id !== id);
        }, duration * 1e3);
      }, 300);
    },
    login() {
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    },
    logout() {
      common_vendor.index.showToast({ title: "退出登录", icon: "success" });
      this.login_status = false;
      this.userInfo = {
        username: "未登录",
        account_id: "",
        description: "这个人很懒，什么都没有留下",
        avatar: "/static/info/未登录.png",
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
        admin: false
      }, common_vendor.index.removeStorageSync("uid");
      const app = getApp();
      app.userInfo = this.userInfo;
      app.login_status = this.login_status;
      common_vendor.index.hideTabBarRedDot({
        index: 1
      });
    },
    deposit() {
      common_vendor.index.navigateTo({
        url: "/pages/deposit/deposit"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.userInfo.avatar,
    b: common_vendor.o((...args) => $options.to_detail && $options.to_detail(...args)),
    c: common_vendor.t($data.userInfo.username),
    d: common_vendor.t($data.userInfo.account_id),
    e: common_vendor.t($data.userInfo.level),
    f: common_vendor.t($data.userInfo.activity),
    g: common_vendor.t($data.userInfo.description),
    h: common_assets._imports_0$2,
    i: $data.login_status,
    j: common_vendor.o((...args) => $options.goToEdit && $options.goToEdit(...args)),
    k: !$data.login_status,
    l: common_vendor.o((...args) => $options.login && $options.login(...args)),
    m: $data.login_status,
    n: common_vendor.o((...args) => $options.logout && $options.logout(...args)),
    o: common_vendor.t($data.userInfo.coupon),
    p: common_vendor.t($data.userInfo.points),
    q: common_vendor.t($data.userInfo.balance),
    r: common_vendor.o((...args) => $options.deposit && $options.deposit(...args)),
    s: common_vendor.t(100 - $data.userInfo.activity % 100),
    t: common_vendor.s("width:" + $data.userInfo.activity + "%"),
    v: common_vendor.f($data.meteors, (meteor, k0, i0) => {
      return {
        a: meteor.id,
        b: common_vendor.s(meteor.style)
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-654c880c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my_info/my_info.js.map
