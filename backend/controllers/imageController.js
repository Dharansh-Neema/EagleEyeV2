const { ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getDB } = require("../config/db");
const cameraModel = require("../models/cameraModel");
const imageModel = require("../models/imageModel");
const organizationModel = require("../models/organizationModel");
const { error } = require("console");
const ExifImage = require("exif").ExifImage;
const STORAGE_ROOT = path.join(__dirname, "../../storage");

// Ensure a directory exists
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Middleware to fetch camera + build path
async function prefetchCamera(req, res, next) {
  try {
    const { cameraId } = req.query;
    console.log(cameraId);
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

    // Authorization for non-admin
    if (req.user.role !== "admin") {
      const orgs = await organizationModel.findOrganizationsByUserId(
        db,
        req.user._id
      );
      const orgIds = orgs.map((o) => o._id.toString());
      if (!orgIds.includes(camera.organization_id.toString())) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }
    }

    // Build dynamic path
    const now = new Date();
    const folders = [
      camera.organization_id.toString(),
      camera.project_id.toString(),
      camera.inspection_station_id?.toString() ||
        camera.inspection_station?.id?.toString() ||
        "",
      camera._id.toString(),
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, "0"),
      now.getDate().toString().padStart(2, "0"),
    ];
    const destPath = path.join(STORAGE_ROOT, ...folders);
    ensureDir(destPath);

    req._camera = camera;
    req._imageDestPath = destPath;
    next();
  } catch (err) {
    console.error("prefetchCamera error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Multer storage settings (destination is set in middleware above)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req._imageDestPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Admin-only upload (multi-image)
const uploadImage = [
  prefetchCamera,
  upload.array("image", 100000),

  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }

      const db = getDB();
      const cam = req._camera;
      const savedImages = [];

      for (const file of req.files) {
        const relPath = path.relative(STORAGE_ROOT, file.path);
        const imageDoc = {
          filename: file.filename,
          organization: {
            id: cam.organization_id,
            name: cam.organization_name || "",
          },
          project: { id: cam.project_id, name: cam.project_name || "" },
          inspection_station: {
            id: cam.inspection_station_id,
            name: cam.inspection_station_name || "",
          },
          camera: { id: cam._id, name: cam.name },
          full_path: relPath,
        };
        const saved = await imageModel.createImage(db, imageDoc);
        savedImages.push(saved);
      }

      return res
        .status(201)
        .json({ success: true, count: savedImages.length, data: savedImages });
    } catch (err) {
      console.error("uploadImage error:", err);
      return res
        .status(500)
        .json({ success: false, message: err.message || "Server error" });
    }
  },
];

const exifr = require("exifr");

