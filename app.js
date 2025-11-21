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

// 启动时连接 MongoDB（失败直接退出）
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
// 新增：配置session
app.use(session({
  secret: 'your-secret-key-here', // 生产环境应使用环境变量
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1天有效期
  }
}));
// 根路由，渲染 welcome.ejs

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
	res.render('searchFood.ejs',{foodarray:[]});
})

app.get('/newPost', (req, res) => {
  res.render('newPost'); 
});

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
	      const obj=JSON.parse(data);
	      const foodArray = obj.foods_search.results.food;
	      /*for(let i=0;i<foodArray.length;i++){	      		
	      		const servingArray=foodArray[i].servings.serving
	      }
	      */
	      res.render('searchFood',{foodarray:foodArray});
	      
	      
	    }
  	);
  	
})

app.get('/main', async (req, res) => {
  try {
    const rawPosts = await Post.findAllPosts(); // 从 MongoDB 读取

    // 映射成 main.ejs 期望的结构
    const posts = rawPosts.map(p => ({
      ...p,
      user: { username: p.username || '匿名用户' }, // username -> user.username
      image: p.image || null,
      caption: typeof p.caption === 'string' ? p.caption : ''
    }));

    res.render('main', { posts });
  } catch (err) {
    console.error('加载帖子失败:', err);
    res.status(500).send('服务器错误，无法加载帖子');
  }
});

app.get('/bodyInfo', (req, res) => {
  res.render('bodyInfo');
});

app.get('/bodyInfoForm', (req, res) => {
  res.render('bodyInfoForm');
});

app.get('/logout',(req,res)=>{
	res.redirect('login');
});

// 注册提交

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
    console.log("it works");
    if (exists){
    	res.render('/register');
    }
	
   await User.createUser({
      username,
      email,
      password,
    });

    // 注册成功后跳转到 bodyInfoForm
    return res.redirect(302, '/bodyInfoForm');
  } catch (e) {
    console.error("This is the error message ",e);
    res.render('/register');
  }
	
});

//new part
app.post('/submit-body-info', async (req, res) => {
  // 从 cookie 拿到刚注册的用户名（如果你以后要做登录系统，这里会改成 req.session.user）
  const username = req.cookies.temp_username;

  if (!username) {
    return res.status(400).send('无法识别用户，请重新注册');
  }

  const bodyInfo = {
    height: Number(req.body.height),
    weight: Number(req.body.weight),
    gender: req.body.gender,
    birthday: req.body.birthday ? new Date(req.body.birthday) : null,
    bodyFat: req.body.bodyFat ? Number(req.body.bodyFat) : null,
    waist: req.body.waist ? Number(req.body.waist) : null,
    hip: req.body.hip ? Number(req.body.hip) : null,
    neck: req.body.neck ? Number(req.body.neck) : null,
    activity: req.body.activity || null,
    goal: req.body.goal || null,
  };

  try {
    await User.updateBodyInfo(username, bodyInfo);

    // 提交完毕，清除临时 cookie（防止重复提交）
    res.clearCookie('temp_username');

    // ★成功后跳转到主页面
    return res.redirect('/main');
  } catch (err) {
    console.error('保存身体信息失败:', err);
    return res.status(500).send('保存失败，请重试');
  }
});

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
    const user = await User.findUserByUsername(email);
    
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
    req.session.loggedIn = true;
    console.log(`🟢 用户 ${email} 登录成功，会话已创建`);
    
    // 6. 重定向到主页
    res.redirect('/main');

  } catch (error) {
    console.error('🔴 登录过程中发生严重错误:', error);
    // 服务器错误，重定向到错误页或登录页
    res.redirect('/login?error=server');
  }
});


//end 

async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

