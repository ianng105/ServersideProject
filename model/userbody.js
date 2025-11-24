const { MongoClient, ObjectId } = require('mongodb');
const { getDB } = require("./mongo");
const collectionName = "userbody";

class Userbody {
  static async getCollection() {
    const db = getDB();
    return db.collection(collectionName);
  }

  // ================ 创建 ================
  static async createUserBody(userBodyData) {
    const collection = await Userbody.getCollection();

    const dataToInsert = {
      userId: userBodyData.userId ? new ObjectId(userBodyData.userId) : null,
      height: userBodyData.height ? Number(userBodyData.height) : null,
      weight: userBodyData.weight ? Number(userBodyData.weight) : null,
      gender: userBodyData.gender || null,
      birthday: userBodyData.birthday ? new Date(userBodyData.birthday) : null,
      activityLevel: userBodyData.activityLevel || null,
      goal: userBodyData.goal || null,
      TDEE: userBodyData.TDEE != null ? Number(userBodyData.TDEE) : null,
      maximumIntake: userBodyData.maximumIntake != null ? Number(userBodyData.maximumIntake) : null,
      minimumIntake: userBodyData.minimumIntake != null ? Number(userBodyData.minimumIntake) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(dataToInsert);
    return { ...dataToInsert, _id: result.insertedId };
  }

  // ================ 查所有（调试用） ================
  static async findAllUserBodies() {
    const collection = await Userbody.getCollection();
    return await collection.find({}).toArray();
  }

  // ================ 按 MongoDB _id 查（极少用但保留） ================
  static async findUserBodyById(id) {
    const collection = await Userbody.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  // ================ 按登录用户 userId 查（最常用） ================
  static async findUserBodyByUserId(userId) {
    if (!userId) return null;
    const collection = await Userbody.getCollection();
    return await collection.findOne({ userId: new ObjectId(userId) });
  }

  // ================ 更新 ================
  static async updateUserBody(userId, updateData) {
    if (!userId) return false;
    const collection = await Userbody.getCollection();

    const cleanData = {};
    if (updateData.height !== undefined) cleanData.height = Number(updateData.height) || null;
    if (updateData.weight !== undefined) cleanData.weight = Number(updateData.weight) || null;
    if (updateData.gender !== undefined) cleanData.gender = updateData.gender || null;
    if (updateData.birthday !== undefined) cleanData.birthday = updateData.birthday ? new Date(updateData.birthday) : null;
    if (updateData.activityLevel !== undefined) cleanData.activityLevel = updateData.activityLevel || null;
    if (updateData.goal !== undefined) cleanData.goal = updateData.goal || null;
    if (updateData.TDEE !== undefined) cleanData.TDEE = updateData.TDEE != null ? Number(updateData.TDEE) : null;
    if (updateData.maximumIntake !== undefined) cleanData.maximumIntake = updateData.maximumIntake != null ? Number(updateData.maximumIntake) : null;
    if (updateData.minimumIntake !== undefined) cleanData.minimumIntake = updateData.minimumIntake != null ? Number(updateData.minimumIntake) : null;

    cleanData.updatedAt = new Date();

    const result = await collection.updateOne(
      { userId: new ObjectId(userId) },
      { $set: cleanData }
    );

    return result.matchedCount > 0;
  }

  // ================ 删除 ================
  static async deleteUserBody(userId) {
    if (!userId) return false;
    const collection = await Userbody.getCollection();
    const result = await collection.deleteOne({ userId: new ObjectId(userId) });
    return result.deletedCount > 0;
  }
}

module.exports = {
  createUserBody: Userbody.createUserBody,
  findAllUserBodies: Userbody.findAllUserBodies,
  findUserBodyById: Userbody.findUserBodyById,
  findUserBodyByUserId: Userbody.findUserBodyByUserId,
  updateUserBody: Userbody.updateUserBody,
  deleteUserBody: Userbody.deleteUserBody
};
