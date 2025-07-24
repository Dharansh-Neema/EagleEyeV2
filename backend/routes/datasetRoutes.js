const express = require("express");
const {
    createDatasetMethod,
    getDatasetById,
    getDatasetsByProject,
    getDatasetsByOrganization,
    updateDatasetMethod,
    deleteDatasetMethod,
    getUserDatasets,
    addImageToDatasetMethod,
    removeImageFromDatasetMethod,
    getDatasetStats,
    updateImagetoDatasetMethod,
    getAllDatasetsMethod
} = require("../controllers/datasetController");

const { isLoggedIn, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin-only routes
router.post("/create", isLoggedIn, admin, createDatasetMethod);
router.put("/update", isLoggedIn, admin, updateDatasetMethod);
router.delete("/delete", isLoggedIn, admin, deleteDatasetMethod);

// Image management routes - Admin only
router.post("/add", isLoggedIn, admin, addImageToDatasetMethod);
router.post("/remove", isLoggedIn, admin, removeImageFromDatasetMethod);
router.post("/update/image",isLoggedIn,admin,updateImagetoDatasetMethod)
// Organization datasets - Admin only
router.post("/organization", isLoggedIn, admin, getDatasetsByOrganization);

// Read routes (with authorization checks)
router.get("/", isLoggedIn, getUserDatasets);
router.get("/stats", isLoggedIn, getDatasetStats);
router.post("/details", isLoggedIn, getDatasetById);
router.post("/by-project", isLoggedIn, getDatasetsByProject);
router.get("/all", isLoggedIn, admin, getAllDatasetsMethod);
module.exports = router;
