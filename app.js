const express = require("express");
const OAuth = require("oauth").OAuth;
const consumerKey = 'b163d5b0a9774fa4a666cc2b83b1b7cf';
const consumerSecret = 'b608d0210f044f22a9404cd15261b80c';
const accessToken = '';
const tokenSecret = '';
const path = require('path');
const app = express();
const { connectDB } = require('./model/mongo');
const User = require('./model/user');
const Userbody = require('./model/userbody');
const Post = require('./model/post');
const PORT = process.env.PORT || 8080;
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const methodOverride = require('method-override'); // 新增：文件上传中间件
const authCon=require("./controller/authenticationController");
const postCon = require('./controller/postController');
const accCon = require('./controller/accountController');
const listCon = require('./controller/listController');
const calCon = require('./controller/calculatorController');
const restfulCon= require('./controller/restfulController');
// 配置头像上传存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保路径是 public/uploads/avatars（与实际文件夹一致）
    cb(null, 'public/uploads/avatars');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

const storagePost = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保路径是 public/uploads/avatars（与实际文件夹一致）
    cb(null, 'public/uploads/images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});
const uploadPost = multer({ storage: storagePost });

const oa = new OAuth(
  null,
  null,
  consumerKey,
  consumerSecret,
  '1.0',
  null,
  'HMAC-SHA1'
);

// 设置 EJS 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// 托管静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// 连接 MongoDB
connectDB()
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

// CORS 配置
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

// Session 配置
//***delete the comment for server use***
//const MongoStore = require('connect-mongo'); 
app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  /*store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60   // session 有效期（秒）
  }),
  */
  cookie: {
    secure: /*false*/process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// 从 fatSecret 搜索食物卡路里
app.get('/searchCalories', (req, res) => {
  const apiUrl = `https://platform.fatsecret.com/rest/foods/search/v4?search_expression=${req.query.foodInput}&format=json&include_sub_categories=true&flag_default_serving=true&include_food_attributes=true&include_food_images=false&max_results=10&language=en&region=US&page_number=0`;

  oa.get(
    apiUrl,
    accessToken,
    tokenSecret,
    (error, data, response) => {
      if (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'API request failed' });
      }
      const obj = JSON.parse(data);
      const foodArray = obj.foods_search.results.food;
      const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
      const totalCalories = eatenList.reduce((sum, it) => {
        const c = Number(it.calories) || 0;
        const q = Number(it.quantity) || 1;
        return sum + c * q;
      }, 0);
      res.render('searchFood', { foodarray: foodArray, eatenList, totalCalories });
    }
  );
});

app.get('/editPost/:id',postCon.edit);


app.get('/main',postCon.display);//display posts in main page
//=============auth===================//
app.post('/login', authCon.login);//login
app.get('/logout', authCon.logout);//logout

//==============routes===============//
app.get('/', (req, res) => {
  res.render('welcome');
});

// 登录页
app.get('/login', (req, res) => {
  res.render('login');
});

// 注册页
app.get('/register', (req, res) => {
  res.render('register');
});

// 搜索食物页面
app.get('/searchFood', (req, res) => {
  const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
  const totalCalories = eatenList.reduce((sum, it) => {
    const c = Number(it.calories) || 0;
    const q = Number(it.quantity) || 1;
    return sum + c * q;
  }, 0);
  res.render('searchFood', { foodarray: [], eatenList, totalCalories });
});

// 新建帖子页面
app.get('/newPost', (req, res) => {
 res.render('newPost', { editing: false, post: {} });
});

app.get('/bodyInfo', async (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/login');

  let userBody = {};
  try {
    const result = await Userbody.findUserBodyByUserId(req.session.userId);
    if (result) userBody = result;
  } catch (err) {
    console.error('读取体测数据失败:', err);
  }
  res.render('bodyInfo', { userBody });
});

//==============account operation==========================//
// 个人资料页
app.get('/userProfile', accCon.userProfile);

// 编辑资料页面
app.get('/editProfile', accCon.edit);

// 页面版：删除帖子后返回 userProfile 页面 working on here
app.post('/posts/:id/delete',postCon.Delete);

app.post('/updatePost/:id', uploadPost.single('image'),postCon.update);
// 处理资料更新提交（含头像上传）
app.post('/updateProfile', upload.single('avatar'), accCon.update);
app.post('/register', accCon.register);
app.post('/delete', accCon.Delete);


//----------------post---------------//
app.post('/newPost', uploadPost.single('image'),postCon.createPost);
// 修改帖子（使用 PATCH 方法更符合 RESTful 规范）
app.patch('/posts/:id', postCon.updateOwnPost);
// 删除帖子
app.delete('/posts/:id', postCon.deleteOwnPost);

//==============list=================//
// 添加食物到已吃列表
app.post('/eaten/add',listCon.add);

// 从已吃列表移除食物
app.post('/eaten/remove',listCon.remove);

// 查看已吃列表（调试用）
app.get('/eaten',listCon.show);

//=======================bodyInfo====================//
app.post('/submit-body-info',calCon.submit);
app.post('/bodyInfo',calCon.update);
//=======================Restful API=================//
app.get('/api/posts/:username', restfulCon.read);
app.post('/api/posts', uploadPost.single('image'),restfulCon.create);
app.put('/api/posts/:post_id',restfulCon.update);
app.delete("/api/posts/:post_id", restfulCon.Delete);

// 启动服务器
async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
