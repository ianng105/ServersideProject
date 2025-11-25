const { ObjectId } = require('mongodb');
const { getDB } = require("./mongo");
const collectionName = "user";

class User {
  // 连接数据库并获取集合
  static async getCollection() {
    const db = getDB();
    return await db.collection(collectionName);
  }

  // 注册用户（含默认头像和简介）
  static async createUser(userData) {
    const collection = await User.getCollection();
    // 新增默认头像和空简介
    const userDataWithDefaults = {
      ...userData,
      avatar: userData.avatar || '/images/default-avatar.jpg', // 默认头像路径
      profile: userData.profile || '' // 个人简介默认空
    };
    const result = await collection.insertOne(userDataWithDefaults);
    return { ...userDataWithDefaults, _id: result.insertedId };
  }

  // 查询所有用户
  static async findAllUsers() {
    const collection = await User.getCollection();
    return await collection.find().toArray();
  }

  // 根据ID查询用户
  static async findUserById(id) {
    const collection = await User.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  // 根据用户名查询用户
  static async findUserByUsername(username) {
    const collection = await User.getCollection();
    return await collection.findOne({ username });
  }

  // 根据邮箱查询用户
  static async findUserByEmail(email) {
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
  findUserByEmail: User.findUserByEmail,
  updateUser: User.updateUser,
  deleteUser: User.deleteUser
};
