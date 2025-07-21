const { ObjectId } = require("mongodb");

/*
 Observation Schema (documentation purposes)
 {
   _id: ObjectId(),
   name: String,
   project_id: ObjectId(),
   project_name: String,
   organization_id: ObjectId(),
   organization_name: String,
   data_type: String, // "string" | "boolean" | "number"
   value: any, // depends on data_type
   created_at: Date,
   updated_at: Date
 }
*/

const ALLOWED_DATA_TYPES = ["string", "boolean", "number"];

const observationSchema = {
  name: { type: String, required: true, trim: true },
  project_id: { type: ObjectId, required: true },
  project_name: { type: String, required: true },
  organization_id: { type: ObjectId, required: true },
  organization_name: { type: String, required: true },
  data_type: {
    type: String,
    required: true,
    validate: {
      validator: (v) => ALLOWED_DATA_TYPES.includes(v),
      message: "data_type must be one of string, boolean, number",
    },
  },
  value: { type: null, required: true }, // value can be any
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

function validateObservation(obs) {
  const errors = {};

  for (const [field, config] of Object.entries(observationSchema)) {
    if (config.required && obs[field] === undefined) {
      errors[field] = `${field} is required`;
    } else if (
      config.validate &&
      obs[field] !== undefined &&
      !config.validate.validator(obs[field])
    ) {
      errors[field] = config.validate.message;
    }
  }

  // Type check between data_type and value
  if (obs.data_type && obs.value !== undefined) {
    if (obs.data_type === "string" && typeof obs.value !== "string") {
      errors.value = "value must be a string";
    } else if (obs.data_type === "boolean" && typeof obs.value !== "boolean") {
      errors.value = "value must be a boolean";
    } else if (obs.data_type === "number" && typeof obs.value !== "number") {
      errors.value = "value must be a number";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

async function createObservation(db, obsData) {
  // const validation = validateObservation(obsData);
  // if (!validation.isValid)
  //   throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);

  // Ensure name uniqueness within project
  const existing = await db.collection("observations").findOne({
    name: obsData.name,
    project_id: new ObjectId(obsData.project_id),
  });
  if (existing)
    throw new Error("Observation with this name already exists in the project");

  // Apply defaults
  for (const [field, config] of Object.entries(observationSchema)) {
    if (config.default !== undefined && obsData[field] === undefined) {
      obsData[field] =
        typeof config.default === "function"
          ? config.default()
          : config.default;
    }
  }

  // Cast IDs
  obsData.project_id = new ObjectId(obsData.project_id);
  obsData.organization_id = new ObjectId(obsData.organization_id);

  const result = await db.collection("observations").insertOne(obsData);
  return await db
    .collection("observations")
    .findOne({ _id: result.insertedId });
}

async function findObservationById(db, id) {
  try {
    return await db
      .collection("observations")
      .findOne({ _id: new ObjectId(id) });
  } catch (err) {
    console.error("findObservationById error:", err);
    return null;
  }
}

async function getAllObservations(db) {
  return await db.collection("observations").find().toArray();
}

async function findObservationsByProjectId(db, projectId) {
  return await db
    .collection("observations")
    .find({ project_id: new ObjectId(projectId) })
    .toArray();
}

async function findObservationsForUser(db, orgIds) {
  const ids = orgIds.map((id) => new ObjectId(id));
  return await db
    .collection("observations")
    .find({ organization_id: { $in: ids } })
    .toArray();
}

async function updateObservation(db, id, updateData) {
  updateData.updated_at = new Date();

  // Disallow changes to immutable fields
  delete updateData.project_id;
  delete updateData.project_name;
  delete updateData.organization_id;
  delete updateData.organization_name;

  // If updating data_type or value, ensure consistency
  // if (updateData.data_type || updateData.value !== undefined) {
  //   const obs = await findObservationById(db, id);
  //   const temp = {
  //     ...obs,
  //     ...updateData,
  //   };
    // const validation = validateObservation(temp);
    // if (!validation.isValid)
    //   throw new Error(
    //     `Validation failed: ${JSON.stringify(validation.errors)}`
    //   );
  // }

  await db
    .collection("observations")
    .updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  return await findObservationById(db, id);
}

async function deleteObservation(db, id) {
  const result = await db
    .collection("observations")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

module.exports = {
  validateObservation,
  createObservation,
  findObservationById,
  getAllObservations,
  findObservationsByProjectId,
  findObservationsForUser,
  updateObservation,
  deleteObservation,
  ALLOWED_DATA_TYPES,
};
