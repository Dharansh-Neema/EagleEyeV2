const express = require("express");
const {
  uploadImage,
  deleteImage,
  getImageById,
  getUserImages,
  getImagesByCamera,
  countOrganizationImages,
  countProjectImages,
  countStationImages,
  countCameraImages,
  getImagesForAnnotation,
  updateGroundTruth,
  uploadInferenceImage,
  dashboardData,
} = require("../controllers/imageController");

const { isLoggedIn, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin uploads & deletes
router.post("/upload", isLoggedIn, admin, uploadImage);
router.post("/upload/inference", isLoggedIn, admin, uploadInferenceImage);
router.delete("/", isLoggedIn, admin, deleteImage);

// Read
router.post("/details", isLoggedIn, getImageById);
router.get("/", isLoggedIn, getUserImages);
router.post("/by-camera", isLoggedIn, getImagesByCamera);

// Annotation endpoints
router.post("/annotation", isLoggedIn, getImagesForAnnotation);
router.post("/ground-truth", isLoggedIn, updateGroundTruth);

// Count endpoints
router.post("/count/organization", isLoggedIn, countOrganizationImages);
router.post("/count/project", isLoggedIn, countProjectImages);
router.post("/count/station", isLoggedIn, countStationImages);
router.post("/count/camera", isLoggedIn, countCameraImages);
router.post("/dashboard", isLoggedIn, dashboardData);

module.exports = router;
