const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const organizationModel = require('../models/organizationModel');
const userModel = require('../models/userModel');

// Create a new organization (admin only)
const createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide organization name' 
      });
    }
    
    const db = getDB();
    if(!description){
      description="No description provided";
    }
    // Create organization with admin user as creator
    const orgData = {
      name,
      description,
      members: [],
      created_by: new ObjectId(req.user._id)
    };
    
    const organization = await organizationModel.createOrganization(db, orgData);
    
    return res.status(201).json({
      success: true,
      data: organization
    });   
  } catch (error) {
    console.error('Error in createOrganization:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error, something went wrong' 
    });
  }
};

// Get all organizations (admin only)
const getAllOrganizations = async (req, res) => {
  try {
    const db = getDB();
    const organizations = await organizationModel.getAllOrganizations(db);
    
    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    console.error('Error in getAllOrganizations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong' 
    });
  }
};

// Get organizations for current user (both admin and regular users)
const getUserOrganizations = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user._id;
    
    // If admin, they can see all organizations they created or are a member of
    // If regular user, they can only see organizations they are a member of
    const user = await userModel.findUserById(db, userId);
    if(user.role === 'admin'){
      const data = await organizationModel.getAllOrganizations(db);
      return res.status(200).json({
        success: true,
        count: data.length,
        data: data
      });
    } 
    const organizations = await organizationModel.findOrganizationsByUserId(db, userId);
    return res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    console.error('Error in getUserOrganizations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong' 
    });
  }
};

// Get organization by ID (admin or member)
const getOrganizationById = async (req, res) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide organization ID' 
      });
    }
    
    const db = getDB();
    const organization = await organizationModel.findOrganizationById(db, organizationId);
    
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    
    // Check if user is admin or a member of the organization
    const isAdmin = req.user.role === 'admin';
    const isMember = organization.members.some(
      member => member.user_id.toString() === req.user._id.toString()
    );
    const isCreator = organization.created_by.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMember && !isCreator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this organization' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error in getOrganizationById:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong' 
    });
  }
};

// Update organization (admin only)
const updateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide organization ID' 
      });
    }
    
    const db = getDB();
    const organization = await organizationModel.findOrganizationById(db, organizationId);
    
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    
    // Remove organizationId from the data to be updated
    const { ...updateData } = req.body;
    delete updateData.organizationId;
    const updatedOrganization = await organizationModel.updateOrganization(db, organizationId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedOrganization
    });
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error, something went wrong' 
    });
  }
};

// Delete organization (admin only)
const deleteOrganization = async (req, res) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide organization ID' 
      });
    }
    
    const db = getDB();
    const organization = await organizationModel.findOrganizationById(db, organizationId);
    
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    
    await organizationModel.deleteOrganization(db, organizationId);
    
    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, something went wrong' 
    });
  }
};

// Add member to organization (admin only)
const addMemberToOrganization = async (req, res) => {
  try {
    const { userId, organizationId } = req.body;
    
    if (!userId || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both user ID and organization ID' 
      });
    }
    
    const db = getDB();
    
    // Check if user exists
    const user = await userModel.findUserById(db, userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if organization exists
    const organization = await organizationModel.findOrganizationById(db, organizationId);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    
    // Prepare member data
    const memberData = {
      user_id: new ObjectId(userId),
      name: user.name,
      email: user.email,
      role: req.body.role || 'user',
      added_at: new Date()
    };
    
    // Add member to organization
    const updatedOrganization = await organizationModel.addMemberToOrganization(
      db, 
      organizationId, 
      memberData
    );
    
    res.status(200).json({
      success: true,
      data: updatedOrganization
    });
  } catch (error) {
    console.error('Error in addMemberToOrganization:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error, something went wrong' 
    });
  }
};

// Remove member from organization (admin only)
const removeMemberFromOrganization = async (req, res) => {
  try {
    const { userId, organizationId } = req.body;
    
    if (!userId || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both user ID and organization ID' 
      });
    }
    
    const db = getDB();
    
    // Check if organization exists
    const organization = await organizationModel.findOrganizationById(db, organizationId);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    
    // Remove member from organization
    const updatedOrganization = await organizationModel.removeMemberFromOrganization(
      db, 
      organizationId, 
      userId
    );
    
    res.status(200).json({
      success: true,
      data: updatedOrganization
    });
  } catch (error) {
    console.error('Error in removeMemberFromOrganization:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error, something went wrong' 
    });
  }
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addMemberToOrganization,
  removeMemberFromOrganization
};
