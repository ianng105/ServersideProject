const express=require("express");
const OAuth = require("oauth").OAuth;
const consumerKey = 'b163d5b0a9774fa4a666cc2b83b1b7cf';
const consumerSecret = 'b608d0210f044f22a9404cd15261b80c';
const accessToken = '';
const tokenSecret = '';
const path = require('path');
const app=express();
const{connectDB}=require('./model/mongo')
const User= require('./model/user');
const Userbody= require('./model/userbody');
const Post= require('./model/post');
const PORT = process.env.PORT || 8080;
const cors = require('cors');
const session = require('express-session');
const oa = new OAuth(
  null,
  null,
  consumerKey,
  consumerSecret,
  '1.0', // OAuth version
  null, // Callback URL (null if not using 3-legged OAuth)
  'HMAC-SHA1' // Signature method (common for OAuth 1.0; check API docs)
);

// 设置 EJS 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// 托管静态文件（将你的 welcome.css / welcome.js / 以及 register_page.html, login.html 放到 public/ 下）
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));  // for form data (x-www-form-urlencoded)
app.use(express.json());                          // if you ever send JSON (optional but good to have)

//=======================connect mongoDB=================//
connectDB()
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
app.use(cors({
  origin: 'http://localhost:8080', // 前端页面的地址（与实际端口一致）
  credentials: true, // 允许携带Cookie
}));

//==================session==========================//
app.use(session({
  secret: 'your-secret-key-here', // 生产环境应使用环境变量
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1天有效期
  }
}));

//==================search from fatSecret=========================//
app.get('/searchCalories',(req, res)=>{
	const apiUrl = `https://platform.fatsecret.com/rest/foods/search/v4?search_expression=${req.query.foodInput}&format=json&include_sub_categories=true&flag_default_serving=true&include_food_attributes=true&include_food_images=false&max_results=10&language=en&region=US&page_number=0`;

	 oa.get(
	    apiUrl, // The protected API endpoint
	    accessToken,
	    tokenSecret,
	    (error, data, response) => {
	      if (error) {
		console.error('Error:', error);
		return res.status(500).json({ error: 'API request failed' });
	      }
	      // Parse and send the response data
	      //res.json(JSON.parse(data));
	     const obj = JSON.parse(data);
    const foodArray = obj.foods_search.results.food;

    const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
    const totalCalories = eatenList.reduce((sum, it) => {
      const c = Number(it.calories) || 0;
      const q = Number(it.quantity) || 1;
      return sum + c * q;
    }, 0);
	      /*for(let i=0;i<foodArray.length;i++){	      		
	      		const servingArray=foodArray[i].servings.serving
	      }
	      */
	      res.render('searchFood',{foodarray:foodArray, eatenList, totalCalories });
	      
	      
	    }
  	);
  	
});

//====================display posts in main page=====================//
app.get('/main', async (req, res) => {
  if (!req.session.loggedIn) {
    console.log("Go back to first page");
    return res.redirect("login");
  }
  try {
    const rawPosts = await Post.findAllPosts();

    const posts = rawPosts.map(p => ({
      ...p,
      user: { username: p.username || '匿名用户' },
      image: p.image || null,
      caption: typeof p.caption === 'string' ? p.caption : ''
    }));

    // 新增：把 session 中的用户名传给 EJS
    const displayName = req.session.username || '用户';

    // 新增：把已吃列表与总卡路里传入 main.ejs
    const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
    const totalCalories = eatenList.reduce((sum, it) => {
      const c = Number(it.calories) || 0;
      const q = Number(it.quantity) || 1;
      return sum + c * q;
    }, 0);

    res.render('main', { posts, displayName,eatenList,totalCalories });
  } catch (err) {
    console.error('加载帖子失败:', err);
    res.status(500).send('服务器错误，无法加载帖子');
  }
});

//===================route=============================//
app.get('/bodyInfo', (req, res) => {
  res.render('bodyInfo');
});

