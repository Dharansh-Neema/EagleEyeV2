const { ObjectId } = require('mongodb');

/*
 Inspection Station Schema (doc)
 {
   _id: ObjectId(),
   name: String,
   description: String,
   organization_id: ObjectId(),
   organization_name: String,
   project_id: ObjectId(),
   project_name: String,
   cameras: Array,
   created_by: { user_id: ObjectId(), name: String },
   created_at: Date,
   updated_at: Date
 }
*/

const stationSchema = {
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  organization_id: { type: ObjectId, required: true },
  organization_name: { type: String, required: true },
  project_id: { type: ObjectId, required: true },
  project_name: { type: String, required: true },
  cameras: { type: Array, default: [] },
  created_by: { type: Object, required: true },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() }
};

function validateStation(data) {
  const errors = {};
  for (const [field, config] of Object.entries(stationSchema)) {
    if (config.required && data[field] === undefined) {
      errors[field] = `${field} is required`;
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function createStation(db, data) {
  const { isValid, errors } = validateStation(data);
  if (!isValid) throw new Error(`Validation failed: ${JSON.stringify(errors)}`);

  // Ensure unique name within project
  const existing = await db.collection('inspection_stations').findOne({
    name: data.name,
    project_id: new ObjectId(data.project_id)
  });
  if (existing) throw new Error('Inspection station with this name already exists in the project');

  // Apply defaults
  for (const [field, config] of Object.entries(stationSchema)) {
    if (config.default !== undefined && data[field] === undefined) {
      data[field] = typeof config.default === 'function' ? config.default() : config.default;
    }
  }

  // Cast IDs
  data.organization_id = new ObjectId(data.organization_id);
  data.project_id = new ObjectId(data.project_id);
  data.created_by.user_id = new ObjectId(data.created_by.user_id);

  const result = await db.collection('inspection_stations').insertOne(data);
  return await db.collection('inspection_stations').findOne({ _id: result.insertedId });
}

async function findStationById(db, id) {
  return await db.collection('inspection_stations').findOne({ _id: new ObjectId(id) });
}

async function getAllStations(db) {
  return await db.collection('inspection_stations').find().toArray();
}

async function findStationsByProjectId(db, projectId) {
  return await db.collection('inspection_stations').find({ project_id: new ObjectId(projectId) }).toArray();
}

async function findStationsForUser(db, orgIds) {
  const ids = orgIds.map((id) => new ObjectId(id));
  return await db.collection('inspection_stations').find({ organization_id: { $in: ids } }).toArray();
}

async function updateStation(db, stationId, updateData) {
  updateData.updated_at = new Date();

  // Prevent modifying immutable fields
  delete updateData.organization_id;
  delete updateData.organization_name;
  delete updateData.project_id;
  delete updateData.project_name;
  delete updateData.created_by;
  delete updateData.created_at;
  delete updateData.cameras;

  await db.collection('inspection_stations').updateOne({ _id: new ObjectId(stationId) }, { $set: updateData });
  return await findStationById(db, stationId);
}

async function deleteStation(db, stationId) {
  const res = await db.collection('inspection_stations').deleteOne({ _id: new ObjectId(stationId) });
  return res.deletedCount > 0;
}

module.exports = {
  validateStation,
  createStation,
  findStationById,
  getAllStations,
  findStationsByProjectId,
  findStationsForUser,
  updateStation,
  deleteStation
};
