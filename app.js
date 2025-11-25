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
    cb(null, 'public/uploads/avatars');
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
const MongoStore = require('connect-mongo');
app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60   // session 有效期（秒）
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
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
app.get('/editPost/:id', async (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/login');

  const postId = req.params.id;
  const post = await Post.findPostById(postId);

  if (!post || post.username !== req.session.username) {
    return res.status(403).send("无权限编辑该帖子");
  }

  res.render('newPost', {
    editing: true,
    post
  });
});

// 主页（显示帖子 + 同步用户数据到前端）
app.get('/main', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("login");
  }
  try {

    const rawPosts = await Post.findAllPosts();
    const posts = rawPosts.map(p => ({
      ...p,
      user: { username: p.username || '匿名用户' },
      avatar:p.avatar,
      image: p.image || null,
      caption: typeof p.caption === 'string' ? p.caption : '',
      healthyJudge:p.healthyJudge
    }));
    // 新增：从数据库获取当前用户的完整信息
    const currentUser = await User.findUserByUsername(req.session.username);
    const displayName = req.session.username || '用户';
    const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
    const totalCalories = eatenList.reduce((sum, it) => {
      const c = Number(it.calories) || 0;
      const q = Number(it.quantity) || 1;
      return sum + c * q;
    }, 0);
    const username = req.session.username;
    res.render('main', { posts, displayName, eatenList, totalCalories, currentUser,username});
  } catch (err) {
    console.error('加载帖子失败:', err);
    res.status(500).send('服务器错误，无法加载帖子');
  }
});

// 身体信息表单页面
app.get('/bodyInfoForm', (req, res) => {
  res.render('bodyInfoForm');
});



// 登出
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
});

// 首页
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

// 个人资料页
app.get('/userProfile', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  try {
    const user = await User.findUserByUsername(req.session.username);
    if (!user) {
      return res.status(404).send('用户不存在');
    }
    const userBody = await Userbody.findUserBodyByUserId(user._id);
    const userProfileData = { ...user, ...userBody };
    const posts = await Post.findPostByUsername(req.session.username);
    res.render('userProfile', { user: userProfileData,posts });
  } catch (err) {
    console.error('加载个人资料失败:', err);
    res.status(500).send('服务器错误');
  }
});

// 编辑资料页面
app.get('/editProfile', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  try {
    const user = await User.findUserByUsername(req.session.username);
    if (!user) {
      return res.status(404).send('用户不存在');
    }
    const userBody = await Userbody.findUserBodyByUserId(user._id);
    res.render('editProfile', {
      user: {
        username: user.username,
        email: user.email,
        profile: user.profile || '',
        avatar: user.avatar || '',
        ...(userBody && {
          height: userBody.height,
          weight: userBody.weight,
          gender: userBody.gender,
          birthday: userBody.birthday ? userBody.birthday.toISOString().split('T')[0] : '',
          activity: userBody.activityLevel,
          goal: userBody.goal
        })
      }
    });
  } catch (err) {
    console.error('加载编辑页面失败:', err);
    res.status(500).send('服务器错误');
  }
});

// 页面版：删除帖子后返回 userProfile 页面
app.post('/posts/:id/delete', async (req, res) => {
  try {
    if (!req.session.loggedIn) {
      return res.redirect('/login');
    }

    const postId = req.params.id;

    // 调用 controller 检查权限并删除
    const post = await Post.findPostById(postId);
    if (!post) {
      return res.redirect('/userProfile?error=notfound');
    }

    if (post.username !== req.session.username) {
      return res.redirect('/userProfile?error=forbidden');
    }

    await Post.deletePost(postId);

    return res.redirect('/userProfile?success=deleted');

  } catch (err) {
    console.error('删除帖子失败:', err);
    return res.redirect('/userProfile?error=server');
  }
});

app.post('/updatePost/:id', uploadPost.single('image'), async (req, res) => {
  try {
    if (!req.session.loggedIn) return res.redirect('/login');

    const postId = req.params.id;
    const post = await Post.findPostById(postId);

    if (!post || post.username !== req.session.username) {
      return res.status(403).send("无权限编辑该帖子");
    }

    const updateData = {
      caption: req.body.caption
    };

    if (req.file) {
      updateData.image = '/uploads/images/' + req.file.filename;
    }

    await Post.updatePost(postId, updateData);

    return res.redirect('/userProfile');
  } catch (err) {
    console.error("更新帖子失败:", err);
    res.status(500).send("帖子更新失败，请重试");
  }
});

