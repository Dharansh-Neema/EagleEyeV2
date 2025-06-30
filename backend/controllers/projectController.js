const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const projectModel = require("../models/projectModel");
const organizationModel = require("../models/organizationModel");

// Create Project (admin only)
const createProject = async (req, res) => {
  try {
    const { name, description, organizationId } = req.body;

    if (!name || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Please provide project name and organizationId",
      });
    }

    const db = getDB();

    // Check organization exists
    const organization = await organizationModel.findOrganizationById(
      db,
      organizationId
    );
    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    const projectData = {
      name,
      description: description || "",
      organization_id: new ObjectId(organizationId),
      organization_name: organization.name,
      created_by: {
        user_id: new ObjectId(req.user._id),
        name: req.user.name,
      },
      active: true,
    };

    const project = await projectModel.createProject(db, projectData);

    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("createProject error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// Update Project (admin only)
const updateProject = async (req, res) => {
  try {
    const { projectId, ...updateData } = req.body;
    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide projectId" });
    }

    const db = getDB();
    const existing = await projectModel.findProjectById(db, projectId);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const updated = await projectModel.updateProject(db, projectId, updateData);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateProject error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// Delete Project (admin only)
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId)
      return res
        .status(400)
        .json({ success: false, message: "Please provide projectId" });

    const db = getDB();
    const existing = await projectModel.findProjectById(db, projectId);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    await projectModel.deleteProject(db, projectId);
    return res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("deleteProject error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// Get All Projects (admin only)
const getAllProjects = async (req, res) => {
  try {
    const db = getDB();
    const projects = await projectModel.getAllProjects(db);
    return res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error("getAllProjects error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Project Details (admin or user with access)
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId)
      return res
        .status(400)
        .json({ success: false, message: "Please provide projectId" });

    const db = getDB();
    const project = await projectModel.findProjectById(db, projectId);
    console.log(project);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    // Access check: admin OR user is member of project's organization
    if (req.user.role !== "admin") {
      const orgs = await organizationModel.findOrganizationsByUserId(
        db,
        req.user._id
      );
      const orgIds = orgs.map((o) => o._id.toString());
      console.log(orgIds);
      if (!orgIds.includes(project.organization_id.toString())) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this project",
        });
      }
    }

    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("getProjectById error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get projects for current user (admin gets all)
const getUserProjects = async (req, res) => {
  try {
    const db = getDB();

    if (req.user.role === "admin") {
      const projects = await projectModel.getAllProjects(db);
      return res
        .status(200)
        .json({ success: true, count: projects.length, data: projects });
    }

    // Fetch orgs of user
    const orgs = await organizationModel.findOrganizationsByUserId(
      db,
      req.user._id
    );
    const orgIds = orgs.map((o) => o._id);

    const projects = await projectModel.findProjectsForUser(db, orgIds);
    return res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error("getUserProjects error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProjectByOrganizationId = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId)
      return res
        .status(400)
        .json({ success: false, message: "Please provide organizationId" });
    const db = getDB();
    const projects = await projectModel.findProjectsByOrganizationId(
      db,
      organizationId
    );
    return res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch {
    console.error("getProjectByOrganizationId error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getUserProjects,
  getProjectByOrganizationId,
};
