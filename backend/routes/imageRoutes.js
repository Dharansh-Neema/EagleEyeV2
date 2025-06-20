const express = require('express');
const {
  uploadImage,
  deleteImage,
  getImageById,
  getUserImages,
  getImagesByCamera,
  countOrganizationImages,
  countProjectImages,
  countStationImages,
  countCameraImages
} = require('../controllers/imageController');

const { isLoggedIn, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin uploads & deletes
router.post('/upload/', isLoggedIn, admin, uploadImage);
router.delete('/', isLoggedIn, admin, deleteImage);

// Read
router.post('/details', isLoggedIn, getImageById);
router.get('/', isLoggedIn, getUserImages);
router.post('/by-camera', isLoggedIn, getImagesByCamera);

// Count endpoints
router.post('/count/organization', isLoggedIn, countOrganizationImages);
router.post('/count/project', isLoggedIn, countProjectImages);
router.post('/count/station', isLoggedIn, countStationImages);
router.post('/count/camera', isLoggedIn, countCameraImages);

module.exports = router;