// 处理资料更新提交（含头像上传）
app.post('/updateProfile', upload.single('avatar'), async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  try {
    const username = req.session.username;
    const user = await User.findUserByUsername(username);
    if (!user) {
      return res.status(404).send('用户不存在');
    }

    // 更新用户基本信息
    const userUpdates = {};
    if (req.body.newUsername && req.body.newUsername !== username) {
      const existing = await User.findUserByUsername(req.body.newUsername);
      if (existing) {
        return res.redirect('/editProfile?error=usernameExists');
      }
      const newUsername = req.body.newUsername;
      userUpdates.username = req.body.newUsername;
      req.session.username = req.body.newUsername;
       await Post.updateMany(
        { username: username },
        { $set: { username: newUsername } }
  );
  req.session.username = newUsername;
    }
    if (req.body.newEmail && req.body.newEmail !== user.email) {
      userUpdates.email = req.body.newEmail;
      req.session.email = req.body.newEmail;
    }
    if (req.body.profile !== undefined) {
      userUpdates.profile = req.body.profile;
    }
    if (req.file) {
      userUpdates.avatar = '/uploads/avatars/' + req.file.filename;
      await Post.updateMany(
    { username: username },
    { $set: { avatar: userUpdates.avatar } }
  );
    }
    if (Object.keys(userUpdates).length > 0) {
      await User.updateUser(user._id, userUpdates);
    }
     
    
    res.redirect('/userProfile?success=updated');
  } catch (err) {
    console.error('更新资料失败:', err);
    res.redirect('/editProfile?error=server');
  }
});

// 注册
app.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).send('用户名、邮箱与密码必填');
    }
    if (password.length < 10) return res.status(400).send('密码至少 10 位');
    const exists = await User.findUserByUsername(username);
    if (exists) {
      return res.status(400).send('用户名已存在');
    }
    const newUser=await User.createUser({ username, email, password });
    req.session.userId = newUser._id;
    req.session.email = email;
    req.session.username = username;
    req.session.loggedIn = true;
    return res.redirect('/bodyInfoForm');
  } catch (e) {
    console.error("注册错误:", e);
    res.redirect('/register?error=1');
  }
});
//=======================delete account=================//
app.post('/delete', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const username = req.session.username;

    // Find and delete posts
    const deletePosts = await Post.findPostByUsername(username);
    for (let i = 0; i < deletePosts.length; i++) {
      await Post.deletePost(deletePosts[i]._id);
    }

    // Find user and delete
    const user = await User.findUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }
    const id = user._id;

    await Userbody.deleteUserBody(id);
    await User.deleteUser(id);

    console.log(`finish delete ${username} 's account`);

    // Destroy session after deletions
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy failed:', err);
        return res.status(500).send('Failed to delete account');
      }
      return res.redirect('/');
    });
  } catch (err) {
    console.error('Deletion failed:', err);
    res.status(500).send('Server error during deletion');
  }
});


//----------------post---------------//
// 提交新帖子（表单版本）
app.post('/newPost', uploadPost.single('image'),async (req, res) => {
  try {
    if (!req.session || !req.session.loggedIn) {
      return res.redirect('/login');
    }
    const username = req.session.username;
    const currentUser=await User.findUserByUsername(username);
    const avatar=currentUser.avatar;
    console.log(avatar);
    const { caption, image } = req.body; // newPost.ejs 中的 name 需对应

    // 从 session 取已吃列表与总热量，作为快照保存到帖子（可选）
    const eatenList = Array.isArray(req.session.eatenList) ? req.session.eatenList : [];
    const totalCalories = eatenList.reduce((sum, it) => {
      const c = Number(it.calories) || 0;
      const q = Number(it.quantity) || 1;
      return sum + c * q;
    }, 0);
    const bodyInfo = await Userbody.findUserBodyByUserId(req.session.userId);
    let healthyJudge="Unknown"
    if (bodyInfo && bodyInfo.minimumIntake && bodyInfo.maximumIntake) {
  const mIn = bodyInfo.minimumIntake / 3;
  const mAx = bodyInfo.maximumIntake / 3;

    console.log("maximum: ",mAx);
    console.log("minimum: ",mIn);
    if(totalCalories>=mIn && totalCalories<=mAx){
    	 healthyJudge="Healthy";
    }
    else if(totalCalories<mIn){
    	 healthyJudge="Unhealthy";
    }
    else{
    	 healthyJudge="Fat";
    }
  }
    
    const postData = {
      username,
      avatar,
      image: req.file ? '/uploads/images/'+req.file.filename : null,
      caption: typeof caption == 'string' ? caption : '',
      eatenListSnapshot: eatenList,              // 可选
      totalCaloriesSnapshot: totalCalories,    
      healthyJudge:healthyJudge,
      date: new Date()
    };

    await Post.createPost(postData);
	console.log(postData.iamge);
    // 发帖成功后跳转主页
    return res.redirect('/main');
  } catch (err) {
    console.error('发布帖子失败:', err);
    return res.status(500).send('发布失败，请重试');
  }
});

