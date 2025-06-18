const express = require('express');
const {
  createOrganization,
  getAllOrganizations,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addMemberToOrganization,
  removeMemberFromOrganization
} = require('../controllers/organizationController');
const { isLoggedIn, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin-only routes
router.post('/', isLoggedIn, admin, createOrganization);
router.get('/all', isLoggedIn, admin, getAllOrganizations);
router.put('/', isLoggedIn, admin, updateOrganization);
router.delete('/', isLoggedIn, admin, deleteOrganization);

// Member management (admin only)
router.post('/members', isLoggedIn, admin, addMemberToOrganization);
router.delete('/members', isLoggedIn, admin, removeMemberFromOrganization);

// Routes for both admin and regular users
router.get('/', isLoggedIn, getUserOrganizations);
router.post('/details', isLoggedIn, getOrganizationById);

module.exports = router;
