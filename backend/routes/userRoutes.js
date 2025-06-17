const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  updateUserPassword,
  logoutUser,
  getUsers
} = require('../controllers/userController');
const { isLoggedIn, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/signin', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/me', isLoggedIn, getCurrentUser);
router.put('/update-profile', isLoggedIn, updateUserProfile);
router.put('/update-password', isLoggedIn, updateUserPassword);
router.post('/logout', isLoggedIn, logoutUser);
// Admin routes
router.get('/', isLoggedIn, admin, getUsers);

module.exports = router;
