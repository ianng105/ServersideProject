const { MongoClient } = require('mongodb');


const uri = 'mongodb+srv://huil25514_db_user:1234@cluster0.96ftjs5.mongodb.net/?appName=Cluster0';
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('healthypal');
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('DB connection error:', err);
    throw err;
  }
}

function getDB() {
  return db;
}


module.exports = { connectDB, getDB };

