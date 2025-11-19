const { MongoClient, ObjectId } = require('mongodb');

// MongoDB Atlas 连接字符串
const uri = "mongodb+srv://hui125514_db_user:1234@cluster0.96ftjs5.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);
const dbName = "healthypal";
const collectionName = "user";

// 连接数据库并获取集合
async function getCollection() {
  await client.connect();
  return client.db(dbName).collection(collectionName);
}

// 注册用户
async function createUser(userData) {
  const collection = await getCollection();
  try {
    const result = await collection.insertOne(userData);
    return { ...userData, _id: result.insertedId };
  } finally {
    await client.close();
  }
}

// 查询所有用户
async function findAllUsers() {
  const collection = await getCollection();
  try {
    return await collection.find().toArray();
  } finally {
    await client.close();
  }
}

// 根据ID查询用户
async function findUserById(id) {
  const collection = await getCollection();
  try {
    return await collection.findOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

// 根据用户名查询用户（用于登录验证）
async function findUserByUsername(username) {
  const collection = await getCollection();
  try {
    return await collection.findOne({ username });
  } finally {
    await client.close();
  }
}

// 更新用户信息
async function updateUser(id, updateData) {
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

// 删除用户
async function deleteUser(id) {
  const collection = await getCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } finally {
    await client.close();
  }
}

module.exports = {
  createUser,
  findAllUsers,
  findUserById,
  findUserByUsername,
  updateUser,
  deleteUser
};