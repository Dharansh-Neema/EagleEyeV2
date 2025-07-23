const { ObjectId } = require('mongodb');

/*
 Camera Schema (doc)
 {
   _id: ObjectId(),
   name: String,
   inspection_station_id: ObjectId(),
   inspection_station_name: String,
   project_id: ObjectId(),
   organization_id: ObjectId(),
   created_by: { user_id: ObjectId(), name: String },
   created_at: Date,
   updated_at: Date
 }
*/

const cameraSchema = {
  name: { type: String, required: true, trim: true },
  inspection_station_id: { type: ObjectId, required: true },
  inspection_station_name: { type: String, required: true },
  project_id: { type: ObjectId, required: true },
  project_name: { type: String, required: true },
  organization_id: { type: ObjectId, required: true },
  organization_name: { type: String, required: true },
  created_by: { type: Object, required: true },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() }
};

function validateCamera(data) {
  const errors = {};
  for (const [field, cfg] of Object.entries(cameraSchema)) {
    if (cfg.required && data[field] === undefined) {
      errors[field] = `${field} is required`;
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

async function createCamera(db, data) {
  const { isValid, errors } = validateCamera(data);
  if (!isValid) throw new Error(`Validation failed: ${JSON.stringify(errors)}`);

  // unique name within inspection_station
  const existing = await db.collection('cameras').findOne({
    name: data.name,
    inspection_station_id: new ObjectId(data.inspection_station_id)
  });
  if (existing) throw new Error('Camera with this name already exists in the inspection station');

  for (const [f, cfg] of Object.entries(cameraSchema)) {
    if (cfg.default !== undefined && data[f] === undefined) {
      data[f] = typeof cfg.default === 'function' ? cfg.default() : cfg.default;
    }
  }

  // cast ids
  data.inspection_station_id = new ObjectId(data.inspection_station_id);
  data.project_id = new ObjectId(data.project_id);
  data.organization_id = new ObjectId(data.organization_id);
  data.created_by.user_id = new ObjectId(data.created_by.user_id);

  const result = await db.collection('cameras').insertOne(data);
  return await db.collection('cameras').findOne({ _id: result.insertedId });
}

async function findCameraById(db, id) {
  return await db.collection('cameras').findOne({ _id: new ObjectId(id) });
}

async function getAllCameras(db) {
  return await db.collection('cameras').find().toArray();
}

async function findCamerasByStationId(db, stationId) {
  return await db.collection('cameras').find({ inspection_station_id: new ObjectId(stationId) }).toArray();
}

async function findCamerasByProjectId(db, projectId) {
  return await db.collection('cameras').find({ project_id: new ObjectId(projectId) }).toArray();
}

async function findCamerasForUser(db, orgIds) {
  const ids = orgIds.map((id) => new ObjectId(id));
  return await db.collection('cameras').find({ organization_id: { $in: ids } }).toArray();
}

async function updateCamera(db, id, updateData) {
  updateData.updated_at = new Date();

  delete updateData.organization_id;
  delete updateData.organization_name;
  delete updateData.project_id;
  delete updateData.project_name;
  delete updateData.inspection_station_id;
  delete updateData.inspection_station_name;
  delete updateData.created_by;

  await db.collection('cameras').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  return await findCameraById(db, id);
}

async function deleteCamera(db, id) {
  const res = await db.collection('cameras').deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}

module.exports = {
  validateCamera,
  createCamera,
  findCameraById,
  getAllCameras,
  findCamerasByStationId,
  findCamerasForUser,
  updateCamera,
  deleteCamera
};
