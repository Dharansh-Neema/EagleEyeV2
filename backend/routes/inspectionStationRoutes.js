const express = require("express");
const {
  createStation,
  updateStation,
  deleteStation,
  getAllStations,
  getStationById,
  getUserStations,
  getStationByProjectId,
} = require("../controllers/inspectionStationController");

const { isLoggedIn, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// admin routes
router.post("/", isLoggedIn, admin, createStation);
router.put("/", isLoggedIn, admin, updateStation);
router.delete("/", isLoggedIn, admin, deleteStation);
router.get("/all", isLoggedIn, admin, getAllStations);

// user specific routes
router.post("/details", isLoggedIn, getStationById);
router.get("/", isLoggedIn, getUserStations);
router.post("/project", isLoggedIn, getStationByProjectId);
module.exports = router;