app.get('/bodyInfoForm', (req, res) => {
  res.render('bodyInfoForm');
});

app.get('/logout',(req,res)=>{
	res.redirect('login');
});

app.get('/', (req, res) => {
  res.render('welcome'); // 首页
});

app.get('/login', (req, res) => {
  res.render('login'); // 登录页
});

app.get('/register', (req, res) => {
  res.render('register'); // 注册页
});

app.get('/searchFood',(req,res)=>{
const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
  const totalCalories = eatenList.reduce((sum, it) => {
    const c = Number(it.calories) || 0;
    const q = Number(it.quantity) || 1;
    return sum + c * q;
  }, 0);
  res.render('searchFood', { foodarray: [], eatenList, totalCalories });
});

app.get('/newPost', (req, res) => {
  res.render('newPost'); 
});

app.get('/userProfile', (req, res) => {
  // 这里传入一个可选的占位 user，便于 EJS 展示
  const username = req.session?.username || '匿名用户';
  res.render('userProfile', {
    user: {
      username,
      avatar: '/images/avatar.jpg',
      plan: 'Keep a balanced workout: 3x strength + 2x cardio per week'
    }
  });
});

//=========================register=======================//

app.post('/register',async (req,res)=>{
  console.log("register function start");
  try {
    const email=req.body.email;
    console.log("email: ",email);
    const password = req.body.password;
    const username = req.body.username;
    console.log("password: ",password);
    if (!email || !password){
    	return res.status(400).send('邮箱与密码必填');
    } 
    if (password.length < 10) return res.status(400).send('密码至少 10 位');

    // 检查邮箱是否已存在
    console.log("before find userbyusername");
    const exists = await User.findUserByUsername(username);
    console.log(exists);
    console.log("it works");
    if (exists){
    	res.resirect('/login');
    }

   await User.createUser({
      username,
      email,
      password,
    })
    req.session.email=email;
    req.session.username=username;
    req.session.loggedIn=true;
    console.log("email: ",req.session.email);
    console.log("username: ",req.session.username);
    // 注册成功后跳转到 bodyInfoForm
    return res.redirect(302, '/bodyInfoForm');
  } catch (e) {
    console.error("This is the error message ",e);
    res.render('/register');
  }

});

//new part

//==================submit from body info form to db=====================//
app.post('/submit-body-info', async (req, res) => {
  // 从 cookie 拿到刚注册的用户名（如果你以后要做登录系统，这里会改成 req.session.user）
  const username = req.session.username;

  if (!username) {
    return res.status(400).send('无法识别用户，请重新注册');
  }
const height=Number(req.body.height);
const weight= Number(req.body.weight);
const  gender= req.body.gender;
const  birthday=req.body.birthday ? new Date(req.body.birthday) : null;
const  activity=req.body.activity || null;
const goal=req.body.goal || null;
const user = await User.findUserByUsername(username);
const bmr = calculateBMR({ gender, height, weight, birthday });
const tdeeRaw = bmr ? calculateTDEE(bmr, activity) : null;
const tdee = tdeeRaw ? Math.round(tdeeRaw) : null;
 let maximum = null;
  let minimum = null;
    if (tdee) {
      const g = (goal || '').toLowerCase();

      if (g.includes('gain')) {
        // 增肌
        maximum = tdee + 500;
        minimum = tdee + 200;
      } else if (g.includes('lose')) {
        // 减脂
        maximum = tdee - 200;
        minimum = tdee - 500;
      } else {
        // 未选择或其他：这里可给一个保守范围，或置空
        maximum = tdee;   // 你也可以选择 tdee + 100
        minimum = tdee;   // 或 tdee - 100
      }
    }
  console.log("user_id: ",user._id);
  const bodyInfo = {
    userId: user._id,
    height: Number(req.body.height),
    weight: Number(req.body.weight),
    gender: req.body.gender,
    birthday: req.body.birthday ? new Date(req.body.birthday) : null,
    activity: req.body.activity || null,
    goal: req.body.goal || null,
    TDEE:tdeeRaw ? Math.round(tdeeRaw) : null,
		maximumIntake:maximum ? maximum:null,
		minimumIntake:minimum ? minimum:null,
  };


  try {
    await Userbody.createUserBody(bodyInfo);
    // ★成功后跳转到主页面
    return res.redirect('/main');
  } catch (err) {
    console.error('保存身体信息失败:', err);
    return res.status(500).send('保存失败，请重试');
  }
});

