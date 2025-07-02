const { ObjectId } = require("mongodb");

/*
 Image Schema
 {
   _id: ObjectId(),
   filename: String,
   organization: { id: ObjectId(), name: String },
   project: { id: ObjectId(), name: String },
   inspection_station: { id: ObjectId(), name: String },
   camera: { id: ObjectId(), name: String },
   full_path: String,
   created_at: Date,
   updated_at: Date
 }
*/

const imageSchema = {
  filename: { type: String, required: true },
  organization: { type: Object, required: true },
  project: { type: Object, required: true },
  inspection_station: { type: Object, required: true },
  camera: { type: Object, required: true },

  ground_truth: { type: Object, required: false },
  inference: { type: Object, required: false },
  full_path: { type: String, required: true },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

function validateImage(data) {
  const errors = {};
  for (const [field, cfg] of Object.entries(imageSchema)) {
    if (cfg.required && data[field] === undefined)
      errors[field] = `${field} is required`;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

async function createImage(db, data) {
  const { isValid, errors } = validateImage(data);
  if (!isValid) throw new Error(`Validation failed: ${JSON.stringify(errors)}`);

  for (const [field, cfg] of Object.entries(imageSchema)) {
    if (cfg.default !== undefined && data[field] === undefined) {
      data[field] =
        typeof cfg.default === "function" ? cfg.default() : cfg.default;
    }
  }

  // cast IDs inside nested objects
  data.organization.id = new ObjectId(data.organization.id);
  data.project.id = new ObjectId(data.project.id);
  data.inspection_station.id = new ObjectId(data.inspection_station.id);
  data.camera.id = new ObjectId(data.camera.id);

  const result = await db.collection("images").insertOne(data);
  return await db.collection("images").findOne({ _id: result.insertedId });
}

async function findImageById(db, id) {
  return await db.collection("images").findOne({ _id: new ObjectId(id) });
}

async function getAllImages(db) {
  return await db.collection("images").find().toArray();
}

async function findImagesForUser(db, orgIds) {
  const ids = orgIds.map((id) => new ObjectId(id));
  return await db
    .collection("images")
    .find({ "organization.id": { $in: ids } })
    .toArray();
}

async function findImagesByCameraId(db, cameraId) {
  return await db
    .collection("images")
    .find({ "camera.id": new ObjectId(cameraId) })
    .toArray();
}

async function deleteImage(db, id) {
  const res = await db
    .collection("images")
    .deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}

async function countImages(db, query) {
  return await db.collection("images").countDocuments(query);
}

async function updateGroundTruth(db, id, data) {
  return await db
    .collection("images")
    .updateOne({ _id: new ObjectId(id) }, { $set: { ground_truth: data } });
}

async function updateInference(db, id, data) {
  return await db
    .collection("images")
    .updateOne({ _id: new ObjectId(id) }, { $set: { inference: data } });
}

async function getImagesForAnnotation(db, cameraId) {
  return await db.collection("images").find({
    "camera.id": new ObjectId(cameraId),
    ground_truth: { $exists: false },
  });
}

module.exports = {
  createImage,
  findImageById,
  getAllImages,
  findImagesForUser,
  findImagesByCameraId,
  deleteImage,
  countImages,
  updateGroundTruth,
  updateInference,
  getImagesForAnnotation,
};
