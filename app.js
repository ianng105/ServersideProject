const express=require("express");
const path = require('path');
const app=express();
const PORT = process.env.PORT || 8080;
// 设置 EJS 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// 托管静态文件（将你的 welcome.css / welcome.js / 以及 register_page.html, login.html 放到 public/ 下）
app.use(express.static(path.join(__dirname, 'public')));

// 根路由，渲染 welcome.ejs

app.get('/', (req, res) => {
  res.redirect('./welcome');
});

app.get('/welcome', (req, res) => {
  res.status(200).render('welcome');
});//首页

app.get('/login', (req, res) => {
  res.render('login'); // 登录页
});

app.get('/login/main', (req, res) => {
  res.render('main'); // 主界面
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

  });
