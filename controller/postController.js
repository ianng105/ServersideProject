const Post = require('../model/post');

/**
 * 修改用户自己的帖子
 * 仅帖子作者可修改，需验证登录状态和权限
 */
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