// 提交身体信息
app.post('/submit-body-info', async (req, res) => {
  const username = req.session.username;
  if (!username) {
    return res.status(400).send('无法识别用户，请重新注册');
  }
  try {
    const { height, weight, gender, birthday, activity, goal } = req.body;
    const user = await User.findUserByUsername(username);
    const bmr = calculateBMR({ gender, height: Number(height), weight: Number(weight), birthday: new Date(birthday) });
    const tdeeRaw = bmr ? calculateTDEE(bmr, activity) : null;
    const tdee = tdeeRaw ? Math.round(tdeeRaw) : null;
    let maximum = null, minimum = null;
    if (tdee) {
      const g = (goal || '').toLowerCase();
      if (g.includes('gain')) {
        maximum = tdee + 500;
        minimum = tdee + 200;
      } else if (g.includes('lose')) {
        maximum = tdee - 200;
        minimum = tdee - 500;
      } else {
        maximum = tdee;
        minimum = tdee;
      }
    }
    const bodyInfo = {
      userId: user._id,
      height: Number(height),
      weight: Number(weight),
      gender,
      birthday: new Date(birthday),
      activityLevel: activity || null,
      goal: goal || null,
      TDEE: tdee,
      maximumIntake: maximum,
      minimumIntake: minimum,
    };
    await Userbody.createUserBody(bodyInfo);
    res.redirect('/main');
  } catch (err) {
    console.error('保存身体信息失败:', err);
    res.status(500).send('保存失败，请重试');
  }
});

// 登录
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.redirect('/login?error=empty');
    }
    const user = await User.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.redirect('/login?error=invalid');
    }
    req.session.userId = user._id;
    req.session.email = user.email;
    req.session.username = user.username;
    req.session.loggedIn = true;
    res.redirect('/main');
  } catch (error) {
    console.error('登录错误:', error);
    res.redirect('/login?error=server');
  }
});

const postController = require('./controller/postController');
// 修改帖子（使用 PATCH 方法更符合 RESTful 规范）
app.patch('/posts/:id', postController.updateOwnPost);

// 删除帖子
app.delete('/posts/:id', postController.deleteOwnPost);


// 添加食物到已吃列表
app.post('/eaten/add', (req, res) => {
  const { food_name, calories, serving_description, quantity } = req.body;
  if (!food_name || calories === undefined) {
    return res.status(400).send('缺少必要字段');
  }
  if (!req.session.eatenList) req.session.eatenList = [];
  req.session.eatenList.push({
    id: Date.now().toString(),
    food_name: String(food_name),
    calories: Number(calories),
    serving_description: serving_description ? String(serving_description) : '',
    quantity: quantity ? Number(quantity) : 1
  });
  res.redirect('back');
});

// 从已吃列表移除食物
app.post('/eaten/remove', (req, res) => {
  const { id } = req.body;
  if (req.session.eatenList) {
    req.session.eatenList = req.session.eatenList.filter(item => item.id !== id);
  }
  res.redirect('back');
});

// 查看已吃列表（调试用）
app.get('/eaten', (req, res) => {
  const list = req.session.eatenList || [];
  const totalCalories = list.reduce((sum, item) => {
    const cals = Number(item.calories) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + cals * qty;
  }, 0);
  res.json({ list, totalCalories });
});

// ======================RESTful API - create
app.post('/api/posts', uploadPost.single('image'),async (req, res) => {
  try {
     const { username,calories, caption } = req.body;
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: '获取帖子失败' });
  }
});

