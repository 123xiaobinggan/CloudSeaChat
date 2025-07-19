"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      content: "",
      mediaFiles: [],
      // 存储图片和视频
      type: 0,
      source_post: {},
      permissionText: "所有人可见",
      permissionOptions: ["所有人可见", "仅我可见"],
      user: {
        account_id: null,
        username: "未登录",
        avatar: "",
        ip: "未知"
      },
      subtoken: null,
      loading: false
    };
  },
  watch: {
    loading(newVal, oldVal) {
      if (newVal == true) {
        common_vendor.index.showLoading({ title: "正在发布..." });
      }
    }
  },
  onLoad() {
    this.subtoken = common_vendor.PubSub.subscribe("to_post", (msg, data) => {
      this.user.account_id = data.account_id;
      this.user.username = data.username;
      this.user.avatar = data.avatar;
      this.type = data.type;
      if (data.share_post) {
        this.source_post = data.share_post;
      }
      common_vendor.index.__f__("log", "at pages/post/post.vue:136", "to_post", this.source_post, this.user);
    });
  },
  onUnload() {
    if (this.subtoken) {
      common_vendor.PubSub.unsubscribe(this.subtoken);
      this.subtoken = null;
    }
  },
  methods: {
    // 选择媒体类型
    showMediaPicker() {
      common_vendor.index.showActionSheet({
        itemList: ["照片", "视频"],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.chooseImage();
          } else if (res.tapIndex === 1) {
            this.chooseVideo();
          }
        }
      });
    },
    // 选择图片
    chooseImage() {
      common_vendor.index.chooseImage({
        count: 9 - this.mediaFiles.length,
        sourceType: ["album", "camera"],
        success: (res) => {
          res.tempFilePaths.forEach((filePath) => {
            this.mediaFiles.push({
              url: filePath,
              type: "image"
            });
          });
        }
      });
    },
    // 选择视频
    chooseVideo() {
      common_vendor.index.chooseVideo({
        count: 9 - this.mediaFiles.length,
        sourceType: ["album", "camera"],
        duration: 30,
        success: (res) => {
          if (this.mediaFiles.length < 9) {
            this.mediaFiles.push({
              url: res.tempFilePath,
              type: "video"
            });
          } else {
            common_vendor.index.showToast({ title: "最多只能上传9个媒体文件", icon: "none" });
          }
        }
      });
    },
    // 预览媒体文件
    previewMedia(media, index) {
      common_vendor.index.previewMedia({
        sources: media.map((file) => ({
          url: file.url,
          type: file.type
        })),
        current: index
      });
    },
    // 删除媒体文件
    removeMedia(index) {
      this.mediaFiles.splice(index, 1);
    },
    // 改变权限
    onPermissionChange(e) {
      this.permissionText = this.permissionOptions[e.detail.value];
    },
    //获取用户ip地址
    async getUserLocation() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_ip",
          data: {}
        });
        if (res.result.code === 200) {
          this.user.ip = res.result.data;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/post.vue:222", "获取位置失败", e);
      }
    },
    //解析ip地址
    async resolve_ip() {
      const host = "https://ipcity.market.alicloudapi.com";
      const path = "/ip/city/query";
      const appCode = "1dc84a4fe7fc40238d1a17ad665c59d3";
      const querys = `ip=${encodeURIComponent(this.user.ip)}&coordsys=WGS84`;
      const urlSend = `${host}${path}?${querys}`;
      try {
        const res = await common_vendor.index.request({
          url: urlSend,
          method: "GET",
          header: {
            "Authorization": `APPCODE ${appCode}`
          }
        });
        if (res.statusCode === 200) {
          if (res.data.code == 200) {
            let city;
            if (res.data.data.result.city) {
              city = res.data.data.result.city;
            } else if (res.data.data.result.prov) {
              city = res.data.data.result.province;
            } else if (res.data.data.result.country) {
              city = res.data.data.result.country;
            } else if (res.data.data.result.continuent) {
              city = res.data.data.result.continent;
            }
            if (city.endsWith("市")) {
              city = city.slice(0, -1);
            } else if (city.endsWith("省")) {
              city = city.slice(0, -1);
            }
            this.user.ip = city;
            common_vendor.index.__f__("log", "at pages/post/post.vue:263", "获取到的IP地址", this.user.ip);
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/post/post.vue:267", "resolve_ip 请求失败:", err);
      }
    },
    //提交帖子
    async submitPost() {
      if (this.loading) {
        return;
      }
      if (!this.user.account_id) {
        common_vendor.index.showToast({
          title: "请登录",
          icon: "none"
        });
        return;
      }
      if (!this.content.trim() && this.mediaFiles.length === 0) {
        common_vendor.index.showToast({
          title: "内容不能为空",
          icon: "none"
        });
        return;
      }
      this.loading = true;
      if (this.mediaFiles.length) {
        this.mediaFiles = await Promise.all(this.mediaFiles.map(async (file) => {
          try {
            const ext = file.url.split(".").pop().toLowerCase();
            const cloudPath = `Post/${this.user.account_id}-${this.user.username}-${Date.now()}-${Math.floor(Math.random() * 1e4)}.${ext}`;
            const res = await common_vendor.tr.uploadFile({
              filePath: file.url,
              cloudPath,
              fileType: file.type,
              cloudPathAsRealPath: true,
              onUploadProgress: (progress) => {
                var percentage = Math.round(progress.loaded * 100) / progress.total;
                common_vendor.index.showLoading({ title: `上传中...${percentage}%` });
              },
              header: {
                "Cache-Control": "max-age=2592000"
              }
            });
            return {
              url: res.fileID,
              // 云端路径
              type: file.type
            };
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/post/post.vue:314", "文件上传失败", file.url, e);
            return null;
          }
        }));
        this.mediaFiles = this.mediaFiles.filter((item) => item !== null);
      }
      await this.getUserLocation();
      await this.resolve_ip();
      try {
        const res = await common_vendor.tr.callFunction({
          name: "post",
          data: {
            user: this.user,
            content: this.content,
            media: this.mediaFiles,
            post_type: this.type,
            temp_source_post: this.source_post,
            visibility: this.permissionText,
            create_time: (/* @__PURE__ */ new Date()).toISOString(),
            ip: this.user.ip,
            tags: [],
            status: 1
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.showToast({
            title: "发布成功",
            icon: "success"
          });
          common_vendor.PubSub.publish("return_index", res.result.data);
          setTimeout(() => {
            common_vendor.index.navigateBack();
            this.loading = false;
          }, 500);
        } else if (res.result.code === 401) {
          common_vendor.index.showToast({
            title: "请登录",
            icon: "none"
          });
          this.loading = false;
        } else {
          common_vendor.index.showToast({
            title: "发布失败",
            icon: "none"
          });
          this.loading = false;
          common_vendor.index.__f__("log", "at pages/post/post.vue:368", "发布失败", res.result);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/post/post.vue:371", "发布失败", e);
        common_vendor.index.showToast({
          title: "发布失败",
          icon: "none"
        });
        this.loading = false;
      }
    },
    //时间格式化函数
    formatDate(date) {
      date = new Date(date);
      const pad = (n) => n.toString().padStart(2, "0");
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => $options.submitPost()),
    b: $data.content,
    c: common_vendor.o(($event) => $data.content = $event.detail.value),
    d: $data.type === 0
  }, $data.type === 0 ? common_vendor.e({
    e: common_vendor.f($data.mediaFiles, (media, index, i0) => {
      return common_vendor.e({
        a: media.type === "image"
      }, media.type === "image" ? {
        b: media.url
      } : media.type === "video" ? {
        d: media.url
      } : {}, {
        c: media.type === "video",
        e: common_vendor.o(() => $options.removeMedia(index), index),
        f: index,
        g: common_vendor.o(() => $options.previewMedia($data.mediaFiles, index), index)
      });
    }),
    f: $data.mediaFiles.length < 9
  }, $data.mediaFiles.length < 9 ? {
    g: common_assets._imports_0$1,
    h: common_vendor.o((...args) => $options.showMediaPicker && $options.showMediaPicker(...args))
  } : {}) : common_vendor.e({
    i: $data.source_post.avatar,
    j: common_vendor.t($data.source_post.username),
    k: common_vendor.t($options.formatDate($data.source_post.create_time)),
    l: common_vendor.t($data.source_post.ip),
    m: common_vendor.t($data.source_post.content),
    n: Array.isArray($data.source_post.media) && $data.source_post.media.length
  }, Array.isArray($data.source_post.media) && $data.source_post.media.length ? {
    o: common_vendor.f($data.source_post.media, (media, mediaIndex, i0) => {
      return common_vendor.e({
        a: media.type === "image"
      }, media.type === "image" ? {
        b: media.url
      } : media.type === "video" ? {
        d: media.url
      } : {}, {
        c: media.type === "video",
        e: mediaIndex,
        f: common_vendor.o(() => $options.previewMedia($data.source_post.media, mediaIndex), mediaIndex)
      });
    }),
    p: common_vendor.n("media-count-" + $data.source_post.media.length)
  } : {}), {
    q: common_vendor.t($data.permissionText),
    r: $data.permissionOptions,
    s: common_vendor.o((...args) => $options.onPermissionChange && $options.onPermissionChange(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-0832fc77"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/post/post.js.map
