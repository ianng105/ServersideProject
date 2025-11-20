const express=require("express");
const path = require('path');
const app=express();
const{connectDB}=require('./model/mongo')
const User= require('./model/user');
const Post= require('./model/post');
const PORT = process.env.PORT || 8080;
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

async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