// RESTful API - 创建帖子
app.post('/api/posts', async (req, res) => {
  try {
    const { username, password, image, calories, caption } = req.body;
    const un = await User.findUserByUsername(username);
    const body = await Userbody.findUserBodyByUserId(un._id);
    const mIn=body.minimumIntake
    const mAx=body.maximumIntake;
    let healthyJudge = "";
    if(calories>=mIn && calories<=mAx){
    	healthyJudge="Healthy";
    }
    if(calories>mAx){
    	healthyJudge="Fat";
    }
    if(calories<mIn){
    	healthyJudge="Unhealthy";
    }
    const postData = {
      username: un.username,
      image:req.file ? '/uploads/images/'+req.file.filename : null,
      calories: Number(calories),
      caption,
      healthyJudge,
      date: new Date()
    };
    const result = await Post.createPost(postData);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: '创建帖子失败' });
  }
});

//========================RESTful API - update
app.put('/api/posts/:post_id',uploadPost.single('image'),async (req, res) => {
  try {
    const { username, caption ,calories} = req.body;
    const un = await User.findUserByUsername(username);
    const updateData = { image:req.file ? '/uploads/images/'+req.file.filename : null, calories: Number(calories), caption };
    await Post.updatePost(req.params.post_id, updateData);
    const result = await Post.findPostById(req.params.post_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: '更新帖子失败' });
  }
});

// RESTful API - 删除帖子
app.delete("/api/posts/:post_id", async (req, res) => {
  try {
    await Post.deletePost(req.params.post_id);
    res.status(200).json({ message: "删除成功" });
  } catch (err) {
    res.status(500).json({ error: '删除帖子失败' });
  }
});

// 营养计算工具函数
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

function calculateBMR({ gender, height, weight, birthday }) {
  const age = getAgeFromDOB(birthday);
  if (typeof height !== 'number' || !isFinite(height) || height <= 0 ||
    typeof weight !== 'number' || !isFinite(weight) || weight <= 0 ||
    age === null || age < 0 || !isFinite(age)) {
    return null;
  }
  const g = (gender || '').toLowerCase();
  if (g === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
}

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

//111

app.get('/bodyInfo', async (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/login');

  let userBody = {};
  try {
    const result = await Userbody.findUserBodyByUserId(req.session.userId);
    if (result) userBody = result;
  } catch (err) {
    console.error('读取体测数据失败:', err);
  }

  // 这一行是生死线！必须传 userBody
 
  res.render('bodyInfo', { userBody });
});

app.post('/bodyInfo', async (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/login');

  const userId = req.session.userId;

  try {
    // 1. 取出用户真正能改的6个字段
    const { height, weight, gender, birthday, activityLevel, goal } = req.body;

    // 2. 计算年龄（你原来就有的函数）
    const getAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };

    const age = birthday ? getAge(birthday) : null;

    // 3. 计算 BMR 和 TDEE（你原来就有的函数，直接用）
    let TDEE = null;
    let maximumIntake = null;
    let minimumIntake = null;

    if (height && weight && gender && age && activityLevel) {
      const bmr = gender === 'male'
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

      const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };

      TDEE = Math.round(bmr * (activityFactors[activityLevel] || 1.2));

      // 根据目标计算建议摄入范围
      if (goal === 'lose') {
        maximumIntake = TDEE - 200;
        minimumIntake = TDEE - 500;
      } else if (goal === 'gain') {
        maximumIntake = TDEE + 500;
        minimumIntake = TDEE + 200;
      } else {
        maximumIntake = TDEE;
        minimumIntake = TDEE;
      }
    }

    // 4. 构造干净的要保存的数据（这三个是我们算好的！）
    const dataToSave = {
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      gender: gender || null,
      birthday: birthday ? new Date(birthday) : null,
      activityLevel: activityLevel || null,
      goal: goal || null,
      TDEE,
      maximumIntake,
      minimumIntake
    };

    // 5. 保存或更新
    const existing = await Userbody.findUserBodyByUserId(userId);
    if (existing) {
      await Userbody.updateUserBody(userId, dataToSave);
    } else {
      await Userbody.createUserBody({ userId, ...dataToSave });
    }

    res.redirect('/bodyInfo');
  } catch (err) {
    console.error('保存体测数据失败:', err);
    res.status(500).send('保存失败，请重试');
  }
});

// 启动服务器
async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
