"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      user: {
        account_id: null,
        username: "未登录",
        description: "这个人很懒，什么都没有留下",
        avatar: "/static/info/未登录.png",
        background: "",
        post_count: 0,
        visitor_count: 0,
        level: 0,
        activity: 0,
        coupon: 0,
        points: 0,
        balance: 0,
        admin: false
        // 是否为管理员
      },
      visitor: {
        account_id: null,
        admin: false,
        ip: "未知"
      },
      activeTab: "posts",
      userPosts: [],
      userVisitors: [],
      loading: false,
      loaded: false,
      newComment: "",
      newReply: "",
      newReplyReply: "",
      replyPlaceholder: "发表评论...",
      // 回复框的占位符
      last_showInput: null,
      // 记录上一个显示的输入框
      showBackToTop: false,
      rotating: false,
      navBarTop: 0,
      lastScrollTop: 0,
      showBackToTop: false,
      newBackground: "",
      token: ""
    };
  },
  watch: {
    activeTab(newVal, oldVal) {
      if (newVal == "visitors" && this.userVisitors.length == 0) {
        common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:380", "fetchUserVisitors");
        this.fetchUserVisitors();
      }
    }
  },
  async onLoad(option) {
    this.user.account_id = option.account_id;
    this.visitor.account_id = option.visitor_account_id;
    this.visitor.admin = option.visitor_admin == true || option.visitor_admin == "true";
    common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:389", "visitor", this.visitor);
    await this.fetchUserInfo();
    if (this.user.account_id) {
      this.fetchUserPosts();
    }
    if (option.account_id !== option.visitor_account_id && option.visitor_account_id) {
      this.updateVisitor(option.account_id, option.visitor_account_id);
    }
  },
  onUnload() {
    if (this.token) {
      PubSub.unsubscribe(this.token);
      this.token = "";
    }
  },
  onReachBottom() {
    if (this.activeTab === "posts" && !this.loading) {
      this.loading = true;
      this.loaded = false;
      this.fetchUserPosts().then(() => {
        this.loading = false;
        this.loaded = true;
      });
      setTimeout(() => {
        this.loaded = false;
      }, 1e3);
    } else if (this.activeTab === "visitors" && !this.loading) {
      this.loading = true;
      this.loaded = false;
      this.fetchUserVisitors().then(() => {
        this.loading = false;
        this.loaded = true;
      });
      setTimeout(() => {
        this.loaded = false;
      }, 1e3);
    }
  },
  onPageScroll(e) {
    if (this.lastScrollTop >= e.scrollTop) {
      if (e.scrollTop >= 220) {
        this.showBackToTop = true;
      } else {
        this.showBackToTop = false;
      }
    } else {
      this.showBackToTop = false;
    }
    this.lastScrollTop = e.scrollTop;
  },
  methods: {
    //获取用户信息
    async fetchUserInfo() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_target_userInfo",
          data: {
            account_id: this.user.account_id
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:455", "获取用户信息成功", res.result.data);
          this.user = res.result.data;
          common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:457", "user", this.user);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:460", "获取用户信息失败", err);
      }
    },
    //获取用户帖子
    async fetchUserPosts() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_user_posts",
          data: {
            account_id: this.user.account_id,
            page_size: 5,
            create_time: this.userPosts.length > 0 ? this.userPosts[this.userPosts.length - 1].create_time : null,
            visitor_account_id: this.visitor.account_id
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:476", "获取用户帖子成功", res.result.data);
          this.userPosts = this.userPosts.concat(res.result.data);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:480", "获取用户帖子失败", err);
        common_vendor.index.showToast({
          title: "获取帖子失败",
          icon: "none"
        });
      }
    },
    //获取用户访客
    async fetchUserVisitors() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_user_visitors",
          data: {
            account_id: this.user.account_id,
            day_count: 7,
            create_date: this.userVisitors.length > 0 ? this.userVisitors[this.userVisitors.length - 1].date : null
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:499", "获取用户访客成功", res.result.data);
          this.userVisitors = this.userVisitors.concat(res.result.data);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:503", "获取用户访客失败", err);
        common_vendor.index.showToast({
          title: "获取访客失败",
          icon: "none"
        });
      }
    },
    //获取评论
    async fetchComments(post) {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_comments",
          data: {
            post_id: post._id
            // 传递帖子 ID
          }
        });
        if (res.result.msg == "success") {
          post.comments = res.result.data;
          post.comment_count = post.comments.length;
          if (this.user.account_id) {
            const db = common_vendor.tr.database();
            const likeRes = await db.collection("user-liked").where({
              account_id: this.user.account_id,
              target_id: db.command.in(post.comments.map((item) => item._id)),
              liked: true
            }).get();
            const likedCommentIds = likeRes.result.data.map((item) => item.target_id);
            let replies = [];
            for (const comment of post.comments) {
              comment.liked = likedCommentIds.includes(comment._id);
              replies = replies.concat(comment.replies);
            }
            if (replies.length > 0) {
              const likeRes2 = await db.collection("user-liked").where({
                account_id: this.user.account_id,
                target_id: db.command.in(replies.map((item) => item._id)),
                liked: true
              }).get();
              const likedReplyIds = likeRes2.result.data.map((item) => item.target_id);
              post.comments.forEach((comment) => {
                comment.replies.forEach((reply) => {
                  reply.liked = likedReplyIds.includes(reply._id);
                });
              });
            }
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:553", "获取评论失败:", error);
      }
    },
    //更新用户访客
    async updateVisitor(account_id, visitor_account_id) {
      await this.getUserLocation();
      await this.resolve_ip();
      const res = await common_vendor.tr.callFunction({
        name: "update_visitor",
        data: {
          account_id,
          visitor_account_id,
          visitor_ip: this.visitor.ip
        }
      });
      this.user.visitor_count += res.result.data;
      common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:570", "update_visitor", res);
    },
    //获取用户ip地址
    async getUserLocation() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_ip",
          data: {}
        });
        if (res.result.code === 200) {
          this.visitor.ip = res.result.data;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:583", "获取位置失败", e);
      }
    },
    //解析ip地址
    async resolve_ip() {
      const host = "https://ipcity.market.alicloudapi.com";
      const path = "/ip/city/query";
      const appCode = "1dc84a4fe7fc40238d1a17ad665c59d3";
      const querys = `ip=${encodeURIComponent(this.visitor.ip)}&coordsys=WGS84`;
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
            this.visitor.ip = city;
            common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:624", "获取到的IP地址", this.visitor.ip);
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:628", "resolve_ip 请求失败:", err);
      }
    },
    // 预览媒体
    previewMedia(media, currentIndex) {
      common_vendor.index.previewMedia({
        sources: media.map((item) => ({
          url: item.url,
          type: item.type
        })),
        current: currentIndex
        // 当前预览的媒体索引
      });
    },
    // 预览头像
    previewAvatar(avatar) {
      common_vendor.index.previewImage({
        current: avatar,
        // 当前预览的媒体索引
        urls: [avatar]
      });
    },
    // 确认删除帖子
    confirmDeletePost(post) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条帖子吗？",
        success: (res) => {
          if (res.confirm) {
            this.deletePost(post);
          }
        }
      });
    },
    //删除帖子
    async deletePost(post) {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "delete_post",
          data: { post_id: post._id }
        });
        if (res.result.code === 200) {
          common_vendor.index.showToast({ title: "删除成功", icon: "success" });
          this.posts = this.posts.filter((p) => p._id !== post._id);
        } else {
          common_vendor.index.showToast({ title: "删除失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:674", "删除失败:", error);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
      }
    },
    //点赞
    async like(item, post, comment, reply, type) {
      if (!this.visitor.account_id) {
        common_vendor.index.showToast({ title: "请登录", icon: "none" });
        return;
      }
      item.liked = !item.liked;
      item.like_count += item.liked ? 1 : -1;
      try {
        const res = await common_vendor.tr.callFunction({
          name: "user-liked",
          data: {
            target_id: item._id,
            post,
            comment,
            reply,
            account_id: this.visitor.account_id,
            type
          }
        });
        if (res.result.msg === "请登录") {
          common_vendor.index.showToast({
            title: "请登录",
            icon: "none"
          });
        } else if (res.result.msg != "success") {
          item.liked = !item.liked;
          item.like_count -= item.liked ? -1 : 1;
          common_vendor.index.showToast({
            title: res.result.message || "操作失败",
            icon: "none"
          });
        } else if (res.result.first) {
          PubSub.publish("update_activity", 5);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:718", "点赞失败:", err);
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
    },
    //展示评论
    toggleComments(selectedPost) {
      this.userPosts.forEach((post) => {
        if (post._id === selectedPost._id) {
          post.showComments = !post.showComments;
        } else {
          post.showComments = false;
        }
      });
      if (!selectedPost.comments) {
        this.fetchComments(selectedPost);
      }
    },
    // 提交评论或回复
    async submitComment(post, comment, reply, type, content) {
      if (!this.newComment.trim() && type == 0 || !this.newReply.trim() && type == 1 || !this.newReplyReply.trim() && type == 2) {
        common_vendor.index.showToast({ title: "评论不能为空", icon: "none" });
        return;
      }
      if (!this.visitor.account_id) {
        common_vendor.index.showToast({ title: "请登录", icon: "none" });
        return;
      }
      let showding = true;
      if (showding) {
        common_vendor.index.showToast({
          title: "提交中...",
          icon: "loading"
        });
      }
      try {
        const res = await common_vendor.tr.callFunction({
          name: "submit_comment",
          data: {
            user: this.visitor,
            post,
            comment,
            reply,
            type,
            content
          }
        });
        if (res.result.msg == "success") {
          if (type == 0) {
            post.comment_count += 1;
            post.comments.unshift(res.result.data);
            this.newComment = "";
          } else {
            comment.replies.unshift(res.result.data);
            if (reply) {
              this.newReplyReply = "", reply.showReplyInput = false;
            } else {
              this.newReply = "", comment.showReplyInput = false;
            }
          }
          showding = false;
          common_vendor.index.showToast({ title: "评论成功", icon: "success" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "评论失败", icon: "none" });
      }
    },
    // 长按评论或回复处理
    handleLongPressComment_Reply(postIndex, commentIndex, replyIndex, parent, item) {
      if (item.account_id && item.account_id !== this.visitor.account_id && !this.visitor.admin) {
        return;
      }
      common_vendor.index.showActionSheet({
        itemList: ["删除"],
        success: (res) => {
          if (res.tapIndex === 0) {
            common_vendor.index.showModal({
              title: "确认删除",
              content: "确定要删除这条评论吗？",
              success: (res2) => {
                if (res2.confirm) {
                  this.deleteComment_Reply(postIndex, commentIndex, replyIndex, parent, item);
                }
              }
            });
          }
        }
      });
    },
    // 删除评论或回复
    async deleteComment_Reply(postIndex, commentIndex, replyIndex, parent, item) {
      let loading = true;
      if (loading) {
        common_vendor.index.showToast({
          title: "删除中...",
          icon: "loading"
        });
      }
      try {
        const res = await common_vendor.tr.callFunction({
          name: "delete_comment_reply",
          data: {
            parent,
            item
          }
        });
        loading = false;
        if (res.result.code === 200) {
          common_vendor.index.showToast({ title: "删除成功", icon: "success" });
          if (!("post_id" in item)) {
            common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:836", "replies", res.result.data.replies);
            this.$set(this.userPosts[postIndex].comments[commentIndex], "replies", res.result.data.replies);
          } else {
            this.userPosts[postIndex].comments.splice(commentIndex, 1);
            this.userPosts[postIndex].comment_count -= 1;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/personal_info/personal_info.vue:847", "删除失败:", error);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
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
    // 切换回复输入框的显示状态
    toggleReplyInput(item) {
      this.$set(item, "showReplyInput", !item.showReplyInput);
      if (this.last_showInput && this.last_showInput !== item) {
        this.last_showInput.showReplyInput = false;
      }
      this.last_showInput = item;
    },
    // 滚动到顶部
    scrollToTop() {
      this.rotating = true;
      setTimeout(() => {
        this.rotating = false;
      }, 500);
      common_vendor.index.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    },
    changeBackground() {
      if (this.user.account_id !== this.visitor.account_id) {
        return;
      }
      common_vendor.index.showActionSheet({
        itemList: ["更换背景"],
        success: (res) => {
          if (res.tapIndex === 0) {
            common_vendor.index.chooseImage({
              count: 1,
              sizeType: ["compressed"],
              sourceType: ["album", "camera"],
              success: (res2) => {
                this.newBackground = res2.tempFilePaths[0];
                this.update_background();
              }
            });
          }
        }
      });
    },
    async update_background() {
      const ext = this.user.background.split(".").pop().toLowerCase();
      const cloudPath = `Personal_background/${this.user.account_id}-${this.user.username}-${(/* @__PURE__ */ new Date()).toISOString()}.${ext}`;
      try {
        const uploadRes = await common_vendor.tr.uploadFile({
          filePath: this.newBackground,
          cloudPath,
          fileType: ext,
          cloudPathAsRealPath: true,
          onUploadProgress: (progress) => {
            var percentage = Math.round(progress.loaded * 100) / progress.total;
            common_vendor.index.showLoading({ title: `上传中...${percentage}%` });
          }
        });
        common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:922", "uploadRes", uploadRes);
        this.newBackground = uploadRes.fileID;
        const res = await common_vendor.tr.callFunction({
          name: "update_background",
          data: {
            oldBackground: this.user.background,
            newBackground: this.newBackground,
            account_id: this.user.account_id
          }
        });
        common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:932", "update_background", res);
        if (res.result.code === 200) {
          this.user.background = this.newBackground;
          common_vendor.index.showToast({ title: "更换成功", icon: "success" });
        } else {
          this.user.background = "https://mp-ad47c7bd-10fe-4cc5-9ad0-a7ff552214bc.cdn.bspapp.com/Personal_background/sunset.jpg";
          common_vendor.index.showToast({ title: "更换失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "图片上传失败", icon: "none" });
        common_vendor.index.__f__("log", "at pages/personal_info/personal_info.vue:943", "图片上传失败", e);
      }
    },
    //转到原帖页
    to_source_post(post) {
      common_vendor.index.navigateTo({
        url: `/pages/source_post/source_post?post_id=${post.source_post.post_id}&account_id=${this.user.account_id}&admin=${this.user.admin}&username=${this.user.username}&avatar=${this.user.avatar}`
      });
    },
    //转到个人信息页
    to_personal_info(item) {
      common_vendor.index.navigateTo({
        url: `/pages/personal_info/personal_info?account_id=${item.account_id}&visitor_account_id=${this.user.account_id}&visitor_admin=${this.user.admin}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.changeBackground && $options.changeBackground(...args)),
    b: $data.user.background,
    c: $data.user.avatar,
    d: common_vendor.o(($event) => $options.previewAvatar($data.user.avatar)),
    e: common_vendor.t($data.user.username),
    f: common_vendor.t($data.user.account_id),
    g: common_vendor.t($data.user.description),
    h: common_assets._imports_0$3,
    i: common_vendor.t($data.user.post_count),
    j: $data.activeTab === "posts" ? 1 : "",
    k: common_vendor.o(($event) => $data.activeTab = "posts"),
    l: common_assets._imports_1$1,
    m: common_vendor.t($data.user.visitor_count),
    n: $data.activeTab === "visitors" ? 1 : "",
    o: common_vendor.o(($event) => $data.activeTab = "visitors"),
    p: $data.activeTab == "posts"
  }, $data.activeTab == "posts" ? {
    q: common_vendor.f($data.userPosts, (post, postIndex, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.formatDate(post.create_time)),
        b: common_vendor.t(post.ip),
        c: common_vendor.o(() => $options.confirmDeletePost(post), postIndex),
        d: post.post_type == 0
      }, post.post_type == 0 ? common_vendor.e({
        e: common_vendor.t(post.content),
        f: post.media.length > 1
      }, post.media.length > 1 ? common_vendor.e({
        g: Array.isArray(post.media) && post.media.length
      }, Array.isArray(post.media) && post.media.length ? {
        h: common_vendor.f(post.media, (media, mediaIndex, i1) => {
          return common_vendor.e({
            a: media.type === "image"
          }, media.type === "image" ? {
            b: media.url
          } : media.type === "video" ? {
            d: media.url
          } : {}, {
            c: media.type === "video",
            e: mediaIndex,
            f: common_vendor.o(() => $options.previewMedia(post.media, mediaIndex), mediaIndex)
          });
        }),
        i: common_vendor.n("media-count-" + post.media.length)
      } : {}) : post.media.length == 1 ? common_vendor.e({
        k: post.media[0].type === "image"
      }, post.media[0].type === "image" ? {
        l: post.media[0].url
      } : post.media[0].type === "video" ? {
        n: post.media[0].url
      } : {}, {
        m: post.media[0].type === "video",
        o: common_vendor.o(() => $options.previewMedia(post.media, 0), postIndex)
      }) : {}, {
        j: post.media.length == 1
      }) : common_vendor.e({
        p: common_vendor.t(post.content),
        q: post.source_post.avatar
      }, post.source_post.avatar ? {
        r: post.source_post.avatar
      } : {}, {
        s: post.source_post.username
      }, post.source_post.username ? {
        t: common_vendor.t(post.source_post.username)
      } : {}, {
        v: post.source_post.create_time
      }, post.source_post.create_time ? {
        w: common_vendor.t($options.formatDate(post.source_post.create_time)),
        x: common_vendor.t(post.source_post.ip)
      } : {}, {
        y: post.source_post.content
      }, post.source_post.content ? {
        z: common_vendor.t(post.source_post.content)
      } : {}, {
        A: post.source_post.media
      }, post.source_post.media ? common_vendor.e({
        B: post.source_post.media.length > 1
      }, post.source_post.media.length > 1 ? common_vendor.e({
        C: Array.isArray(post.source_post.media) && post.source_post.media.length
      }, Array.isArray(post.source_post.media) && post.source_post.media.length ? {
        D: common_vendor.f(post.source_post.media, (media, mediaIndex, i1) => {
          return common_vendor.e({
            a: media.type === "image"
          }, media.type === "image" ? {
            b: media.url
          } : media.type === "video" ? {
            d: media.url
          } : {}, {
            c: media.type === "video",
            e: mediaIndex,
            f: common_vendor.o(() => $options.previewMedia(post.source_post.media, mediaIndex), mediaIndex)
          });
        }),
        E: common_vendor.n("media-count-" + post.source_post.media.length)
      } : {}) : post.source_post.media.length == 1 ? common_vendor.e({
        G: post.source_post.media[0].type === "image"
      }, post.source_post.media[0].type === "image" ? {
        H: post.source_post.media[0].url
      } : post.source_post.media[0].type === "video" ? {
        J: post.source_post.media[0].url
      } : {}, {
        I: post.source_post.media[0].type === "video",
        K: common_vendor.o(() => $options.previewMedia(post.source_post.media, 0), postIndex)
      }) : {}, {
        F: post.source_post.media.length == 1
      }) : {}, {
        L: common_vendor.o(($event) => $options.to_source_post(post), postIndex)
      }), {
        M: common_vendor.t(post.device_model),
        N: post.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
        O: post.liked ? 1 : "",
        P: common_vendor.t(post.like_count),
        Q: common_vendor.o(() => $options.like(post, post, null, null, 0), postIndex),
        R: common_vendor.t(post.comment_count || 0),
        S: common_vendor.o(() => $options.toggleComments(post), postIndex),
        T: common_vendor.t(post.forward_count || 0),
        U: common_vendor.o(() => _ctx.to_post(post, 1), postIndex),
        V: post.showComments
      }, post.showComments ? {
        W: common_vendor.f(post.comments, (comment, commentIndex, i1) => {
          return common_vendor.e({
            a: comment.avatar,
            b: common_vendor.o(($event) => $options.to_personal_info(comment), commentIndex),
            c: common_vendor.t(comment.username),
            d: common_vendor.t($options.formatDate(comment.create_time)),
            e: common_vendor.t(comment.ip),
            f: comment.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
            g: common_vendor.t(comment.like_count),
            h: common_vendor.o(() => $options.like(comment, post, comment, null, 1), commentIndex),
            i: common_vendor.t(comment.content),
            j: common_vendor.o(() => $options.toggleReplyInput(comment), commentIndex),
            k: comment.showReplyInput
          }, comment.showReplyInput ? {
            l: "回复" + comment.username + "...",
            m: $data.newReply,
            n: common_vendor.o(($event) => $data.newReply = $event.detail.value, commentIndex),
            o: common_vendor.o(() => $options.submitComment(post, comment, null, 1, $data.newReply), commentIndex)
          } : {}, {
            p: comment.replies.length && !comment.showReply
          }, comment.replies.length && !comment.showReply ? {
            q: common_vendor.t(comment.replies.length),
            r: common_vendor.o(($event) => comment.showReply = true, commentIndex)
          } : {}, {
            s: comment.showReply
          }, comment.showReply ? {
            t: common_vendor.f(comment.replies, (reply, replyIndex, i2) => {
              return common_vendor.e({
                a: reply.avatar,
                b: common_vendor.o(($event) => $options.to_personal_info(reply), reply._id),
                c: common_vendor.t(reply.username),
                d: common_vendor.t($options.formatDate(reply.create_time)),
                e: common_vendor.t(reply.ip),
                f: reply.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
                g: common_vendor.t(reply.like_count),
                h: common_vendor.o(() => $options.like(reply, post, comment, reply, 2), reply._id),
                i: reply.reply_username
              }, reply.reply_username ? {
                j: common_vendor.t(reply.reply_username)
              } : {}, {
                k: common_vendor.t(reply.content),
                l: common_vendor.o(() => $options.toggleReplyInput(reply), reply._id),
                m: reply.showReplyInput
              }, reply.showReplyInput ? {
                n: "回复" + reply.username + "...",
                o: $data.newReplyReply,
                p: common_vendor.o(($event) => $data.newReplyReply = $event.detail.value, reply._id),
                q: common_vendor.o(() => $options.submitComment(post, comment, reply, 2, $data.newReplyReply), reply._id)
              } : {}, {
                r: reply._id,
                s: common_vendor.o(($event) => $options.handleLongPressComment_Reply(postIndex, commentIndex, replyIndex, comment, reply), reply._id)
              });
            })
          } : {}, {
            v: commentIndex,
            w: common_vendor.o(($event) => $options.handleLongPressComment_Reply(postIndex, commentIndex, null, post, comment), commentIndex)
          });
        }),
        X: $data.newComment,
        Y: common_vendor.o(($event) => $data.newComment = $event.detail.value, postIndex),
        Z: common_vendor.o(() => $options.submitComment(post, null, null, 0, $data.newComment), postIndex),
        aa: common_vendor.o(() => {
        }, postIndex)
      } : {}, {
        ab: postIndex
      });
    }),
    r: $data.user.avatar,
    s: common_vendor.t($data.user.username),
    t: common_assets._imports_2,
    v: $data.visitor.account_id === $data.user.account_id || $data.visitor.admin,
    w: common_assets._imports_3,
    x: common_assets._imports_4
  } : $data.activeTab == "visitors" ? {
    z: common_vendor.f($data.userVisitors, (group, index, i0) => {
      return {
        a: common_vendor.t(group.date),
        b: common_vendor.f(group.visitors, (visitor, vIndex, i1) => {
          return {
            a: visitor.avatar,
            b: common_vendor.t(visitor.username),
            c: common_vendor.t($options.formatDate(visitor.create_time)),
            d: common_vendor.t(visitor.ip),
            e: vIndex
          };
        }),
        c: index
      };
    })
  } : {}, {
    y: $data.activeTab == "visitors",
    A: $data.loading && !$data.loaded
  }, $data.loading && !$data.loaded ? {} : {}, {
    B: $data.loaded && !$data.loading
  }, $data.loaded && !$data.loading ? {} : {}, {
    C: $data.userPosts.length == 0 && $data.activeTab == "posts"
  }, $data.userPosts.length == 0 && $data.activeTab == "posts" ? common_vendor.e({
    D: $data.user.account_id == $data.visitor.account_id
  }, $data.user.account_id == $data.visitor.account_id ? {} : {}) : $data.userVisitors.length == 0 && $data.activeTab == "visitors" ? {} : {}, {
    E: $data.userVisitors.length == 0 && $data.activeTab == "visitors",
    F: common_assets._imports_5,
    G: $data.showBackToTop ? 1 : "",
    H: $data.showBackToTop ? 1 : "",
    I: !$data.showBackToTop ? 1 : "",
    J: common_vendor.o((...args) => $options.scrollToTop && $options.scrollToTop(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/personal_info/personal_info.js.map
