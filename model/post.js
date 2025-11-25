const { MongoClient, ObjectId } = require('mongodb');
const{getDB} = require("./mongo");
const collectionName = "post";
class Post{
// 连接数据库并获取集合
  static async  getCollection() {
      const db=getDB();
		  return await db.collection(collectionName);
}

// 创建帖子（关联用户ID）
   static async  createPost(postData) {
     const collection =await Post.getCollection();
     const result = await collection.insertOne(postData);
     console.log(result);
     return { ...postData, _id: result.insertedId };
}

// 查询所有帖子（关联用户信息）
    static async  findAllPosts() {
    const collection = await Post.getCollection();
  
    // 模拟关联查询（原生驱动需手动join，此处简化为查询后前端处理）
    return await collection.find().toArray();
 
}

// 根据ID查询帖子
  static async findPostById(id) {
  const collection = await Post.getCollection();
  
    return await collection.findOne({ _id: new ObjectId(id) });
 
  
}

  static async findPostByUsername(Username) {
  const collection = await Post.getCollection();
  const result =await collection.find({ username: Username }).toArray();
  for(let i=0;i<result.length;i++){
		console.log("This is the result ",result[i]);
	}
    return result ;
 
  
}

// 更新帖子
  static async updatePost(id, updateData) {
  const collection = await Post.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  
}
static async updateMany(filter, updateData) {
  const collection = await Post.getCollection();
  return await collection.updateMany(filter, updateData);
}

// 删除帖子
  static async deletePost(id) {
  const collection = await Post.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  
  }

}

module.exports = {
  createPost:Post.createPost,
  findAllPosts:Post.findAllPosts,
  findPostById:Post.findPostById,
  findPostByUsername:Post.findPostByUsername,
  updatePost:Post.updatePost,
  deletePost:Post.deletePost,
  updateMany: Post.updateMany,
};
