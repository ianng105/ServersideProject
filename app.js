const express=require("express");
const path = require('path');
const app=express();
const PORT = process.env.PORT || 8080;
// 设置 EJS 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 托管静态文件（将你的 welcome.css / welcome.js / 以及 register_page.html, login.html 放到 public/ 下）
app.use(express.static(path.join(__dirname, 'public')));

// 根路由，渲染 welcome.ejs
app.get('/', (req, res) => {
  res.render('welcome');
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

  });
