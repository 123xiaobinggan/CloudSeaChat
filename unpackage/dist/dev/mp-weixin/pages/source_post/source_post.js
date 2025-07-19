"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      post_id: "",
      user: {
        account_id: "",
        username: "",
        avatar: "/static/info/未登录.png",
        admin: false
      },
      post: {},
      newComment: "",
      newReply: "",
      newReplyReply: "",
      replyPlaceholder: "发表评论...",
      // 回复框的占位符
      last_showInput: null,
      // 记录上一个显示的输入框
      isLoading: true,
      // 是否正在加载
      no_post: false,
      // 是否没有帖子
      token: ""
    };
  },
  onLoad(option) {
    this.post_id = option.post_id;
    this.user.account_id = option.account_id;
    this.user.username = option.username || "未登录";
    this.user.avatar = option.avatar || "/static/info/未登录.png";
    this.user.admin = option.admin;
    common_vendor.index.showLoading({
      title: "加载中...",
      mask: true
    });
    this.fetchPost(this.post_id);
  },
  onUnload() {
    if (this.no_post) {
      common_vendor.index.$emit("return_from_source_post", this.post_id);
    }
    if (this.token) {
      common_vendor.PubSub.unsubscribe(this.token);
      this.token = "";
    }
  },
  methods: {
    //获取帖子和评论
    async fetchPost(post_id) {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "get_target_post",
          data: {
            post_id,
            account_id: this.user.account_id
          }
        });
        if (res.result.code === 200) {
          this.post = res.result.data;
          this.post.showComments = true;
          common_vendor.index.__f__("log", "at pages/source_post/source_post.vue:231", "comments", this.post.comments);
          common_vendor.index.showToast({
            title: "加载成功",
            icon: "success",
            duration: 1e3
          });
        } else {
          this.no_post = true;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/source_post/source_post.vue:241", "获取帖子失败", e);
      } finally {
        common_vendor.index.hideLoading();
        this.isLoading = false;
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
    //点赞
    async like(item, post, comment, reply, type) {
      if (!this.user.account_id) {
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
            account_id: this.user.account_id,
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
          common_vendor.PubSub.publish("update_activity", 5);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/source_post/source_post.vue:308", "点赞失败:", err);
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
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
          this.post = {};
          this.no_post = true;
        } else {
          common_vendor.index.showToast({ title: "删除失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/source_post/source_post.vue:342", "删除失败:", error);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
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
          }
          common_vendor.index.showToast({ title: "评论成功", icon: "success" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "评论失败", icon: "none" });
      }
    },
    //处理长按事件删除comment或reply
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
            common_vendor.index.__f__("log", "at pages/source_post/source_post.vue:436", "replies", res.result.data.replies);
            this.$set(this.posts[postIndex].comments[commentIndex], "replies", res.result.data.replies);
          } else {
            this.posts[postIndex].comments.splice(commentIndex, 1);
            this.posts[postIndex].comment_count -= 1;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/source_post/source_post.vue:445", "删除失败:", error);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
      }
    },
    // 切换回复输入框的显示状态
    toggleReplyInput(item) {
      this.$set(item, "showReplyInput", !item.showReplyInput);
      if (this.last_showInput && this.last_showInput !== item) {
        this.last_showInput.showReplyInput = false;
      }
      this.last_showInput = item;
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
    //跳转到个人信息页面
    to_personal_info(user) {
      if (user.account_id == this.user.account_id) {
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/personal_info/personal_info?account_id=${user.account_id}&visitor_account_id=${this.user.account_id}&visitor_admin=${this.user.admin}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d;
  return common_vendor.e({
    a: !$data.isLoading
  }, !$data.isLoading ? common_vendor.e({
    b: !$data.no_post
  }, !$data.no_post ? common_vendor.e({
    c: $data.post.avatar,
    d: common_vendor.t($data.post.username),
    e: common_vendor.t($options.formatDate($data.post.create_time)),
    f: common_vendor.t($data.post.ip),
    g: $data.post.account_id == $data.user.account_id || $data.user.admin
  }, $data.post.account_id == $data.user.account_id || $data.user.admin ? {
    h: common_assets._imports_2,
    i: common_vendor.o(() => $options.confirmDeletePost($data.post))
  } : {}, {
    j: common_vendor.t($data.post.content),
    k: ((_a = $data.post.media) == null ? void 0 : _a.length) > 1
  }, ((_b = $data.post.media) == null ? void 0 : _b.length) > 1 ? common_vendor.e({
    l: Array.isArray($data.post.media) && $data.post.media.length
  }, Array.isArray($data.post.media) && $data.post.media.length ? {
    m: common_vendor.f($data.post.media, (media, mediaIndex, i0) => {
      return common_vendor.e({
        a: media.type === "image"
      }, media.type === "image" ? {
        b: media.url
      } : media.type === "video" ? {
        d: media.url
      } : {}, {
        c: media.type === "video",
        e: mediaIndex,
        f: common_vendor.o(() => $options.previewMedia($data.post.media, mediaIndex), mediaIndex)
      });
    }),
    n: common_vendor.n("media-count-" + $data.post.media.length)
  } : {}) : ((_c = $data.post.media) == null ? void 0 : _c.length) === 1 ? common_vendor.e({
    p: $data.post.media[0].type === "image"
  }, $data.post.media[0].type === "image" ? {
    q: $data.post.media[0].url
  } : $data.post.media[0].type === "video" ? {
    s: $data.post.media[0].url
  } : {}, {
    r: $data.post.media[0].type === "video",
    t: common_vendor.o(() => $options.previewMedia($data.post.media, 0))
  }) : {}, {
    o: ((_d = $data.post.media) == null ? void 0 : _d.length) === 1,
    v: $data.post.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
    w: $data.post.liked ? 1 : "",
    x: common_vendor.t($data.post.like_count),
    y: common_vendor.o(() => $options.like($data.post, $data.post, null, null, 0)),
    z: common_assets._imports_3,
    A: common_vendor.t($data.post.comment_count || 0),
    B: common_assets._imports_4,
    C: common_vendor.t($data.post.forward_count || 0),
    D: common_vendor.o(() => $options.to_post($data.post, 1)),
    E: $data.post.showComments
  }, $data.post.showComments ? {
    F: common_vendor.f($data.post.comments, (comment, commentIndex, i0) => {
      var _a2, _b2;
      return common_vendor.e({
        a: comment.avatar,
        b: common_vendor.o(($event) => $options.to_personal_info(comment), comment._id),
        c: common_vendor.t(comment.username),
        d: common_vendor.t($options.formatDate(comment.create_time)),
        e: common_vendor.t(comment.ip),
        f: comment.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
        g: common_vendor.t(comment.like_count),
        h: common_vendor.o(() => $options.like(comment, $data.post, comment, null, 1), comment._id),
        i: common_vendor.t(comment.content),
        j: common_vendor.o(() => $options.toggleReplyInput(comment), comment._id),
        k: comment.showReplyInput
      }, comment.showReplyInput ? {
        l: "回复" + comment.username + "...",
        m: $data.newReply,
        n: common_vendor.o(($event) => $data.newReply = $event.detail.value, comment._id),
        o: common_vendor.o(() => $options.submitComment($data.post, comment, null, 1, $data.newReply), comment._id)
      } : {}, {
        p: ((_a2 = comment.replies) == null ? void 0 : _a2.length) && !comment.showReply
      }, ((_b2 = comment.replies) == null ? void 0 : _b2.length) && !comment.showReply ? {
        q: common_vendor.t(comment.replies.length),
        r: common_vendor.o(($event) => comment.showReply = true, comment._id)
      } : {}, {
        s: comment.showReply
      }, comment.showReply ? {
        t: common_vendor.f(comment.replies, (reply, replyIndex, i1) => {
          return common_vendor.e({
            a: reply.avatar,
            b: common_vendor.o(($event) => $options.to_personal_info(reply), reply._id),
            c: common_vendor.t(reply.username),
            d: common_vendor.t($options.formatDate(reply.date)),
            e: common_vendor.t(reply.ip),
            f: reply.liked ? "/static/index/已赞.png" : "/static/index/赞.png",
            g: common_vendor.t(reply.like_count),
            h: common_vendor.o(() => $options.like(reply, $data.post, comment, reply, 2), reply._id),
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
            q: common_vendor.o(() => $options.submitComment($data.post, comment, reply, 2, $data.newReplyReply), reply._id)
          } : {}, {
            r: reply._id,
            s: common_vendor.o(($event) => $options.handleLongPressComment_Reply(_ctx.postIndex, commentIndex, replyIndex, comment, reply), reply._id)
          });
        })
      } : {}, {
        v: comment._id,
        w: common_vendor.o(($event) => $options.handleLongPressComment_Reply(_ctx.postIndex, commentIndex, null, $data.post, comment), comment._id)
      });
    }),
    G: $data.newComment,
    H: common_vendor.o(($event) => $data.newComment = $event.detail.value),
    I: common_vendor.o(() => $options.submitComment($data.post, null, null, 0, $data.newComment)),
    J: common_vendor.o(() => {
    })
  } : {}) : {}) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-36662ccc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/source_post/source_post.js.map
