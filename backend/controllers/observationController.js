const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const observationModel = require("../models/observationModel");
const projectModel = require("../models/projectModel");
const organizationModel = require("../models/organizationModel");

// Admin only
const createObservation = async (req, res) => {
  try {
    const { name, projectId, data_type } = req.body;

    if (!name || !projectId || !data_type) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, projectId and data_type",
      });
    }

    const db = getDB();

    // Project
    const project = await projectModel.findProjectById(db, projectId);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    // Build document
    const obsData = {
      name,
      project_id: new ObjectId(projectId),
      project_name: project.name,
      organization_id: project.organization_id,
      organization_name: project.organization_name,
      data_type,
    };

    const observation = await observationModel.createObservation(db, obsData);
    return res.status(201).json({ success: true, data: observation });
  } catch (err) {
    console.error("createObservation error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// Admin only
const updateObservation = async (req, res) => {
  try {
    const { observationId, ...updateData } = req.body;
    if (!observationId)
      return res
        .status(400)
        .json({ success: false, message: "observationId required" });

    const db = getDB();
    const obs = await observationModel.findObservationById(db, observationId);
    if (!obs)
      return res
        .status(404)
        .json({ success: false, message: "Observation not found" });

    const updated = await observationModel.updateObservation(
      db,
      observationId,
      updateData
    );
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateObservation error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// Admin only
const deleteObservation = async (req, res) => {
  try {
    const { observationId } = req.body;
    if (!observationId)
      return res
        .status(400)
        .json({ success: false, message: "observationId required" });

    const db = getDB();
    const obs = await observationModel.findObservationById(db, observationId);
    if (!obs)
      return res
        .status(404)
        .json({ success: false, message: "Observation not found" });

    await observationModel.deleteObservation(db, observationId);
    return res
      .status(200)
      .json({ success: true, message: "Observation deleted" });
  } catch (err) {
    console.error("deleteObservation error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// Admin only - get all
const getAllObservations = async (req, res) => {
  try {
    const db = getDB();
    const obs = await observationModel.getAllObservations(db);
    return res
      .status(200)
      .json({ success: true, count: obs.length, data: obs });
  } catch (err) {
    console.error("getAllObservations error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Detail - admin or user with access
const getObservationById = async (req, res) => {
  try {
    const { observationId } = req.body;
    if (!observationId)
      return res
        .status(400)
        .json({ success: false, message: "observationId required" });

    const db = getDB();
    const obs = await observationModel.findObservationById(db, observationId);
    if (!obs)
      return res
        .status(404)
        .json({ success: false, message: "Observation not found" });

    if (req.user.role !== "admin") {
      const orgs = await organizationModel.findOrganizationsByUserId(
        db,
        req.user._id
      );
      const orgIds = orgs.map((o) => o._id.toString());
      if (!orgIds.includes(obs.organization_id.toString())) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }
    }

    return res.status(200).json({ success: true, data: obs });
  } catch (err) {
    console.error("getObservationById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get observations for user (admin gets all or filter by orgs)
const getUserObservations = async (req, res) => {
  try {
    const db = getDB();

    if (req.user.role === "admin") {
      const obs = await observationModel.getAllObservations(db);
      return res
        .status(200)
        .json({ success: true, count: obs.length, data: obs });
    }

    const orgs = await organizationModel.findOrganizationsByUserId(
      db,
      req.user._id
    );
    const orgIds = orgs.map((o) => o._id);
    const obs = await observationModel.findObservationsForUser(db, orgIds);

    return res
      .status(200)
      .json({ success: true, count: obs.length, data: obs });
  } catch (err) {
    console.error("getUserObservations error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getObservationsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId)
      return res
        .status(400)
        .json({ success: false, message: "projectId required" });

    const db = getDB();
    const obs = await observationModel.findObservationsByProjectId(
      db,
      projectId
    );
    if (!obs) {
      return res
        .status(404)
        .json({ success: false, message: "No observations found" });
    }
    return res
      .status(200)
      .json({ success: true, count: obs.length, data: obs });
  } catch (err) {
    console.error("getObservationsByProjectId error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createObservation,
  updateObservation,
  deleteObservation,
  getAllObservations,
  getObservationById,
  getUserObservations,
  getObservationsByProjectId,
};
