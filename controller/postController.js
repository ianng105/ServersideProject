const Post = require('../model/post');
const User = require('../model/user');
const Userbody = require('../model/userbody');

//====================create new post============================//
exports.createPost=(uploadPost)=async (req, res) => {
  try {
    if (!req.session || !req.session.loggedIn) {
      return res.redirect('/login');
    }
    const username = req.session.username;
    const currentUser=await User.findUserByUsername(username);
    const avatar=currentUser.avatar;
    console.log(avatar);
    const { caption, image } = req.body; 
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
};
//======================update post==============================//
exports.update=(uploadPost)=async (req, res) => {
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
};


//======================edit post================================//
exports.edit= async (req, res) => {
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
};

//========================main page post display================//
exports.display= async (req, res) => {
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
};

//=========================delete post========================//
exports.Delete=async (req, res) => {
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
};
//=============================================



exports.updateOwnPost = async (req, res) => {
  try {
    // 从会话获取当前登录用户信息
    const currentUserId = req.session.userId;
    const currentUsername = req.session.username;
    
    // 验证用户是否登录
    if (!currentUserId || !currentUsername) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }

    // 获取请求参数
    const { id } = req.params; // 帖子ID
    const { caption, image } = req.body; // 要更新的内容（ caption 为帖子文字内容，image 为可选图片地址）

    // 验证帖子是否存在
    const post = await Post.findPostById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: '帖子不存在' 
      });
    }

    // 验证是否为帖子作者（通过用户名匹配）
    if (post.username !== currentUsername) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限修改此帖子' 
      });
    }

    // 准备更新数据（仅更新提供的字段，添加修改时间）
    const updateData = {};
    if (caption !== undefined) updateData.caption = caption;
    if (image !== undefined) updateData.image = image;
    updateData.updatedAt = new Date(); // 记录修改时间

    // 执行更新操作
    const updateResult = await Post.updatePost(id, updateData);
    if (updateResult) {
      return res.status(200).json({ 
        success: true, 
        message: '帖子更新成功',
        postId: id 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: '更新失败，请重试' 
      });
    }

  } catch (error) {
    console.error('修改帖子失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误，无法更新帖子' 
    });
  }
};

/**
 * 删除用户自己的帖子
 * 仅帖子作者可删除，需验证登录状态和权限
 */
exports.deleteOwnPost = async (req, res) => {
  try {
    // 从会话获取当前登录用户信息
    const currentUserId = req.session.userId;
    const currentUsername = req.session.username;
    
    // 验证用户是否登录
    if (!currentUserId || !currentUsername) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }

    // 获取帖子ID
    const { id } = req.params;

    // 验证帖子是否存在
    const post = await Post.findPostById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: '帖子不存在' 
      });
    }

    // 验证是否为帖子作者（通过用户名匹配）
    if (post.username !== currentUsername) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限删除此帖子' 
      });
    }

    // 执行删除操作
    const deleteResult = await Post.deletePost(id);
    if (deleteResult) {
      return res.status(200).json({ 
        success: true, 
        message: '帖子删除成功',
        postId: id 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: '删除失败，请重试' 
      });
    }

  } catch (error) {
    console.error('删除帖子失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误，无法删除帖子' 
    });
  }
};
