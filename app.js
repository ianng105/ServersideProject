const express=require("express");
const path = require('path');
const app=express();
const PORT = 8080;
// 解析表单提交
app.use(express.urlencoded({ extended: true }));
// 模板引擎与视图目录
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// 静态资源目录（确保你的 CSS/JS 放在 public 下）
app.use(express.static(path.join(__dirname, 'public')));
// 首页（由 login.html 内容改写）
app.get('/', (req, res) => {
  res.render('welcome', {
    title: 'HealthyPal',
    appLabel: 'app',
    welcome: 'Welcome to use',
    product: 'HealthyPal',
    tagline: 'Are you ready to start? Tracking begins now!',
    bullets: [
      'Understand the effects of diet and exercise',
      'Make mindful eating a long-term habit'
    ],
    registerHref: '/register',
    loginHref: '/login',
    registerText: 'Register For Free',
    loginText: 'Login',
    version: '1.0.0',

    // 覆盖为你的真实 CSS/JS 路径
    cssHref: '/css/login.css', // 例如 '/css/app.css'
 jsSrc: '/js/login.js',    // 如果有前端脚本，取消注释并设置路径
  });
});
// 占位路由（按需替换为真实页面）
app.get('/register', (req, res) => res.send('Register page'));
app.get('/login', (req, res) => res.send('Login page'));

// 登录页（渲染你转换的 EJS 模板）
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'login page',
    pageHeading: 'login page',
    loginTitle: 'Login',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    loginButton: 'Login',
    orText: 'OR',
    facebookText: 'Continue through Facebook',
    privacyNote: 'We will not disclose any information without your permission.',

    // 路由与资源
    formAction: '/login',
    formMethod: 'POST',
    facebookHref: '/auth/facebook',

    // 覆盖为你的真实 CSS/JS 路径
    cssHref: '/css/login_page.css', // 例如 '/css/app.css'
    jsSrc: '/js/login_page.js',    // 如有前端脚本，取消注释并设置路径
  });
});

// 简单的登录提交占位处理（请替换为真实校验）
app.post('/login', (req, res) => {
  const { email } = req.body;
  // 这里做你的验证/会话处理
  res.send(`Logged in as ${email || 'unknown'}`);
});

// Facebook OAuth 占位（按需替换为真实第三方登录流程）
app.get('/auth/facebook', (req, res) => {
  res.send('Redirecting to Facebook OAuth (placeholder)');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

  });