//================login==================//
app.post('/login', async (req, res) => {
  console.log('🔵 收到登录请求 (表单提交)');

  try {
    // 1. 获取表单数据 (express.urlencoded 中间件会解析)
    const { email, password } = req.body;
    console.log('🔵 请求体内容:', req.body);

    // 2. 验证输入
    if (!email || !password) {
      console.log('🔴 错误：邮箱或密码为空');
      // 可以使用 flash message 显示错误，这里为简化，直接重定向回登录页
      return res.redirect('/login?error=empty');
    }

    // 3. 查找用户
    console.log(`🔵 正在数据库中查找用户: ${email}`);
    const user = await User.findUserByEmail(email);

    if (!user) {
      console.log(`🔴 错误：未找到用户 ${email}`);
      return res.redirect('/login?error=invalid');
    }

    // 4. 验证密码
    console.log('🔵 找到用户，正在验证密码...');
    if (user.password !== password) {
      console.log('🔴 错误：密码不匹配');
      return res.redirect('/login?error=invalid');
    }

    // 5. 登录成功，设置会话
    req.session.userId = user._id;
    req.session.email = user.email;
    req.session.username=user.username;
    console.log(req.session.username);
    req.session.loggedIn = true;
    console.log(`🟢 用户 ${req.session.username} 登录成功，会话已创建`);

    // 6. 重定向到主页
    res.redirect('/main');

  } catch (error) {
    console.error('🔴 登录过程中发生严重错误:', error);
    // 服务器错误，重定向到错误页或登录页
    res.redirect('/login?error=server');
  }
});



// =================add to list=================//
// 工具：确保 session 列表存在
function ensureEatenList(req) {
  if (!req.session.eatenList) req.session.eatenList = [];
  return req.session.eatenList;
}

// 计算总卡路里（以 number 存储的 calories 求和）
function calcTotalCalories(list) {
  return list.reduce((sum, item) => {
    const cals = Number(item.calories) || 0;
    const qty = Number(item.quantity) || 1; // 允许前端传份数，默认1
    return sum + cals * qty;
  }, 0);
}



// 将食物加入 session 列表
app.post('/eaten/add', (req, res) => {
  // 期望字段：food_name, calories, serving_description, [quantity]
  // 注意：calories 由 searchFood 的接口结果传来，是每份的卡路里
  const { food_name, calories, serving_description, quantity } = req.body;

  if (!food_name || calories === undefined) {
    return res.status(400).send('缺少必要字段');
  }

  const list = ensureEatenList(req);

  // 入列的最小结构
  list.push({
    id: Date.now().toString(),       // 简单本地ID便于删除
    food_name: String(food_name),
    calories: Number(calories),      // 每份卡路里
    serving_description: serving_description ? String(serving_description) : '',
    quantity: quantity ? Number(quantity) : 1
  });

  req.session.eatenList = list;
  // 根据需要选择返回：重定向回搜索页，或返回 JSON
  // 这里使用重定向，如果有 query 可回传
  return res.redirect('back');
});

// 工具：确保 session 列表存在
function ensureEatenList(req) {
  if (!req.session.eatenList) req.session.eatenList = [];
  return req.session.eatenList;
}

// 计算总卡路里（以 number 存储的 calories 求和）
function calcTotalCalories(list) {
  return list.reduce((sum, item) => {
    const cals = Number(item.calories) || 0;
    const qty = Number(item.quantity) || 1; // 允许前端传份数，默认1
    return sum + cals * qty;
  }, 0);
}



