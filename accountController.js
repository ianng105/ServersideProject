const User = require("../model/user");
const Userbody = require('../model/userbody');
const Post = require('../model/post');
//====================create account/user register===============//
exports.register=async (req, res) => {
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
};

// =====================update user account=======================//
exports.update=(upload)= async (req, res) => {
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
};
//======================delete user account=======================//
exports.Delete=async (req, res) => {
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
};
//====================edit user body data in profile==============
exports.edit=async (req, res) => {
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
};
//========================display in user profile==================//
exports.userProfile= async (req, res) => {
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
}