const uploadInferenceImage = [
  prefetchCamera,
  upload.array("image", 100000),

  async (req, res) => {
    try {
      if (!req.files?.length) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }

      const db = getDB();
      const cam = req._camera;
      const saved = [];

      for (const file of req.files) {
        const relPath = path.relative(STORAGE_ROOT, file.path);

        let inference = {};
        try {
          inference = await exifr.parse(file.path); // ← EXIF in one line
        } catch (e) {
          console.warn(`EXIF parse failed for ${file.filename}:`, e.message);
        }

        const doc = {
          filename: file.filename,
          organization: {
            id: cam.organization_id,
            name: cam.organization_name || "",
          },
          project: { id: cam.project_id, name: cam.project_name || "" },
          inspection_station: {
            id: cam.inspection_station_id,
            name: cam.inspection_station_name || "",
          },
          camera: { id: cam._id, name: cam.name },
          inference,
          full_path: relPath,
        };

        saved.push(await imageModel.createImage(db, doc));
      }

      return res
        .status(201)
        .json({ success: true, count: saved.length, data: saved });
    } catch (err) {
      console.error("uploadInferenceImage error:", err);
      return res
        .status(500)
        .json({ success: false, message: err.message || "Server error" });
    }
  },
];
// Admin-only delete
const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.body;
    if (!imageId)
      return res
        .status(400)
        .json({ success: false, message: "imageId required" });

    const db = getDB();
    const img = await imageModel.findImageById(db, imageId);
    if (!img)
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });

    // Delete file from disk
    const absPath = path.join(STORAGE_ROOT, img.full_path);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

    await imageModel.deleteImage(db, imageId);
    return res.status(200).json({ success: true, message: "Image deleted" });
  } catch (err) {
    console.error("deleteImage error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single image doc
const getImageById = async (req, res) => {
  try {
    const { imageId } = req.body;
    if (!imageId)
      return res
        .status(400)
        .json({ success: false, message: "imageId required" });

    const db = getDB();
    const img = await imageModel.findImageById(db, imageId);
    if (!img)
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });

    if (req.user.role !== "admin") {
      const orgs = await organizationModel.findOrganizationsByUserId(
        db,
        req.user._id
      );
      const ids = orgs.map((o) => o._id.toString());
      if (!ids.includes(img.organization.id.toString()))
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
    }

    return res.status(200).json({ success: true, data: img });
  } catch (err) {
    console.error("getImageById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// List images for user / admin
const getImagesByCamera = async (req, res) => {
  try {
    const { cameraId } = req.body;
    console.log(cameraId);
    if (!cameraId)
      return res
        .status(400)
        .json({ success: false, message: "cameraId required" });

    const db = getDB();

    // Verify camera exists
    const cam = await cameraModel.findCameraById(db, cameraId);
    if (!cam)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });

    // Authorization
    if (req.user.role !== "admin") {
      const orgs = await organizationModel.findOrganizationsByUserId(
        db,
        req.user._id
      );
      const ids = orgs.map((o) => o._id.toString());
      if (!ids.includes(cam.organization_id.toString()))
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
    }

    const imgs = await imageModel.findImagesByCameraId(db, cameraId);
    return res
      .status(200)
      .json({ success: true, count: imgs.length, data: imgs });
  } catch (err) {
    console.error("getImagesByCamera error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getImagesForAnnotation = async (req, res) => {
  try {
    const { cameraId } = req.body;
    if (!cameraId)
      return res
        .status(400)
        .json({ success: false, message: "cameraId required" });
    const db = getDB();
    const result = await imageModel.getImagesForAnnotation(db, cameraId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getUserImages = async (req, res) => {
  try {
    const db = getDB();
    if (req.user.role === "admin") {
      const imgs = await imageModel.getAllImages(db);
      return res
        .status(200)
        .json({ success: true, count: imgs.length, data: imgs });
    }

    const orgs = await organizationModel.findOrganizationsByUserId(
      db,
      req.user._id
    );
    const ids = orgs.map((o) => o._id);
    const imgs = await imageModel.findImagesForUser(db, ids);
    return res
      .status(200)
      .json({ success: true, count: imgs.length, data: imgs });
  } catch (err) {
    console.error("getUserImages error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateGroundTruth = async (req, res) => {
  try {
    const { imageId, data } = req.body;
    if (!imageId)
      return res
        .status(400)
        .json({ success: false, message: "ImageId required" });
    const db = getDB();
    const result = await imageModel.updateGroundTruth(db, imageId, data);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("updateGroundTruth error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const imagesByProjectId = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "ProjectId required",
      });
    }

    const db = getDB();
    const result = await imageModel.getImagesByProjectId(db, projectId);
    const count = result.length;
    return res.status(200).json({
      success: true,
      count: count,
      data: result,
    });
  } catch (err) {
    console.error("getImageByProjectId error: ", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateGrading = async (req, res) => {
  try {
    const { imageId, data } = req.body;
    if (!imageId)
      return res
        .status(400)
        .json({ success: false, message: "ImageId required" });
    if(!data){
      data = [];
    }
    
    const db = getDB();
    const result = await imageModel.updateGrading(db, imageId, data);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error("updateGrading error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Count endpoints
async function countHelper(req, res, level) {
  try {
    const db = getDB();
    let query = {};
    switch (level) {
      case "organization":
        if (!req.body.organizationId)
          return res
            .status(400)
            .json({ success: false, message: "organizationId required" });
        query = { "organization.id": new ObjectId(req.body.organizationId) };
        break;
      case "project":
        if (!req.body.projectId)
          return res
            .status(400)
            .json({ success: false, message: "projectId required" });
        query = { "project.id": new ObjectId(req.body.projectId) };
        break;
      case "station":
        if (!req.body.stationId)
          return res
            .status(400)
            .json({ success: false, message: "stationId required" });
        query = { "inspection_station.id": new ObjectId(req.body.stationId) };
        break;
      case "camera":
        if (!req.body.cameraId)
          return res
            .status(400)
            .json({ success: false, message: "cameraId required" });
        query = { "camera.id": new ObjectId(req.body.cameraId) };
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid level" });
    }

    const count = await imageModel.countImages(db, query);
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("countHelper error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

const countOrganizationImages = (req, res) =>
  countHelper(req, res, "organization");
const countProjectImages = (req, res) => countHelper(req, res, "project");
const countStationImages = (req, res) => countHelper(req, res, "station");
const countCameraImages = (req, res) => countHelper(req, res, "camera");

const dashboardData = async (req, res) => {
  try {
    const { projectId } = req.body;
    console.log(projectId);
    const db = getDB();

    const projectObjectId = new ObjectId(projectId);

    // Count images in project
    const totalImages = await db
      .collection("images")
      .countDocuments({ "project.id": projectObjectId });
    console.log(totalImages);
    // Count cameras in project
    const camerasPromise = db
      .collection("cameras")
      .countDocuments({ project_id: projectObjectId });

    // Count annotated images
    const annotatedPromise = db.collection("images").countDocuments({
      "project.id": projectObjectId,
      ground_truth: { $exists: true },
    });

    // Run in parallel for speed
    const [cameras, annotated] = await Promise.all([
      camerasPromise,
      annotatedPromise,
    ]);

    const pending = totalImages - annotated;

    return res.status(200).json({
      success: true,
      data: {
        totalImages,
        cameras,
        annotated,
        pending,
      },
    });
  } catch (err) {
    console.error("dashboardData error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  getImageById,
  getUserImages,
  countOrganizationImages,
  countProjectImages,
  countStationImages,
  countCameraImages,
  getImagesByCamera,
  updateGroundTruth,
  getImagesForAnnotation,
  uploadInferenceImage,
  dashboardData,
  imagesByProjectId,
  updateGrading
};