app.post('/eaten/add', (req, res) => {


  const { food_name, calories, serving_description, quantity } = req.body;

  if (!food_name || calories === undefined) {
    return res.status(400).send('缺少必要字段');
  }

  const list = ensureEatenList(req);

  
  list.push({
    id: Date.now().toString(),       
    id: Date.now().toString(),      
    food_name: String(food_name),
    calories: Number(calories),      
    calories: Number(calories),      
    serving_description: serving_description ? String(serving_description) : '',
    quantity: quantity ? Number(quantity) : 1
  });

  req.session.eatenList = list;
  return res.redirect('back');
});


app.post('/eaten/remove', (req, res) => {
  const { id } = req.body;
  const list = ensureEatenList(req);
  const idx = list.findIndex(x => x.id === id);
  if (idx >= 0) list.splice(idx, 1);
  return res.redirect('back');
});

// 查看当前 session 中的已吃列表（便于调试/展示）
app.get('/eaten', (req, res) => {
  const list = ensureEatenList(req);
  const totalCalories = calcTotalCalories(list);
  // 你也可以改为 res.render('eaten', { list, totalCalories });
  res.json({ list, totalCalories });
});


//================Restful api=================//
app.get('/api/posts/:username',async(req,res)=>{
	const result= await Post.findPostByUsername(req.params.username);
	for(let i=0;i<result.length;i++){
		console.log("This is the result ",result[i]);
	}
	res.status(200).type("json").json(result);
});


app.post('/api/posts',async(req,res)=>{
		const un= await User.findUserByUsername(req.body.username);
		if(!un){
			res.status(404).json({error:"User not found"});
		}
		if(req.body.password!=un.password){
			res.status(404).json({error:"incorrect password"});
		}
		postData={
			username:un.username,
			image:req.body.image,
			calories:Number(req.body.calories),
			caption:req.body.caption,
			date:new Date()
			
		};
		const result= await Post.createPost(postData);
		res.status(200).type("json").json(result);

})


app.put('/api/posts/:post_id',async(req,res)=>{
	const un= await User.findUserByUsername(req.body.username);
	if(!un){
		res.status(404).json({error:"User not found"});
	}
	if(req.body.password!=un.password){
		res.status(404).json({error:"incorrect password"});
	}
	const updateData={
		image:req.body.image,
		calories:req.body.calories,
		caption:req.body.caption,
	};
	
	await Post.updatePost(req.params.post_id,updateData);
	const result = await  Post.findPostById(req.params.post_id);
	res.status(200).type("json").json(result);
})

app.delete("/api/posts/:post_id",async(req,res)=>{
	Post.deletePost(req.params.post_id);
	res.status(200).json({message:"Success"});
})

//================listen======================//
async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

//------------nutrition--------------//
// utils/nutrition.js
function getAgeFromDOB(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// gender: 'male' | 'female' | 'other'
// height(cm), weight(kg), birthday(Date|ISO string)
function calculateBMR({ gender, height, weight, birthday }) {
  const age = getAgeFromDOB(birthday);
  if (
    typeof height !== 'number' || !isFinite(height) || height <= 0 ||
    typeof weight !== 'number' || !isFinite(weight) || weight <= 0 ||
    age === null || age < 0 || !isFinite(age)
  ) {
    return null;
  }

  const g = (gender || '').toLowerCase();
  if (g === 'male') {
    // Men: BMR = 88.362 + (13.397 x kg) + (4.799 x cm) – (5.677 x age)
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  // Women: BMR = 447.593 + (9.247 x kg) + (3.098 x cm) – (4.330 x age)
  return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
}

// activity: '', 'sedentary','light','moderate','active','very_active'
function calculateTDEE(bmr, activity) {
  if (typeof bmr !== 'number' || !isFinite(bmr) || bmr <= 0) return null;
  const factors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  const factor = factors[(activity || '').toLowerCase()];
  if (!factor) return null;
  return bmr * factor;
}

start();
