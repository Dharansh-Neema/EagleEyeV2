const express = require('express');
const {
  createCamera,
  updateCamera,
  deleteCamera,
  getAllCameras,
  getCameraById,
  getUserCameras
} = require('../controllers/cameraController');
const { isLoggedIn, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// admin routes
router.post('/', isLoggedIn, admin, createCamera);
router.put('/', isLoggedIn, admin, updateCamera);
router.delete('/', isLoggedIn, admin, deleteCamera);
router.get('/all', isLoggedIn, admin, getAllCameras);

// user routes
router.post('/details', isLoggedIn, getCameraById);
router.get('/', isLoggedIn, getUserCameras);

module.exports = router;
