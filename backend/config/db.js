const { MongoClient } = require('mongodb');
require('dotenv').config();

// Connection URL
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'EagleEye';

let db = null;
let client = null;

/**
 * Connect to MongoDB
 * @returns {Promise<Object>} MongoDB client and database instance
 */
async function connectDB() {
  try {
    if (db && client) {
      return { db, client };
    }
    
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    db = client.db(dbName);
    return { db, client };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Get database instance
 * @returns {Object} MongoDB database instance
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

/**
 * Close database connection
 */
async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};
