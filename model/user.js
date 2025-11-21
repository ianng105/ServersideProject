const { MongoClient, ObjectId } = require('mongodb');
const { getDB } = require("./mongo");
const collectionName = "user";

class User {
  // 连接数据库并获取集合
  static async getCollection() {
    const db = getDB();
    return await db.collection(collectionName);
  }

  // 注册用户
  static async createUser(userData) {
    const collection = await User.getCollection();
    const result = await collection.insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  // 查询所有用户
  static async findAllUsers() {
    const collection = await User.getCollection();
    return await collection.find().toArray();
  }

  // 根据ID查询用户 - 修复版
  static async findUserById(id) {
    const collection = await User.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findUserByUsername(email) {
    const collection = await User.getCollection();
    return await collection.findOne({ email });
  }

  // 更新用户信息
  static async updateUser(id, updateData) {
    const collection = await User.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  // 删除用户
  static async deleteUser(id) {
    const collection = await User.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

module.exports = {
  createUser: User.createUser,
  findAllUsers: User.findAllUsers,
  findUserById: User.findUserById,
  findUserByUsername: User.findUserByUsername,
  updateUser: User.updateUser,
  deleteUser: User.deleteUser
};