const express = require('express');
const {
  createObservation,
  updateObservation,
  deleteObservation,
  getAllObservations,
  getObservationById,
  getUserObservations
} = require('../controllers/observationController');

const { isLoggedIn, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin routes
router.post('/', isLoggedIn, admin, createObservation);
router.put('/', isLoggedIn, admin, updateObservation);
router.delete('/', isLoggedIn, admin, deleteObservation);
router.get('/all', isLoggedIn, admin, getAllObservations);

// Shared routes
router.post('/details', isLoggedIn, getObservationById);
router.get('/', isLoggedIn, getUserObservations);

module.exports = router;
