"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        account_id: "",
        username: "",
        description: "",
        avatar: "/static/info/头像.png",
        oldPassword: "",
        password: "",
        confirmPassword: ""
      },
      avatar_change: false,
      // 是否更换头像
      token: ""
      // 用于订阅
    };
  },
  methods: {
    chooseAvatar() {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          this.userInfo.avatar = res.tempFilePaths[0];
          this.avatar_change = true;
        }
      });
    },
    async saveProfile() {
      if (this.userInfo.password) {
        if (!this.userInfo.oldPassword) {
          common_vendor.index.showToast({ title: "请输入原密码", icon: "none" });
          return;
        }
        if (this.userInfo.password !== this.userInfo.confirmPassword) {
          common_vendor.index.showToast({ title: "两次密码不一致", icon: "none" });
          return;
        }
      }
      try {
        if (this.avatar_change) {
          const ext = this.userInfo.avatar.split(".").pop().toLowerCase();
          const cloudPath = `User/${this.userInfo.account_id}-${this.userInfo.username}-${(/* @__PURE__ */ new Date()).toISOString()}.${ext}`;
          try {
            const uploadRes = await common_vendor.tr.uploadFile({
              filePath: this.userInfo.avatar,
              cloudPath,
              fileType: ext,
              cloudPathAsRealPath: true,
              onUploadProgress: (progress) => {
                var percentage = Math.round(progress.loaded * 100) / progress.total;
                common_vendor.index.showLoading({ title: `上传中...${percentage}%` });
              }
            });
            this.userInfo.avatar = uploadRes.fileID;
          } catch (err) {
            common_vendor.index.showToast({ title: "图片上传失败", icon: "none" });
            return;
          }
        }
        const res = await common_vendor.tr.callFunction({
          name: "update_userInfo",
          data: {
            old_avatar: this.old_avatar,
            userInfo: {
              ...this.userInfo
            }
          }
        });
        if (res.result.code === 0) {
          const app = getApp();
          app.userInfo = res.result.data;
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          common_vendor.index.navigateBack();
        } else {
          common_vendor.index.showToast({ title: res.result.msg, icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      }
    },
    previewAvatar(url) {
      common_vendor.index.previewImage({
        urls: [url],
        current: url
      });
    }
  },
  onLoad() {
    const app = getApp();
    this.userInfo = app.userInfo;
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.userInfo.avatar,
    b: common_vendor.o(($event) => $options.previewAvatar($data.userInfo.avatar)),
    c: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    d: $data.userInfo.username,
    e: common_vendor.o(($event) => $data.userInfo.username = $event.detail.value),
    f: $data.userInfo.description,
    g: common_vendor.o(($event) => $data.userInfo.description = $event.detail.value),
    h: $data.userInfo.oldPassword,
    i: common_vendor.o(($event) => $data.userInfo.oldPassword = $event.detail.value),
    j: $data.userInfo.password,
    k: common_vendor.o(($event) => $data.userInfo.password = $event.detail.value),
    l: $data.userInfo.confirmPassword,
    m: common_vendor.o(($event) => $data.userInfo.confirmPassword = $event.detail.value),
    n: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/edit/edit.js.map
