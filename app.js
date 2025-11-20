const express=require("express");
const path = require('path');
const app=express();
const{connectDB}=require('./model/mongo')
const User= require('./model/user');
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


// 1. 新增 /main 路由，用于渲染模仿 Instagram 布局的主页
app.get('/main', (req, res) => {
  // 2. 新增模拟帖子数据（传递给 main.ejs 渲染动态内容）
  const mockPosts = [
    {
      user: {
        username: '健康达人',
        avatar: '/images/avatar.jpg' // 头像路径（需放在 public/images 下）
      },
      image: 'https://picsum.photos/id/1/600/400', // 随机帖子图片
      caption: '今天的健身成果，坚持就是胜利！💪'
    },
    {
      user: {
        username: '美食博主',
        avatar: '/images/avatar.jpg'
      },
      image: 'https://picsum.photos/id/292/600/400',
      caption: '分享一道健康又美味的沙拉 recipe 🥗'
    }
  ];

  // 3. 渲染 main.ejs，并传递 mockPosts 数据
  res.render('main', { posts: mockPosts });
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
    console.log("password: ",password);
    if (!email || !password){
    	return res.status(400).send('邮箱与密码必填');
    } 
    if (password.length < 10) return res.status(400).send('密码至少 10 位');

    // 检查邮箱是否已存在
    console.log("before find userbyusername");
    const exists = await User.findUserByUsername(email);
    console.log("it works");
    if (exists){
    	res.render('/register');
    }
	
   await User.createUser({
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
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

