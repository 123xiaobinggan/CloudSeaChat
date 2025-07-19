'use strict';
exports.main = async (event, context) => {
	let userIP =context.CLIENTIP || event.clientIP || '未知'; // 获取用户IP地址;
	console.log('userIP',userIP)

	return {
		code: 200,
		msg: '请求成功',
		data: userIP
	}
};
