"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      searchQuery: "",
      posts: [],
      filteredPosts: [],
      newComment: "",
      newReply: "",
      newReplyReply: "",
      user: {
        account_id: "",
        username: "未登录",
        description: "这个人很懒，什么都没有留下",
        avatar: "/static/info/头像.png",
        admin: false,
        // 是否为管理员
        ip: "未知"
      },
      replyPlaceholder: "发表评论...",
      // 回复框的占位符
      last_showInput: null,
      // 记录上一个显示的输入框
      loading: false,
      // 是否正在加载更多帖子
      loaded: false,
      token: "",
      // 用于订阅
      lastScrollTop: 0,
      show_top_bar: true,
      // 控制顶部栏的显示与隐藏
      isAtTop: true
      // 是否滚动到顶部
    };
  },
  watch: {
    posts: {
      deep: true,
      // 深度监听 posts 数组
      handler() {
        this.filteredPosts = this.posts;
        this.filterPosts();
      }
    },
    "user.account_id": {
      handler() {
        this.posts = [];
        this.fetchPosts(null, false);
      }
    }
  },
  onShow() {
    const app = getApp();
    if (app.userInfo) {
      if (app.userInfo.account_id !== this.user.account_id) {
        this.user = app.userInfo;
        common_vendor.index.__f__("log", "at pages/index/index.vue:310", "onShow用户信息更新:", this.user);
      }
    }
  },
  async onLoad() {
    const uid = common_vendor.index.getStorageSync("uid");
    if (uid) {
      await this.login_register("login", uid, "", "", true);
    } else {
      this.posts = [];
      this.fetchPosts(null, false);
    }
    this.token = common_vendor.PubSub.subscribe("return_index", (msg, data) => {
      this.posts.unshift(data);
      common_vendor.PubSub.publish("update_activity", 20);
    });
    common_vendor.index.$on("return_from_source_post", (post_id) => {
      this.posts = this.posts.filter((post) => post._id !== post_id);
    });
  },
  onUnload() {
    if (this.token) {
      common_vendor.PubSub.unsubscribe(this.token);
      this.token = null;
    }
    common_vendor.index.$off("return_from_source_post");
  },
  onReachBottom() {
    if (this.loading)
      return;
    this.loading = true;
    this.loaded = false;
    let post = this.posts.length > 0 ? this.posts[this.posts.length - 1] : null;
    this.fetchPosts(post, true).finally(() => {
      this.loading = false;
      this.loaded = true;
      setTimeout(() => {
        this.loaded = false;
      }, 2e3);
    });
  },
  onPullDownRefresh() {
    if (this.loading)
      return;
    this.posts = [];
    this.fetchPosts(null, false).finally(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  onPageScroll(e) {
    const current = e.scrollTop;
    if (current === 0) {
      this.isAtTop = true;
    } else {
      this.isAtTop = false;
    }
    if (current <= this.lastScrollTop) {
      this.show_top_bar = true;
    } else {
      this.show_top_bar = false;
    }
    this.lastScrollTop = current;
  },
  methods: {
    //加载更多帖子
    async fetchPosts(post, lt) {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_posts",
          data: {
            post_create_time: post ? post.create_time : null,
            // 传递最后一个帖子的 ID
            page_size: 5,
            // 每页显示的帖子数量
            lt,
            account_id: this.user.account_id
          }
        });
        if (res.result.code === 0) {
          const { posts } = res.result.data;
          common_vendor.index.__f__("log", "at pages/index/index.vue:399", "获取帖子成功:", posts);
          this.posts = [...this.posts, ...posts];
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:402", "获取帖子失败:", res.result.msg);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:405", "获取帖子时发生错误:", error);
      }
    },
    // 过滤帖子
    filterPosts() {
      this.filteredPosts = this.posts.filter((post) => {
        var _a, _b;
        const query = this.searchQuery.trim().toLowerCase();
        const matchesMain = post.content && post.content.toLowerCase().includes(query) || post.username && post.username.toLowerCase().includes(query);
        const matchesSource = post.post_type === 1 && (((_a = post.source_post) == null ? void 0 : _a.content) && post.source_post.content.toLowerCase().includes(query) || ((_b = post.source_post) == null ? void 0 : _b.username) && post.source_post.username.toLowerCase().includes(query));
        return matchesMain || matchesSource;
      });
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
    //跳转到发帖页面
    to_post(post, type) {
      let share_post = {};
      if (post) {
        if (post.post_type == 1 && post.source_post) {
          share_post = post.source_post;
        } else {
          share_post = post;
        }
      }
      common_vendor.index.navigateTo({
        url: "/pages/post/post",
        success: () => {
          common_vendor.PubSub.publish("to_post", {
            share_post,
            type,
            account_id: this.user.account_id,
            username: this.user.username,
            avatar: this.user.avatar
          });
        }
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
      common_vendor.index.showToast({
        title: "删除中",
        icon: "loading"
      });
      try {
        const res = await common_vendor.tr.callFunction({
          name: "delete_post",
          data: {
            post_id: post._id,
            account_id: post.account_id
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.hideToast();
          common_vendor.index.showToast({ title: "删除成功", icon: "success" });
          this.posts = this.posts.filter((p) => p._id !== post._id);
        } else {
          common_vendor.index.showToast({ title: "删除失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:496", "删除失败:", error);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
      } finally {
        common_vendor.index.hideToast();
      }
    },
    //点赞
    async like(item, post, comment, reply, type) {
      if (!this.user.account_id) {
        common_vendor.index.showToast({ title: "请登录", icon: "none" });
        return;
      }
      item.liked = !item.liked;
      item.like_count += item.liked ? 1 : -1;
      await this.getUserLocation();
      await this.resolve_ip();
      try {
        const res = await common_vendor.tr.callFunction({
          name: "user-liked",
          data: {
            target_id: item._id,
            post,
            comment,
            reply,
            account_id: this.user.account_id,
            type,
            ip: this.user.ip
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
          common_vendor.PubSub.publish("update_activity", 5);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:544", "点赞失败:", err);
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
    },
    //展示评论
    toggleComments(selectedPost) {
      this.filteredPosts.forEach((post) => {
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
        common_vendor.index.__f__("error", "at pages/index/index.vue:608", "获取评论失败:", error);
      }
    },
    // 提交评论或回复
    async submitComment(post, comment, reply, type, content) {
      if (!this.newComment.trim() && type == 0 || !this.newReply.trim() && type == 1 || !this.newReplyReply.trim() && type == 2) {
        common_vendor.index.showToast({ title: "评论不能为空", icon: "none" });
        return;
      }
      if (!this.user.account_id) {
        common_vendor.index.showToast({ title: "请登录", icon: "none" });
        return;
      }
      common_vendor.index.showToast({
        title: "评论中...",
        icon: "loading"
      });
      await this.getUserLocation();
      await this.resolve_ip();
      try {
        const res = await common_vendor.tr.callFunction({
          name: "submit_comment",
          data: {
            user: this.user,
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
            loading = false;
          }
          common_vendor.index.hideToast();
          common_vendor.index.showToast({ title: "评论成功", icon: "success" });
          common_vendor.PubSub.publish("update_activity", 10);
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "评论失败", icon: "none" });
      } finally {
        common_vendor.index.hideToast();
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
        common_vendor.index.__f__("error", "at pages/index/index.vue:682", "获取位置失败", e);
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
            common_vendor.index.__f__("log", "at pages/index/index.vue:723", "获取到的IP地址", this.user.ip);
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:727", "resolve_ip 请求失败:", err);
      }
    },
    // 长按评论或回复处理
    handleLongPressComment_Reply(postIndex, commentIndex, replyIndex, parent, item) {
      if (item.account_id && item.account_id !== this.user.account_id && !this.user.admin) {
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
      common_vendor.index.showToast({
        title: "删除中...",
        icon: "loading"
      });
      try {
        const res = await common_vendor.tr.callFunction({
          name: "delete_comment_reply",
          data: {
            parent,
            item
          }
        });
        if (res.result.code === 200) {
          common_vendor.index.hideToast();
          common_vendor.index.showToast({ title: "删除成功", icon: "success" });
          if (!("post_id" in item)) {
            common_vendor.index.__f__("log", "at pages/index/index.vue:772", "replies", res.result.data.replies);
            this.$set(this.posts[postIndex].comments[commentIndex], "replies", res.result.data.replies);
          } else {
            this.posts[postIndex].comments.splice(commentIndex, 1);
            this.posts[postIndex].comment_count -= 1;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:781", "删除失败:", error);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
      } finally {
        common_vendor.index.hideToast();
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
    // 登录
    async login_register(action, account_id, username, password, has_token) {
      const res = await common_vendor.tr.callFunction({
        name: "login_register",
        data: {
          action,
          account_id,
          username,
          password,
          has_token
        }
      });
      if (res.result.code === 200) {
        common_vendor.index.showToast({ title: "已登录", icon: "success" });
        const app = getApp();
        app.userInfo = res.result.userInfo;
        app.login_status = true;
        Object.keys(res.result.userInfo).forEach((key) => {
          this.user[key] = res.result.userInfo[key];
        });
        if (this.user.unread_messages) {
          common_vendor.index.showTabBarRedDot({
            index: 1
          });
        }
        common_vendor.index.setStorageSync("uid", res.result.userInfo.account_id);
      } else {
        this.posts = [];
        this.fetchPosts(null, false);
        common_vendor.index.removeStorageSync("uid");
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.show_top_bar
  }, $data.show_top_bar ? {
    b: common_assets._imports_0,
    c: common_vendor.o([($event) => $data.searchQuery = $event.detail.value, ($event) => $options.filterPosts()]),
    d: $data.searchQuery,
    e: common_assets._imports_1,
    f: common_vendor.o(($event) => $options.to_post(null, 0)),
    g: common_vendor.n({
      "no-shadow": $data.isAtTop
    })
  } : {}, {
    h: common_vendor.f($data.filteredPosts, (post, postIndex, i0) => {
      return common_vendor.e({
        a: post.avatar,
        b: common_vendor.o(($event) => $options.to_personal_info(post), post._id),
        c: common_vendor.t(post.username),
        d: common_vendor.t($options.formatDate(post.create_time)),
        e: common_vendor.t(post.ip),
        f: post.account_id == $data.user.account_id || $data.user.admin
      }, post.account_id == $data.user.account_id || $data.user.admin ? {
        g: common_assets._imports_2,
        h: common_vendor.o(() => $options.confirmDeletePost(post), post._id)
      } : {}, {
        i: post.post_type == 0
      }, post.post_type == 0 ? common_vendor.e({
        j: common_vendor.t(post.content),
        k: post.media.length > 1
      }, post.media.length > 1 ? common_vendor.e({
        l: Array.isArray(post.media) && post.media.length
      }, Array.isArray(post.media) && post.media.length ? {
        m: common_vendor.f(post.media, (media, mediaIndex, i1) => {
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
        n: common_vendor.n("media-count-" + post.media.length)
      } : {}) : post.media.length == 1 ? common_vendor.e({
        p: post.media[0].type === "image"
      }, post.media[0].type === "image" ? {
        q: post.media[0].url
      } : post.media[0].type === "video" ? {
        s: post.media[0].url
      } : {}, {
        r: post.media[0].type === "video",
        t: common_vendor.o(() => $options.previewMedia(post.media, 0), post._id)
      }) : {}, {
        o: post.media.length == 1
      }) : common_vendor.e({
        v: common_vendor.t(post.content),
        w: post.source_post.avatar
      }, post.source_post.avatar ? {
        x: post.source_post.avatar
      } : {}, {
        y: post.source_post.username
      }, post.source_post.username ? {
        z: common_vendor.t(post.source_post.username)
      } : {}, {
        A: post.source_post.create_time
      }, post.source_post.create_time ? {
        B: common_vendor.t($options.formatDate(post.source_post.create_time)),
        C: common_vendor.t(post.source_post.ip)
      } : {}, {
        D: post.source_post.content
      }, post.source_post.content ? {
        E: common_vendor.t(post.source_post.content)
      } : {}, {
        F: post.source_post.media
      }, post.source_post.media ? common_vendor.e({
        G: post.source_post.media.length > 1
      }, post.source_post.media.length > 1 ? common_vendor.e({
        H: Array.isArray(post.source_post.media) && post.source_post.media.length
      }, Array.isArray(post.source_post.media) && post.source_post.media.length ? {
        I: common_vendor.f(post.source_post.media, (media, mediaIndex, i1) => {
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
        J: common_vendor.n("media-count-" + post.source_post.media.length)
      } : {}) : post.source_post.media.length == 1 ? common_vendor.e({
        L: post.source_post.media[0].type === "image"
      }, post.source_post.media[0].type === "image" ? {
        M: post.source_post.media[0].url
      } : post.source_post.media[0].type === "video" ? {
        O: post.source_post.media[0].url
      } : {}, {
        N: post.source_post.media[0].type === "video",
        P: common_vendor.o(() => $options.previewMedia(post.source_post.media, 0), post._id)
      }) : {}, {
        K: post.source_post.media.length == 1
      }) : {}, {
        Q: common_vendor.o(($event) => $options.to_source_post(post), post._id)
      }), {
        R: common_vendor.t(post.device_model),
        S: post.visibility == "仅我可见"
      }, post.visibility == "仅我可见" ? {} : {}, {
        T: post.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
        U: post.liked ? 1 : "",
        V: common_vendor.t(post.like_count),
        W: common_vendor.o(() => $options.like(post, post, null, null, 0), post._id),
        X: common_vendor.t(post.comment_count || 0),
        Y: common_vendor.o(() => $options.toggleComments(post), post._id),
        Z: common_vendor.t(post.forward_count || 0),
        aa: common_vendor.o(() => $options.to_post(post, 1), post._id),
        ab: post.showComments
      }, post.showComments ? {
        ac: common_vendor.f(post.comments, (comment, commentIndex, i1) => {
          return common_vendor.e({
            a: comment.avatar,
            b: common_vendor.o(($event) => $options.to_personal_info(comment), comment._id),
            c: common_vendor.t(comment.username),
            d: common_vendor.t($options.formatDate(comment.create_time)),
            e: common_vendor.t(comment.ip),
            f: comment.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
            g: common_vendor.t(comment.like_count),
            h: common_vendor.o(() => $options.like(comment, post, comment, null, 1), comment._id),
            i: common_vendor.t(comment.content),
            j: common_vendor.o(() => $options.toggleReplyInput(comment), comment._id),
            k: comment.showReplyInput
          }, comment.showReplyInput ? {
            l: "回复" + comment.username + "...",
            m: $data.newReply,
            n: common_vendor.o(($event) => $data.newReply = $event.detail.value, comment._id),
            o: common_vendor.o(() => $options.submitComment(post, comment, null, 1, $data.newReply), comment._id)
          } : {}, {
            p: comment.replies.length && !comment.showReply
          }, comment.replies.length && !comment.showReply ? {
            q: common_vendor.t(comment.replies.length),
            r: common_vendor.o(($event) => comment.showReply = true, comment._id)
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
            v: comment._id,
            w: common_vendor.o(($event) => $options.handleLongPressComment_Reply(postIndex, commentIndex, null, post, comment), comment._id)
          });
        }),
        ad: $data.newComment,
        ae: common_vendor.o(($event) => $data.newComment = $event.detail.value, post._id),
        af: common_vendor.o(() => $options.submitComment(post, null, null, 0, $data.newComment), post._id),
        ag: common_vendor.o(() => {
        }, post._id)
      } : {}, {
        ah: post._id
      });
    }),
    i: common_assets._imports_3,
    j: common_assets._imports_4,
    k: $data.loading && !$data.loaded
  }, $data.loading && !$data.loaded ? {} : {}, {
    l: $data.loaded && !$data.loading
  }, $data.loaded && !$data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
