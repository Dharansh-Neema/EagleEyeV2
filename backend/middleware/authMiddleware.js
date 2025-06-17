const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { verifyToken } = require('../utils/tokenUtils');
const { AppError } = require('./errorMiddleware');


const isLoggedIn = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in headers or cookies
    if (req.body.token || req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.body.token || req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Get token from cookie
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }
    
    // Verify token
    const decoded = verifyToken(token);
    console.log(decoded)  
    if (!decoded) {
      return next(new AppError('Token is invalid or has expired', 401));
    }
    
    // Get user from token
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } } // Exclude password from result
    );
    
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }
    
    // // Check if user changed password after token was issued
    // if (user.password_changed_at && decoded.iat) {
    //   const changedTimestamp = parseInt(
    //     new Date(user.password_changed_at).getTime() / 1000,
    //     10
    //   );
      
    //   // If password was changed after token was issued
    //   if (changedTimestamp > decoded.iat) {
    //     return next(new AppError('User recently changed password, please log in again', 401));
    //   }
    // }
    
    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Authentication error', 500));
  }
};

/**
 * Admin only middleware
 * @middleware
 */
const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Not authorized as an admin', 403));
  }
  next();
};

/**
 * Restrict to specific roles middleware
 * @middleware
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = { 
  isLoggedIn, 
  admin,
  restrictTo
};
