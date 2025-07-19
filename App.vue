<script>
import PubSub from 'pubsub-js';
export default 
{
	data(){
		return { 
			userInfo: {
				account_id: null,
				username: '未登录', // 保持逗号
				description: '这个人很懒，什么都没有留下',
				avatar: '/static/info/未登录.png',
				level: 0,
				activity: 0,
				coupon: 0,
				points: 0,
				balance: 0,
				ip: '',
				admin: false // 是否为管理员
			}, 
			login_status: false, // 登录状态
			activityTimer: null,  // 定时器
			activityStartTime: null,  // 启动时间戳（ms）
			activityElapsedSeconds: 0, // 已累计时间（秒）
		};
	},
	onLaunch: function() {
		console.log('App Launch')
		PubSub.subscribe('remind_upgrade', (msg,level) => {
			console.log('收到升级提醒',level)
			uni.showModal({
				title: `升级了`,
				content: `🎉 恭喜你升级到 V${level}`,
				showCancel: false,
				confirmText: '知道了',
			});
		})
		PubSub.subscribe('update_activity', async (msg,activity) => {
			const app = getApp();
			if(!app.userInfo.account_id) {
				console.log('未登录，跳过更新活动值')
				return;
			}
			app.userInfo.activity += activity;
			if(app.userInfo.activity>=100) {
				app.userInfo.activity %= 100;
				app.userInfo.level += 1;
				console.log(' 升级了')
				PubSub.publish('remind_upgrade',app.userInfo.level);
			}
			try{
				await uniCloud.callFunction({
				name: 'update_activity',
				data: {
					account_id: app.userInfo.account_id,
					level: app.userInfo.level,
					activity: app.userInfo.activity
				}
				});
			} catch(e) {
				console.error(e);
			}
		})
	},
	onShow: function() {
		console.log('App Show')

		// 记录时间
		this.activityStartTime = Date.now();

		// 清除旧定时器（避免重复）
		if (this.activityTimer) {
			clearInterval(this.activityTimer);
		}

		// 启动新定时器
		this.activityTimer = setInterval(() => {
			const now = Date.now();
			const elapsed = Math.floor((now - this.activityStartTime) / 1000); // 秒数
			// console.log('已累计时间:', elapsed)
			if (elapsed > this.activityElapsedSeconds) {
				const diff = elapsed - this.activityElapsedSeconds;
				this.activityElapsedSeconds = elapsed;

				const addedActivity = Math.floor(diff / 60); // 每 60 秒加1点
				// console.log('增加活动值:', addedActivity,diff)
				if (addedActivity > 0) {
					
					const app = getApp();
					// console.log('增加活动值',app.userInfo.account_id)
					if(app.userInfo.account_id) {
						// console.log('更新活动值')
						PubSub.publish('update_activity',addedActivity);
					}
				}
			}
		}, 60000); // 每60秒检测一次
	},
	onHide: function() {
		console.log('App Hide')
		if (this.activityTimer) {
			clearInterval(this.activityTimer);
			this.activityTimer = null;
		}
	},

}
</script>

<style>
	/*每个页面公共css */
</style>