const jwt = require('jsonwebtoken');
require('dotenv').config();
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET , {
    expiresIn: process.env.JWT_EXPIRE 
  });
};



const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
