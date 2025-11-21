const { MongoClient } = require('mongodb');

// 1. 连接字符串
const uri = 'mongodb+srv://huil25514_db_user:1234@cluster0.96ftjs5.mongodb.net/?appName=Cluster0';

// 2. 创建 MongoClient 实例
const client = new MongoClient(uri);

// 3. 声明 db 变量，用于存储数据库实例
let db;

// 4. 定义并立即导出 connectDB 函数
async function connectDB() {
  try {
    await client.connect();
    // 连接成功后，指定要使用的数据库
    db = client.db('healthypal');
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('DB connection error:', err);
    throw err; // 抛出错误，让调用方知道连接失败
  }
}

// 5. 定义并立即导出 getDB 函数
function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return db;
}

// 6. 导出模块
module.exports = { connectDB, getDB };

