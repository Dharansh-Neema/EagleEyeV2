const { ObjectId } = require('mongodb');

/*
 Project Schema (documentation purposes)
 {
   _id: ObjectId(),
   name: String,
   description: String,
   organization_id: ObjectId(),
   organization_name: String,
   created_by: {
     user_id: ObjectId(),
     name: String
   },
   active: Boolean,
   created_at: Date,
   updated_at: Date
 }
*/

const projectSchema = {
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v) => v.length >= 3,
      message: 'Project name must be at least 3 characters long'
    }
  },
  description: {
    type: String,
    default: ''
  },
  organization_id: {
    type: ObjectId,
    required: true
  },
  organization_name: {
    type: String,
    required: true
  },
  created_by: {
    type: Object,
    required: true // { user_id, name }
  },
  active: {
    type: Boolean,
    default: true
  },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() }
};

function validateProject(projectData) {
  const errors = {};

  for (const [field, config] of Object.entries(projectSchema)) {
    if (config.required && projectData[field] === undefined) {
      errors[field] = `${field} is required`;
    } else if (config.validate && projectData[field] !== undefined && !config.validate.validator(projectData[field])) {
      errors[field] = config.validate.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function createProject(db, projectData) {
  const validation = validateProject(projectData);
  if (!validation.isValid) throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);

  // Ensure name uniqueness within the same organization
  const existing = await db.collection('projects').findOne({
    name: projectData.name,
    organization_id: new ObjectId(projectData.organization_id)
  });
  if (existing) throw new Error('Project with this name already exists in the organization');

  // Set defaults
  for (const [field, config] of Object.entries(projectSchema)) {
    if (config.default !== undefined && projectData[field] === undefined) {
      projectData[field] = typeof config.default === 'function' ? config.default() : config.default;
    }
  }

  // Cast IDs
  projectData.organization_id = new ObjectId(projectData.organization_id);
  projectData.created_by.user_id = new ObjectId(projectData.created_by.user_id);

  const result = await db.collection('projects').insertOne(projectData);
  return await db.collection('projects').findOne({ _id: result.insertedId });
}

async function findProjectById(db, id) {
  try {
    return await db.collection('projects').findOne({ _id: new ObjectId(id) });
  } catch (err) {
    console.error('Error findProjectById:', err);
    return null;
  }
}

async function getAllProjects(db) {
  return await db.collection('projects').find().toArray();
}

async function findProjectsByOrganizationId(db, orgId) {
  return await db.collection('projects').find({ organization_id: new ObjectId(orgId) }).toArray();
}

async function findProjectsForUser(db, userOrgIds) {
  const objectIds = userOrgIds.map((id) => new ObjectId(id));
  return await db.collection('projects').find({ organization_id: { $in: objectIds } }).toArray();
}

async function updateProject(db, id, updateData) {
  updateData.updated_at = new Date();
  // Prevent changing immutable fields
  delete updateData.organization_id;
  delete updateData.organization_name;
  delete updateData.created_by;

  await db.collection('projects').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  return await findProjectById(db, id);
}

async function deleteProject(db, id) {
  const result = await db.collection('projects').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

module.exports = {
  projectSchema,
  validateProject,
  createProject,
  findProjectById,
  getAllProjects,
  findProjectsByOrganizationId,
  findProjectsForUser,
  updateProject,
  deleteProject
};
