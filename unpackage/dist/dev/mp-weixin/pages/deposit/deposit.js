"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        account_id: "",
        username: "未登录",
        avatar: "/static/info/未登录.png"
      },
      keys: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"
      ],
      rechargeAmount: "",
      // 当前充值金额
      isInputFocused: false,
      // 输入框是否获得焦点
      hasInput: false,
      // 是否有输入
      activeiIndex: -1
      // 当前激活的按键索引
    };
  },
  watch: {
    rechargeAmount() {
      this.isInputFocused = true;
      this.hasInput = this.rechargeAmount.toString().trim() !== "" && this.rechargeAmount > 0;
    }
  },
  onLoad() {
    const app = getApp();
    this.userInfo = app.userInfo;
    this.isInputFocused = true;
  },
  methods: {
    handleKeyPress(key) {
      this.triggerVibrate();
      this.isInputFocused = true;
      if (this.rechargeAmount.includes(".")) {
        const decimalPart = this.rechargeAmount.split(".")[1];
        if (decimalPart.length >= 2 || key === ".") {
          return;
        }
      }
      if (key === "." && this.rechargeAmount === "") {
        this.rechargeAmount = "0";
      }
      this.rechargeAmount += key;
    },
    handleBackspace() {
      this.triggerVibrate();
      this.rechargeAmount = this.rechargeAmount.slice(0, -1);
    },
    handleBodyTap() {
      this.isInputFocused = false;
    },
    setActive(index) {
      this.activeiIndex = index;
    },
    removeActive() {
      this.activeiIndex = -1;
    },
    async handleDeposit() {
      this.triggerVibrate();
      const amount = parseFloat(parseFloat(this.rechargeAmount).toFixed(2));
      if (amount <= 0) {
        common_vendor.index.showToast({ title: "充值金额必须大于0", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "充值中..." });
      common_vendor.index.__f__("log", "at pages/deposit/deposit.vue:171", "充值金额", amount, "元");
      const res = await common_vendor.tr.callFunction({
        name: "deposit",
        data: {
          account_id: this.userInfo.account_id,
          amount
        }
      });
      if (res.result.code === 200) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "充值成功", icon: "success" });
        const app = getApp();
        app.userInfo.balance += amount;
        app.userInfo.balance = parseFloat(parseFloat(app.userInfo.balance).toFixed(2));
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1e3);
      } else {
        common_vendor.index.showToast({ title: "充值失败", icon: "none" });
      }
      common_vendor.index.hideLoading();
    },
    triggerVibrate() {
      common_vendor.index.vibrateShort();
      setTimeout(() => {
        common_vendor.index.vibrateShort();
      }, 10);
      setTimeout(() => {
        common_vendor.index.vibrateShort();
      }, 20);
      setTimeout(() => {
        common_vendor.index.vibrateShort();
      }, 30);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.userInfo.username),
    b: common_vendor.t($data.userInfo.account_id),
    c: $data.userInfo.avatar,
    d: common_vendor.o((...args) => $options.handleBodyTap && $options.handleBodyTap(...args)),
    e: common_assets._imports_0$4,
    f: common_vendor.t($data.rechargeAmount),
    g: $data.isInputFocused
  }, $data.isInputFocused ? {} : {}, {
    h: common_vendor.o(($event) => $data.isInputFocused = true),
    i: common_vendor.f($data.keys, (key, index, i0) => {
      return {
        a: common_vendor.t(key),
        b: index,
        c: $data.activeiIndex === index ? 1 : "",
        d: common_vendor.o(($event) => $options.handleKeyPress(key), index),
        e: common_vendor.o(($event) => $options.setActive(index), index),
        f: common_vendor.o(($event) => $options.removeActive(index), index)
      };
    }),
    j: $data.activeiIndex === "0" ? 1 : "",
    k: common_vendor.o(($event) => $options.handleKeyPress("0")),
    l: common_vendor.o(($event) => $options.setActive("0")),
    m: common_vendor.o(($event) => $options.removeActive("0")),
    n: $data.activeiIndex === "." ? 1 : "",
    o: common_vendor.o(($event) => $options.handleKeyPress(".")),
    p: common_vendor.o(($event) => $options.setActive(".")),
    q: common_vendor.o(($event) => $options.removeActive(".")),
    r: common_assets._imports_1$2,
    s: $data.activeiIndex === "back" ? 1 : "",
    t: common_vendor.o((...args) => $options.handleBackspace && $options.handleBackspace(...args)),
    v: common_vendor.o(($event) => $options.setActive("back")),
    w: common_vendor.o(($event) => $options.removeActive("back")),
    x: $data.isInputFocused,
    y: !$data.isInputFocused ? 1 : "",
    z: common_vendor.o(() => {
    }),
    A: $data.hasInput ? 1 : "",
    B: $data.activeiIndex === "deposit" ? 1 : "",
    C: $data.isInputFocused ? 1 : "",
    D: common_vendor.o((...args) => $options.handleDeposit && $options.handleDeposit(...args)),
    E: common_vendor.o(($event) => $options.setActive("deposit")),
    F: common_vendor.o(($event) => $options.removeActive("deposit")),
    G: common_vendor.o((...args) => $options.handleBodyTap && $options.handleBodyTap(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-41eeec45"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/deposit/deposit.js.map
