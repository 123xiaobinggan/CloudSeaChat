"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      user: {
        account_id: "",
        ip: "未知"
      },
      tabs: [
        {
          icon: "/static/index/赞.png",
          type: "like",
          count: 0
        },
        {
          icon: "/static/index/评论.png",
          type: "comment",
          count: 0
        },
        {
          icon: "/static/index/转发.png",
          type: "share",
          count: 0
        }
      ],
      activeTab: 0,
      groupedMessagesByType: {
        like: [],
        comment: [],
        share: []
      },
      token: "",
      loading: false,
      loaded: false,
      StartX: "",
      dragging: false,
      translateX: 0,
      windowWidth: 375,
      newReply: "",
      lastShowInput: null
    };
  },
  computed: {
    currentMessages() {
      return this.groupedMessagesByType[this.tabs[this.activeTab].type];
    },
    contentStyle() {
      const transition = this.dragging ? "none" : "transform 0.3s ease";
      return `width: ${this.tabs.length * 100}%; display: flex; transform: translateX(${this.translateX}px); transition: ${transition};`;
    }
  },
  watch: {
    "user.account_id"() {
      common_vendor.index.__f__("log", "at pages/message/message.vue:170", "account_id change");
      this.groupedMessagesByType.like = [];
      this.groupedMessagesByType.comment = [];
      this.groupedMessagesByType.share = [];
      this.fetchMessages("like");
      this.fetchMessages("comment");
      this.fetchMessages("share");
    },
    activeTab() {
      this.translateX = -this.windowWidth * this.activeTab;
    },
    tabs: {
      deep: true,
      handler() {
        if (this.tabs[0].count + this.tabs[1].count + this.tabs[2].count > 0) {
          common_vendor.index.showTabBarRedDot({
            index: 1
          });
        } else {
          common_vendor.index.hideTabBarRedDot({
            index: 1
          });
        }
      }
    }
  },
  mounted() {
    common_vendor.index.getSystemInfo({
      success: (res) => {
        this.windowWidth = res.windowWidth;
        this.translateX = -this.activeTab * res.windowWidth;
      }
    });
  },
  onShow() {
    const app = getApp();
    if (app.userInfo) {
      this.user.account_id = app.userInfo.account_id;
      common_vendor.index.__f__("log", "at pages/message/message.vue:209", "messges收到用户信息", this.user);
    }
  },
  onPullDownRefresh() {
    if (this.loading)
      return;
    this.groupedMessagesByType[this.tabs[this.activeTab].type] = [];
    this.fetchMessages(this.tabs[this.activeTab].type).finally(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  onReachBottom() {
    common_vendor.index.__f__("log", "at pages/message/message.vue:220", "OnreachBottom");
    if (this.loading)
      return;
    this.loading = true;
    this.loaded = false;
    this.fetchMessages(this.activeTab).finally(() => {
      this.loading = false;
      this.loaded = true;
      setTimeout(() => {
        this.loaded = false;
      }, 2e3);
    });
  },
  methods: {
    async switchTab(tab) {
      this.activeTab = tab;
    },
    async fetchMessages(type) {
      if (!this.user.account_id) {
        common_vendor.index.__f__("log", "at pages/message/message.vue:239", "请登录");
        return;
      }
      try {
        const currentType = type;
        const groupedList = this.groupedMessagesByType[currentType] || [];
        const len = groupedList.length;
        const res = await common_vendor.tr.callFunction({
          name: "get_messages",
          data: {
            account_id: this.user.account_id,
            type: currentType,
            create_date: len > 0 ? groupedList[len - 1].create_date : null,
            day_count: 7
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.__f__("log", "at pages/message/message.vue:259", "收到消息", res.result.data);
          this.groupedMessagesByType[currentType] = groupedList.concat(res.result.data);
          this.updateTabCounts();
        } else {
          common_vendor.index.showToast({
            title: "获取消息失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("log", "at pages/message/message.vue:270", e);
      }
    },
    //时间格式化函数
    formatDate(create_time) {
      create_time = new Date(create_time);
      const pad = (n) => n.toString().padStart(2, "0");
      const year = create_time.getFullYear();
      const month = pad(create_time.getMonth() + 1);
      const day = pad(create_time.getDate());
      const hours = pad(create_time.getHours());
      const minutes = pad(create_time.getMinutes());
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    async markMessagesAsRead(messages) {
      common_vendor.index.__f__("log", "at pages/message/message.vue:285", "click");
      let update_messages = [];
      common_vendor.index.__f__("log", "at pages/message/message.vue:287", "messages", messages);
      messages.forEach((group) => {
        const message = group.messages || [];
        message.forEach((msg) => {
          if (msg.action_type == this.tabs[this.activeTab].type) {
            msg.read = true;
            update_messages.push(msg);
          }
        });
      });
      if (!update_messages) {
        common_vendor.index.__f__("log", "at pages/message/message.vue:298", "no_need_update");
        return;
      }
      try {
        await common_vendor.tr.callFunction({
          name: "update_read",
          data: {
            messages: update_messages
          }
        });
        this.updateTabCounts();
      } catch (e) {
        common_vendor.index.__f__("log", "at pages/message/message.vue:310", e);
      }
    },
    updateTabCounts() {
      this.tabs[0].count = 0;
      this.tabs[1].count = 0;
      this.tabs[2].count = 0;
      Object.values(this.groupedMessagesByType).forEach((groupList) => {
        if (Array.isArray(groupList)) {
          groupList.forEach((group) => {
            const messages = group.messages || [];
            messages.forEach((msg) => {
              if (!msg.read) {
                this.tabs[this.return_index(msg.action_type)].count++;
              }
            });
          });
        }
      });
    },
    return_index(type) {
      if (type === "like")
        return 0;
      if (type === "comment")
        return 1;
      if (type === "share")
        return 2;
    },
    getMessageText(msg) {
      if (msg.target_type === "post" && msg.action_type === "like")
        return "点赞了你的帖子";
      if (msg.target_type === "comment" && msg.action_type === "like")
        return "点赞了你的评论";
      if (msg.target_type === "post" && msg.action_type === "comment")
        return "评论了你的帖子";
      if (msg.target_type === "comment" && msg.action_type === "comment")
        return "回复了你的评论";
      if (msg.target_type === "post" && msg.action_type === "share")
        return "转发了你的帖子";
      return "";
    },
    onTouchStart(e) {
      this.startX = e.touches[0].clientX;
      this.dragging = true;
    },
    onTouchMove(e) {
      if (!this.dragging)
        return;
      const deltaX = e.touches[0].clientX - this.startX;
      this.translateX = -this.activeTab * this.windowWidth + deltaX;
    },
    onTouchEnd(e) {
      const deltaX = e.changedTouches[0].clientX - this.startX;
      const threshold = this.windowWidth / 4;
      if (deltaX > threshold && this.activeTab > 0) {
        this.activeTab--;
      } else if (deltaX < -threshold && this.activeTab < Object.keys(this.tabs).length - 1) {
        this.activeTab++;
      }
      this.translateX = -this.activeTab * this.windowWidth;
      this.dragging = false;
    },
    //转到个人信息页
    to_personal_info(msg) {
      const admin = msg.source_post ? msg.source_post.admin : msg.source_comment.admin;
      common_vendor.index.__f__("log", "at pages/message/message.vue:371", "admin", admin);
      common_vendor.index.navigateTo({
        url: `/pages/personal_info/personal_info?account_id=${msg.actor_account_id}&visitor_account_id=${this.user.account_id}&visitor_admin=${admin}`
      });
    },
    //转到原帖页
    to_source_post(msg) {
      common_vendor.index.navigateTo({
        url: `/pages/source_post/source_post?post_id=${msg.source_post._id}&account_id=${this.user.account_id}&admin=${msg.source_post.admin}&username=${msg.source_post.username}&avatar=${msg.source_post.avatar}`
      });
    },
    toggleReplyInput(msg) {
      if (this.lastShowInput && this.lastShowInput !== msg) {
        this.lastShowInput.showInput = false;
      }
      msg.showInput = !msg.showInput;
      this.lastShowInput = msg;
      common_vendor.index.__f__("log", "at pages/message/message.vue:388", "msg", msg.showInput);
    },
    // 提交评论或回复
    async submitComment(msg, content) {
      if (!content.trim()) {
        common_vendor.index.showToast({ title: "评论不能为空", icon: "none" });
        return;
      }
      if (!this.user.account_id) {
        common_vendor.index.showToast({ title: "请登录", icon: "none" });
        return;
      }
      let loading = true;
      if (loading) {
        common_vendor.index.showToast({
          title: "评论中...",
          icon: "loading"
        });
      }
      await this.getUserLocation();
      await this.resolve_ip();
      const comment = {
        _id: msg.comment_id,
        account_id: msg.actor_account_id,
        content
      };
      const reply = {
        account_id: msg.actor_account_id,
        username: msg.actor_username,
        avatar: msg.actor_avatar,
        content
      };
      try {
        const res = await common_vendor.tr.callFunction({
          name: "submit_comment",
          data: {
            user: this.user,
            post: null,
            comment,
            reply,
            type: 1,
            content
          }
        });
        if (res.result.msg == "success") {
          msg.showInput = false;
          this.newReply = "";
          loading = false;
          common_vendor.index.showToast({ title: "评论成功", icon: "success" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "评论失败", icon: "none" });
      }
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
        common_vendor.index.__f__("error", "at pages/message/message.vue:456", "获取位置失败", e);
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
            common_vendor.index.__f__("log", "at pages/message/message.vue:497", "获取到的IP地址", this.user.ip);
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/message/message.vue:501", "resolve_ip 请求失败:", err);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.tabs, (tab, index, i0) => {
      return common_vendor.e({
        a: tab.icon,
        b: tab.count > 0
      }, tab.count > 0 ? {
        c: common_vendor.t(tab.count)
      } : {}, {
        d: index,
        e: $data.activeTab === index ? 1 : "",
        f: common_vendor.o(($event) => $options.switchTab(index), index)
      });
    }),
    b: common_vendor.o(($event) => $options.markMessagesAsRead($data.groupedMessagesByType[$data.tabs[$data.activeTab].type])),
    c: common_vendor.f($data.tabs, (tab, index, i0) => {
      return common_vendor.e({
        a: $data.groupedMessagesByType[tab.type].length === 0
      }, $data.groupedMessagesByType[tab.type].length === 0 ? {} : {}, {
        b: common_vendor.f($data.groupedMessagesByType[tab.type], (group, gIndex, i1) => {
          return {
            a: common_vendor.t(group.create_date),
            b: common_vendor.f(group.messages, (msg, mIndex, i2) => {
              return common_vendor.e({
                a: msg.actor_avatar,
                b: common_vendor.o(($event) => $options.to_personal_info(msg), mIndex),
                c: common_vendor.t(msg.actor_username || "未知"),
                d: common_vendor.t($options.getMessageText(msg)),
                e: common_vendor.t($options.formatDate(msg.create_time)),
                f: common_vendor.t(msg.ip),
                g: !msg.read
              }, !msg.read ? {} : {}, {
                h: msg.content && msg.action_type !== "like"
              }, msg.content && msg.action_type !== "like" ? {
                i: common_vendor.t(msg.content)
              } : {}, {
                j: msg.target_type === "post"
              }, msg.target_type === "post" ? {
                k: msg.source_post.avatar,
                l: common_vendor.t(msg.source_post.username || "未知"),
                m: common_vendor.t($options.formatDate(msg.source_post.create_time)),
                n: common_vendor.t(msg.source_post.ip),
                o: common_vendor.t(msg.source_post.content),
                p: common_vendor.o(($event) => $options.to_source_post(msg), mIndex)
              } : {}, {
                q: msg.target_type === "comment"
              }, msg.target_type === "comment" ? {
                r: common_vendor.t(msg.source_comment.username || "未知"),
                s: common_vendor.t(msg.source_comment.content)
              } : {}, {
                t: msg.action_type == "comment"
              }, msg.action_type == "comment" ? {
                v: common_vendor.o(($event) => $options.toggleReplyInput(msg), mIndex)
              } : {}, {
                w: msg.action_type == "comment" && msg.showInput
              }, msg.action_type == "comment" && msg.showInput ? {
                x: "回复" + msg.actor_username + "...",
                y: $data.newReply,
                z: common_vendor.o(($event) => $data.newReply = $event.detail.value, mIndex),
                A: common_vendor.o(() => $options.submitComment(msg, $data.newReply), mIndex),
                B: common_vendor.o(() => {
                }, mIndex)
              } : {}, {
                C: mIndex,
                D: common_vendor.o(($event) => $options.markMessagesAsRead([{
                  create_date: group.create_date,
                  messages: [msg]
                }]), mIndex)
              });
            }),
            c: gIndex
          };
        })
      }, $data.loading && !$data.loaded ? {} : {}, $data.loaded && !$data.loading ? {} : {}, {
        c: index
      });
    }),
    d: $data.loading && !$data.loaded,
    e: $data.loaded && !$data.loading,
    f: common_vendor.s($options.contentStyle),
    g: common_vendor.o((...args) => $options.onTouchStart && $options.onTouchStart(...args)),
    h: common_vendor.o((...args) => $options.onTouchEnd && $options.onTouchEnd(...args)),
    i: common_vendor.o((...args) => $options.onTouchMove && $options.onTouchMove(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4c1b26cf"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/message/message.js.map
