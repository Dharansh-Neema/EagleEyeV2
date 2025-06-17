const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/tokenUtils');
const {setCookie}=require('../utils/cookie');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email and password' 
      });
    }
    
    const db = getDB();
    
    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(db, email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    let role = 'user';
    if(req.body.role){
      role = req.body.role;
    }
    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      organizations: []
    };
    const user = await userModel.createUser(db, userData);
    const token = generateToken(user._id);
    
    setCookie(res, token); 
    return res.status(201).json({
      success: true,
      data: user
    });   
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong' 
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }
    
    const db = getDB();
    const user = await userModel.findUserByEmail(db, email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie with token
    setCookie(res, token);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      data: {
        ...userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, Something went wrong.' 
    });
  }
};

const logoutUser = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now()), 
      httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};


const getCurrentUser = async (req, res) => {
  try {
    const db = getDB();
    console.log(req.user)
    const user = await userModel.findUserById(db, req.user._id);
    console.log(user)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong.' 
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const db = getDB();
    const user = await userModel.findUserById(db, req.user._id);
    console.log('User:',user)
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const updatedUser = await userModel.updateUser(db, req.user._id, req.body);
    console.log('Updated User:',updatedUser)
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong.' 
    });
  }
};

const updateUserPassword = async(req,res)=>{
  try {
    const db = getDB();
    const user = await userModel.findUserById(db, req.user._id);
    console.log('User:',user)
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const updatedUser = await userModel.updatePassword(db, req.user._id, req.body.password);
    console.log('Updated User:',updatedUser)
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong.' 
    });
  }
}

const getUsers = async(req,res)=>{
  try {
    const db = getDB();
    const users = await db.collection('users').find().toArray();
    console.log('Users:',users)
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong.' 
    });
  }
}
// Export all the controller functions
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  updateUserPassword,
  getUsers
};