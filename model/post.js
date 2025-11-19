const { MongoClient, ObjectId } = require('mongodb');

// 复用 MongoDB Atlas 连接字符串
const uri = "mongodb+srv://hui125514_db_user:1234@c1uster0.96ftjs5.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);
const dbName = "healthypal";
const collectionName = "post";

// 连接数据库并获取集合
async function getCollection() {
  await client.connect();
  return client.db(dbName).collection(collectionName);
}

// 创建帖子（关联用户ID）
async function createPost(postData) {
  const collection = await getCollection();
  try {
    const result = await collection.insertOne(postData);
    return { ...postData, _id: result.insertedId };
  } finally {
    await client.close();
  }
}

// 查询所有帖子（关联用户信息）
async function findAllPosts() {
  const collection = await getCollection();
  try {
    // 模拟关联查询（原生驱动需手动join，此处简化为查询后前端处理）
    return await collection.find().toArray();
  } finally {
    await client.close();
  }
}

// 根据ID查询帖子
async function findPostById(id) {
  const collection = await getCollection();
  try {
    return await collection.findOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

// 更新帖子
async function updatePost(id, updateData) {
  const collection = await getCollection();
  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  } finally {
    await client.close();
  }
}

// 删除帖子
async function deletePost(id) {
  const collection = await getCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } finally {
    await client.close();
  }
}

module.exports = {
  createPost,
  findAllPosts,
  findPostById,
  updatePost,
  deletePost
};