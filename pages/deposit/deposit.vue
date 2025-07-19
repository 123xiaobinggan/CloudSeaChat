<template>
  	<view class="deposit-container">
		<view class="deposit-header" @tap="handleBodyTap">
			<view class="deposit-header-title">
				<text>充值给</text>
			</view>	
			<view class="user-header">
				<text>{{ userInfo.username }}</text>
				<text>({{ userInfo.account_id }})</text>
			</view>
			<img :src="userInfo.avatar" class="avatar" />
			
		</view>

		<view class="deposit-body" @tap="handleBodyTap">
			<view class="input-amount">
				<text class="amount">金额</text>
				<view class="input-body" @tap.stop="isInputFocused = true">
					<img src="/static/deposit/人民币符号.png" class="RMB">
					
					<view class="fake-input">
						<text>{{ rechargeAmount }}</text>
						<view v-if="isInputFocused" class="cursor"></view>
					</view>
					
				</view>
			</view>

			<view  
				v-show="isInputFocused" 
				:class="{'keyboard-hidden': !isInputFocused}"
				class="keyboard" 
				@tap.stop
			>
				<!-- 九宫格 -->
				<view class="left-button">
					<view class="nine-keyboard">
						<view 
							v-for="(key, index) in keys" 
							:key="index" 
							class="key-item" 
							:class="{ 'active': activeiIndex === index}"
							@tap.stop="handleKeyPress(key)"
							@touchstart="setActive(index)"
							@touchend="removeActive(index)"
						>
							{{ key }}
						</view>
					</view>
					<view class="bottom-button" >
						<view 
							class="button-0" 
							:class="{ 'active': activeiIndex === '0'}"
							@tap.stop="handleKeyPress('0')" 
							@touchstart="setActive('0')"
							@touchend="removeActive('0')"
						>
							<text>0</text>
						</view>
						<view 
							class="dot-button" 
							:class="{ 'active': activeiIndex === '.'}"
							@tap.stop="handleKeyPress('.')"
							@touchstart="setActive('.')"
							@touchend="removeActive('.')"
						>
							<text>.</text>
						</view>
					</view>
				</view>
				<view class="right-button">
					<!-- 退格 -->
					<view 
						class="back-item" 
						:class="{ 'active': activeiIndex === 'back'}"
						@tap.stop="handleBackspace"
						@touchstart="setActive('back')"
						@touchend="removeActive('back')"
					>
						<image src="/static/deposit/退格键.png" class="back-icon" />
					</view>

					
				</view>
			</view>

			<!-- 充值键 -->
			<view 
				class="deposit-button" 
				:class="{ 'active1': hasInput, 'active2': activeiIndex === 'deposit','focused': isInputFocused }"
				@tap.stop="handleDeposit"
				@touchstart="setActive('deposit')"
				@touchend="removeActive('deposit')"
			>
				<text>充值</text>
			</view>
		</view>
	</view>

    
</template>

<script>
export default {
  data() {
    return {
	  userInfo: {
        account_id: '',
        username: '未登录',
        avatar: '/static/info/未登录.png',
	  },
	  keys: [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9', 
      ],
      rechargeAmount: '', // 当前充值金额
      isInputFocused: false, // 输入框是否获得焦点
	  hasInput: false, // 是否有输入
	  activeiIndex: -1, // 当前激活的按键索引
    };
  },
  watch:{
	  rechargeAmount(){
		this.isInputFocused = true;
		this.hasInput = this.rechargeAmount.toString().trim() !=='' && this.rechargeAmount >0;
	  }
  },
  onLoad(){
	  const app = getApp();
	  this.userInfo = app.userInfo;
	  this.isInputFocused = true;
  },

  methods: {
	handleKeyPress(key) {
		this.triggerVibrate();
		this.isInputFocused = true;
		if(this.rechargeAmount.includes('.')){
			const decimalPart = this.rechargeAmount.split('.')[1];
			if(decimalPart.length>=2 || key==='.'){
				return;
			}
		}
		if(key==='.' && this.rechargeAmount===''){
			this.rechargeAmount = '0';
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
	setActive(index){
		this.activeiIndex = index;
	},
	removeActive(){
		this.activeiIndex = -1;
	},
	async handleDeposit(){
		this.triggerVibrate();
		const amount = parseFloat(parseFloat(this.rechargeAmount).toFixed(2));
		if(amount<=0){
			uni.showToast({ title: '充值金额必须大于0', icon:'none' })
			return;
		}
		uni.showLoading({ title: '充值中...' })
		console.log('充值金额',amount,'元')
		const res = await uniCloud.callFunction({
			name: 'deposit',
			data: {
				account_id: this.userInfo.account_id,
				amount: amount
			}
		})
		if(res.result.code===200){
			uni.hideLoading()
			uni.showToast({ title: '充值成功', icon:'success' })
			const app = getApp();
			app.userInfo.balance += amount;
			app.userInfo.balance = parseFloat(parseFloat(app.userInfo.balance).toFixed(2));
			setTimeout(() => {
				uni.navigateBack();
			},1000)
		}
		else{
			uni.showToast({ title: '充值失败', icon:'none' })
		}
		uni.hideLoading()
		
	},
	triggerVibrate() {
		uni.vibrateShort(); // 模拟轻微反馈
		setTimeout(() => {
			uni.vibrateShort(); // 再次模拟轻微反馈
		}, 10);
		setTimeout(() => {
			uni.vibrateShort(); // 再次模拟轻微反馈
		}, 20);
		setTimeout(() => {
			uni.vibrateShort(); // 再次模拟轻微反馈
		}, 30);
	},
  },
  
  
};
</script>

<style scoped>
@import url(deposit.css)
</style>
