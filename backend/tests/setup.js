const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

// Import database module
const { setTestDB } = require('../config/db');

let mongoServer;
let connection;
let db;

// Setup MongoDB Memory Server before all tests
const setupDB = async () => {
  try {
    // Create MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Set environment variables for testing
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRE = '1h';
    process.env.COOKIE_EXPIRE = '1';
    process.env.NODE_ENV = 'test';
    
    // Connect to the in-memory database
    connection = await MongoClient.connect(uri);
    db = connection.db();
    
    // Return the connection and db
    return { connection, db };
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

// Close connection and stop MongoDB Memory Server after all tests
const teardownDB = async () => {
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
};

// Clear all collections between tests
const clearDB = async () => {
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};

module.exports = { setupDB, teardownDB, clearDB };
