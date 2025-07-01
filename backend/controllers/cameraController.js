const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const cameraModel = require("../models/cameraModel");
const stationModel = require("../models/inspectionStationModel");
const organizationModel = require("../models/organizationModel");

// Admin only
const createCamera = async (req, res) => {
  try {
    const { name, inspectionStationId } = req.body;
    if (!name || !inspectionStationId)
      return res
        .status(400)
        .json({
          success: false,
          message: "name and inspectionStationId required",
        });

    const db = getDB();

    const station = await stationModel.findStationById(db, inspectionStationId);
    if (!station)
      return res
        .status(404)
        .json({ success: false, message: "Inspection station not found" });

    const cameraData = {
      name,
      inspection_station_id: new ObjectId(inspectionStationId),
      inspection_station_name: station.name,
      project_id: station.project_id,
      project_name: station.project_name,
      organization_id: station.organization_id,
      organization_name: station.organization_name,
      created_by: { user_id: new ObjectId(req.user._id), name: req.user.name },
    };

    const camera = await cameraModel.createCamera(db, cameraData);

    // push into station's cameras array
    await db
      .collection("inspection_stations")
      .updateOne(
        { _id: station._id },
        { $push: { cameras: { _id: camera._id, name: camera.name } } }
      );

    return res.status(201).json({ success: true, data: camera });
  } catch (err) {
    console.error("createCamera error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// Admin only
const updateCamera = async (req, res) => {
  try {
    const { cameraId, ...updateData } = req.body;
    if (!cameraId)
      return res
        .status(400)
        .json({ success: false, message: "cameraId required" });

    const db = getDB();
    const cameraBefore = await cameraModel.findCameraById(db, cameraId);
    if (!cameraBefore)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });

    const updated = await cameraModel.updateCamera(db, cameraId, updateData);

    // If name updated, sync station array
    if (updateData.name && updateData.name !== cameraBefore.name) {
      await db
        .collection("inspection_stations")
        .updateOne(
          {
            _id: cameraBefore.inspection_station_id,
            "cameras._id": cameraBefore._id,
          },
          { $set: { "cameras.$.name": updateData.name } }
        );
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateCamera error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// Admin only
const deleteCamera = async (req, res) => {
  try {
    const { cameraId } = req.body;
    if (!cameraId)
      return res
        .status(400)
        .json({ success: false, message: "cameraId required" });

    const db = getDB();
    const camera = await cameraModel.findCameraById(db, cameraId);
    if (!camera)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });

    await cameraModel.deleteCamera(db, cameraId);

    await db
      .collection("inspection_stations")
      .updateOne(
        { _id: camera.inspection_station_id },
        { $pull: { cameras: { _id: camera._id } } }
      );

    return res.status(200).json({ success: true, message: "Camera deleted" });
  } catch (err) {
    console.error("deleteCamera error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// Admin only
const getAllCameras = async (req, res) => {
  try {
    const db = getDB();
    const cameras = await cameraModel.getAllCameras(db);
    return res
      .status(200)
      .json({ success: true, count: cameras.length, data: cameras });
  } catch (err) {
    console.error("getAllCameras error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCameraById = async (req, res) => {
  try {
    const { cameraId } = req.body;
    if (!cameraId)
      return res
        .status(400)
        .json({ success: false, message: "cameraId required" });

    const db = getDB();
    const camera = await cameraModel.findCameraById(db, cameraId);
    if (!camera)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });

    if (req.user.role !== "admin") {
      const orgs = await organizationModel.findOrganizationsByUserId(
        db,
        req.user._id
      );
      const orgIds = orgs.map((o) => o._id.toString());
      if (!orgIds.includes(camera.organization_id.toString()))
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
    }

    return res.status(200).json({ success: true, data: camera });
  } catch (err) {
    console.error("getCameraById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserCameras = async (req, res) => {
  try {
    const db = getDB();

    if (req.user.role === "admin") {
      const cameras = await cameraModel.getAllCameras(db);
      return res
        .status(200)
        .json({ success: true, count: cameras.length, data: cameras });
    }

    const orgs = await organizationModel.findOrganizationsByUserId(
      db,
      req.user._id
    );
    const orgIds = orgs.map((o) => o._id);
    const cameras = await cameraModel.findCamerasForUser(db, orgIds);

    return res
      .status(200)
      .json({ success: true, count: cameras.length, data: cameras });
  } catch (err) {
    console.error("getUserCameras error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const getCameraByStationId = async (req, res) => {
  try {
    const { stationId } = req.body;
    if (!stationId)
      return res
        .status(400)
        .json({ success: false, message: "stationId required" });

    const db = getDB();
    const cameras = await cameraModel.findCamerasByStationId(db, stationId);
    return res
      .status(200)
      .json({ success: true, count: cameras.length, data: cameras });
  } catch (err) {
    console.error("getCameraByStationId error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = {
  createCamera,
  updateCamera,
  deleteCamera,
  getAllCameras,
  getCameraById,
  getUserCameras,
  getCameraByStationId,
};
