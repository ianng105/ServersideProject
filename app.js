const express = require("express");
const path = require('path');
const session = require('express-session');
const cors = require('cors'); // 新增：引入cors模块
const app = express();
const { connectDB } = require('./model/mongo');
const User = require('./model/user');
const PORT = process.env.PORT || 8080;


// 设置 EJS 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// 托管静态文件时，添加缓存控制（开发环境禁用缓存）
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 // 开发环境缓存时效为0
}));
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

// 启动时连接 MongoDB
connectDB()
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

// 根路由
app.get('/', (req, res) => {
  res.render('welcome');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/main', (req, res) => {
  // 新增：验证登录状态
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  
  const mockPosts = [
    {
      user: {
        username: '健康达人',
        avatar: '/images/avatar.jpg'
      },
      image: 'https://picsum.photos/id/1/600/400',
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
  res.render('main', { posts: mockPosts });
});

app.get('/bodyInfo', (req, res) => {
  res.render('bodyInfo');
});

app.get('/bodyInfoForm', (req, res) => {
  res.render('bodyInfoForm');
});

// 新增：处理登出
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/login');
  });
});

app.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱与密码必填' }); // 改为JSON
    } 
    if (password.length < 10) {
      return res.status(400).json({ message: '密码至少 10 位' }); // 改为JSON
    }

    const exists = await User.findUserByUsername(email);
    if (exists) {
      return res.status(400).json({ message: '邮箱已被注册' }); // 改为JSON
    }
  
    await User.createUser({
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ success: true, message: '注册成功', redirect: '/bodyInfoForm' }); // 改为JSON
  } catch (e) {
    console.error("注册错误:", e);
    res.status(500).json({ message: '注册失败，请重试' }); // 改为JSON
  }
});

// 处理登录请求
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

async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
