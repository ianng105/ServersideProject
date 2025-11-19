const { MongoClient } = require('mongodb');

// 1. 数据库配置
const uri = 'mongodb://localhost:27017'; // 你的 MongoDB 连接字符串
const client = new MongoClient(uri);
const dbName = 'healthypal'; // 你的数据库名称（改）
const collectionName = 'posts'; // 你的集合名称（改）

// 2. 连接数据库的辅助函数
async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client.db(dbName).collection(collectionName);
  } catch (err) {
    console.error('Connection error:', err);
    throw err; // 将错误向上抛出
  }
}

// 3. CRUD 操作实现

// Create (创建)
async function createPost(postData) {
  const collection = await connectDB();
  try {
    const result = await collection.insertOne(postData);
    // 返回创建的文档，包含自动生成的 _id
    return { ...postData, _id: result.insertedId };
  } finally {
    await client.close(); // 操作完成后关闭连接
  }
}

// Read (读取) - 获取所有帖子
async function findAllPosts() {
  const collection = await connectDB();
  try {c
    // find() 返回一个游标，需要用 toArray() 转换为数组
    return await collection.find({}).toArray();
  } finally {
    await client.close();
  }
}

// Read (读取) - 根据 ID 获取单个帖子
async function findPostById(id) {
  const collection = await connectDB();
  try {
    // MongoDB 的 _id 是 ObjectId 类型，需要用 new ObjectId(id) 转换
    return await collection.findOne({ _id: new require('mongodb').ObjectId(id) });
  } finally {
    await client.close();
  }
}

// Update (更新)
async function updatePost(id, updateData) {
  const collection = await connectDB();
  try {
    const result = await collection.updateOne(
      { _id: new require('mongodb').ObjectId(id) },
      { $set: updateData } // $set 操作符表示只更新提供的字段
    );
    // 返回更新是否成功
    return result.modifiedCount > 0;
  } finally {
    await client.close();
  }
}

// Delete (删除)
async function deletePost(id) {
  const collection = await connectDB();
  try {
    const result = await collection.deleteOne({ _id: new require('mongodb').ObjectId(id) });
    // 返回删除是否成功
    return result.deletedCount > 0;
  } finally {
    await client.close();
  }
}

// 4. 导出函数
module.exports = {
  createPost,
  findAllPosts,
  findPostById,
  updatePost,
  deletePost
};