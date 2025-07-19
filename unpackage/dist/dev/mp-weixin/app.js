"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/post/post.js";
  "./pages/my_info/my_info.js";
  "./pages/login/login.js";
  "./pages/register/register.js";
  "./pages/edit/edit.js";
  "./pages/source_post/source_post.js";
  "./pages/personal_info/personal_info.js";
  "./pages/message/message.js";
  "./pages/deposit/deposit.js";
}
const _sfc_main = {
  data() {
    return {
      userInfo: {
        account_id: null,
        username: "未登录",
        // 保持逗号
        description: "这个人很懒，什么都没有留下",
        avatar: "/static/info/未登录.png",
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
        ip: "",
        admin: false
        // 是否为管理员
      },
      login_status: false,
      // 登录状态
      activityTimer: null,
      // 定时器
      activityStartTime: null,
      // 启动时间戳（ms）
      activityElapsedSeconds: 0
      // 已累计时间（秒）
    };
  },
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:27", "App Launch");
    common_vendor.PubSub.subscribe("remind_upgrade", (msg, level) => {
      common_vendor.index.__f__("log", "at App.vue:29", "收到升级提醒", level);
      common_vendor.index.showModal({
        title: `升级了`,
        content: `🎉 恭喜你升级到 V${level}`,
        showCancel: false,
        confirmText: "知道了"
      });
    });
    common_vendor.PubSub.subscribe("update_activity", async (msg, activity) => {
      const app = getApp();
      if (!app.userInfo.account_id) {
        common_vendor.index.__f__("log", "at App.vue:40", "未登录，跳过更新活动值");
        return;
      }
      app.userInfo.activity += activity;
      if (app.userInfo.activity >= 100) {
        app.userInfo.activity %= 100;
        app.userInfo.level += 1;
        common_vendor.index.__f__("log", "at App.vue:47", " 升级了");
        common_vendor.PubSub.publish("remind_upgrade", app.userInfo.level);
      }
      try {
        await common_vendor.tr.callFunction({
          name: "update_activity",
          data: {
            account_id: app.userInfo.account_id,
            level: app.userInfo.level,
            activity: app.userInfo.activity
          }
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:60", e);
      }
    });
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:65", "App Show");
    this.activityStartTime = Date.now();
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    this.activityTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.activityStartTime) / 1e3);
      if (elapsed > this.activityElapsedSeconds) {
        const diff = elapsed - this.activityElapsedSeconds;
        this.activityElapsedSeconds = elapsed;
        const addedActivity = Math.floor(diff / 60);
        if (addedActivity > 0) {
          const app = getApp();
          if (app.userInfo.account_id) {
            common_vendor.PubSub.publish("update_activity", addedActivity);
          }
        }
      }
    }, 6e4);
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:99", "App Hide");
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
