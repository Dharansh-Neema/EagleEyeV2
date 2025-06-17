const { MongoClient } = require('mongodb');
require('dotenv').config();

// Connection URL
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.NODE_ENV === 'test' ? 'EagleEyeTest' : 'EagleEye';

let db = null;
let client = null;

// For testing purposes
let testDb = null;
let testClient = null;


async function connectDB() {
  try {
    if (db && client) {
      return { db, client };
    }
    
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    db = client.db(dbName);

    console.log('Database connection established');
    return { db, client };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getDB() {
  // If in test mode and test db is available, return it
  if (process.env.NODE_ENV === 'test' && testDb) {
    return testDb;
  }
  
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// For testing purposes only
function setTestDB(testConnection, testDatabase) {
  testClient = testConnection;
  testDb = testDatabase;
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  setTestDB // Export for testing
};
