'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
  
  const { action, account_id, username, password, has_token} = event;
  const db = uniCloud.database();
  const usersCollection = db.collection('users');


  if (action === 'login') {
	if ((!password || !account_id) && !has_token) {
	  return { code: 1, msg: '用户名或密码不能为空' };
	} 

	const { data } = await usersCollection.where({
	  account_id: account_id,
	}).get();

	if (data.length > 0) {
		if(data[0].password !== password && !has_token){
			return { code: 3, msg: '密码错误' };
		}
		//console.log('登录成功', data[0]);
		return { 
			code: 200, 
			msg: '登录成功',
			userInfo: data[0]
		}; 
	}

	else {
	  return { 
		code: 403, 
		msg: '用户ID错误' 
	  }; 
	}
  }

  //注册
  if (action === 'register') {
	
	
	const { data } = await usersCollection.where({
	  account_id: account_id	
	}).get();

	if (data.length > 0) {
	  return { code: 2, msg: 'ID已存在' };	
	}

	const userInfo = {
		account_id: account_id,
		username: username,
		password: password,
		description: '这个人很懒，什么都没有留下',
		avatar: '/static/info/未登录.png',
		background: 'https://mp-ad47c7bd-10fe-4cc5-9ad0-a7ff552214bc.cdn.bspapp.com/Personal_background/sunset.jpg',
		level: 0,
		activity: 0,
		coupon: 0,
		points: 0,
		balance: 0,
		create_time: new Date().toISOString(),
		admin: false,
		post_count: 0,
		visitor_count: 0
	}
	
	const res = await usersCollection.add({
		...userInfo	
	});
	return { 
		code: 200, 
		msg: '注册成功',
		userInfo: userInfo
	 };
  }
};