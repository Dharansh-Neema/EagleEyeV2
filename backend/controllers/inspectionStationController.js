const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const stationModel = require('../models/inspectionStationModel');
const projectModel = require('../models/projectModel');
const organizationModel = require('../models/organizationModel');

// Admin only
const createStation = async (req, res) => {
  try {
    const { name, description, projectId } = req.body;
    if (!name || !projectId) {
      return res.status(400).json({ success: false, message: 'name and projectId are required' });
    }

    const db = getDB();

    // Validate project and organization linkage
    const project = await projectModel.findProjectById(db, projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const stationData = {
      name,
      description: description || '',
      organization_id: project.organization_id,
      organization_name: project.organization_name,
      project_id: new ObjectId(projectId),
      project_name: project.name,
      cameras: [],
      created_by: { user_id: new ObjectId(req.user._id), name: req.user.name }
    };

    const station = await stationModel.createStation(db, stationData);
    return res.status(201).json({ success: true, data: station });
  } catch (err) {
    console.error('createStation error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Admin only
const updateStation = async (req, res) => {
  try {
    const { stationId, ...updateData } = req.body;
    if (!stationId) return res.status(400).json({ success: false, message: 'stationId required' });

    const db = getDB();
    const station = await stationModel.findStationById(db, stationId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    const updated = await stationModel.updateStation(db, stationId, updateData);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateStation error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Admin only
const deleteStation = async (req, res) => {
  try {
    const { stationId } = req.body;
    if (!stationId) return res.status(400).json({ success: false, message: 'stationId required' });

    const db = getDB();
    const station = await stationModel.findStationById(db, stationId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    await stationModel.deleteStation(db, stationId);
    return res.status(200).json({ success: true, message: 'Station deleted' });
  } catch (err) {
    console.error('deleteStation error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Admin only
const getAllStations = async (req, res) => {
  try {
    const db = getDB();
    const stations = await stationModel.getAllStations(db);
    return res.status(200).json({ success: true, count: stations.length, data: stations });
  } catch (err) {
    console.error('getAllStations error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Detail endpoint (admin or authorized user)
const getStationById = async (req, res) => {
  try {
    const { stationId } = req.body;
    if (!stationId) return res.status(400).json({ success: false, message: 'stationId required' });

    const db = getDB();
    const station = await stationModel.findStationById(db, stationId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    if (req.user.role !== 'admin') {
      const orgs = await organizationModel.findOrganizationsByUserId(db, req.user._id);
      const orgIds = orgs.map((o) => o._id.toString());
      if (!orgIds.includes(station.organization_id.toString())) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    return res.status(200).json({ success: true, data: station });
  } catch (err) {
    console.error('getStationById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// User endpoint to list stations
const getUserStations = async (req, res) => {
  try {
    const db = getDB();

    if (req.user.role === 'admin') {
      const stations = await stationModel.getAllStations(db);
      return res.status(200).json({ success: true, count: stations.length, data: stations });
    }

    const orgs = await organizationModel.findOrganizationsByUserId(db, req.user._id);
    const orgIds = orgs.map((o) => o._id);
    const stations = await stationModel.findStationsForUser(db, orgIds);

    return res.status(200).json({ success: true, count: stations.length, data: stations });
  } catch (err) {
    console.error('getUserStations error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createStation,
  updateStation,
  deleteStation,
  getAllStations,
  getStationById,
  getUserStations
};
