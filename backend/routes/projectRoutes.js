const express = require("express");
const {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getUserProjects,
  getProjectByOrganizationId,
} = require("../controllers/projectController");
const { isLoggedIn, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin routes
router.post("/", isLoggedIn, admin, createProject);
router.put("/", isLoggedIn, admin, updateProject);
router.delete("/", isLoggedIn, admin, deleteProject);
router.get("/all", isLoggedIn, admin, getAllProjects);

// Shared routes
router.post("/details", isLoggedIn, getProjectById);
router.get("/", isLoggedIn, getUserProjects);
router.post("/names", isLoggedIn, getProjectByOrganizationId);

module.exports = router;
