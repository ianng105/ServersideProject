const { MongoClient, ObjectId } = require('mongodb');
const { getDB } = require("./mongo");
const collectionName = "userbody";



class Userbody{
	// 连接数据库并获取集合
	  static async getCollection() {
	    const db = getDB();
	    return await db.collection(collectionName);
	  }


	static async  createUserBody(userBodyData) {
	  const collection = await Userbody.getCollection();
	 
	    // userId 是关联用户的 _id，必须传入
	    const dataToInsert = {
	      userId: ObjectId.createFromHexString(userBodyData.userId.toString()),
	      height: Number(userBodyData.height) || null,
	      weight: Number(userBodyData.weight) || null,
	      gender: userBodyData.gender || null,
	      birthday: userBodyData.birthday ? new Date(userBodyData.birthday) : null,
	      activityLevel: userBodyData.activity || null,
	      goal: userBodyData.goal || null,
	      createdAt: new Date(),
	      updatedAt: new Date()
	    };

	    const result = await collection.insertOne(dataToInsert);
	    return { ...dataToInsert, _id: result.insertedId };
	 
	}

	// 查询所有用户的身体信息（管理员用，通常用于调试）
	static async findAllUserBodies() {
	  const collection = await Userbody.getCollection();
	  return await collection.find().toArray();
	}

	// 根据 MongoDB _id 查询（极少用）
	static async  findUserBodyById(id) {
	  const collection = await getCollection();
	    return await collection.findOne({ _id: new ObjectId(id) });

	}

	// 【核心】根据登录用户 ID 查询身体信息（前端最常用）
	static async  findUserBodyByUserId(userId) {
	  const collection = await Userbody.getCollection();
	 
	    return await collection.findOne({ 
	      userId: ObjectId.createFromHexString(userId.toString()) 
	    });
	
	}

	// 更新用户身体信息（支持部分更新）
	static async updateUserBody(userId, updateData) {
	  const collection = await Userbody.getCollection();
	  
	    const cleanData = {};
	    // 只更新传入的字段，并做类型转换
	    if (updateData.height !== undefined) cleanData.height = Number(updateData.height) || null;
	    if (updateData.weight !== undefined) cleanData.weight = Number(updateData.weight) || null;
	    if (updateData.gender !== undefined) cleanData.gender = updateData.gender || null;
	    if (updateData.birthday !== undefined) cleanData.birthday = updateData.birthday ? new Date(updateData.birthday) : null;
	    if (updateData.bodyFat !== undefined) cleanData.bodyFat = updateData.bodyFat ? Number(updateData.bodyFat) : null;
	    if (updateData.waist !== undefined) cleanData.waist = updateData.waist ? Number(updateData.waist) : null;
	    if (updateData.hip !== undefined) cleanData.hip = updateData.hip ? Number(updateData.hip) : null;
	    if (updateData.neck !== undefined) cleanData.neck = updateData.neck ? Number(updateData.neck) : null;
	    if (updateData.activityLevel !== undefined) cleanData.activityLevel = updateData.activityLevel || null;
	    if (updateData.goal !== undefined) cleanData.goal = updateData.goal || null;

	    cleanData.updatedAt = new Date();

	    const result = await collection.updateOne(
	      { userId: ObjectId.createFromHexString(userId.toString()) },
	      { $set: cleanData }
	    );

	    return result.modifiedCount > 0 || result.matchedCount > 0;

	}

	// 删除用户身体信息（用户注销时调用）
	static async  deleteUserBody(userId) {
	  const collection = await getCollection();
	  
	    const result = await collection.deleteOne({ 
	      userId: ObjectId.createFromHexString(userId.toString()) 
	    });
	    return result.deletedCount > 0;

	}
}
module.exports = {
  createUserBody: Userbody.createUserBody,
  findAllUserBodies: Userbody.findAllUserBodies,
  findUserBodyById: Userbody.findUserBodyById,
  findUserBodyByUserId: Userbody.findUserBodyByUserId,      // 最常用
  updateUserBody: Userbody.updateUserBody,            // 最常用
  deleteUserBody: Userbody.deleteUserBody
};

