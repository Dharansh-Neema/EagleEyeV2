const { ObjectId } = require('mongodb');

// Organization schema definition
const organizationSchema = {
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v) => v.length >= 3,
      message: 'Organization name must be at least 3 characters long'
    }
  },
  description: {
    type: String,
  },
  members: {
    type: Array,
    default: []
  },
  created_by: {
    type: ObjectId,
    required: true
  },
  created_at: { 
    type: Date, 
    default: () => new Date() 
  },
  updated_at: { 
    type: Date, 
    default: () => new Date() 
  }
};

// Validate organization data against schema
function validateOrganization(orgData) {
  const errors = {};

  for (const [field, config] of Object.entries(organizationSchema)) {
    if (config.required && !orgData[field]) {
      errors[field] = `${field} is required`;
    } else if (config.validate && orgData[field] && !config.validate.validator(orgData[field])) {
      errors[field] = config.validate.message;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Create a new organization
async function createOrganization(db, orgData) {
  console.log("Creating organization:", orgData);
  
  const validation = validateOrganization(orgData);
  if (!validation.isValid) throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);

  // Check if organization with same name already exists
  const existingOrg = await db.collection('organizations').findOne({ name: orgData.name });
  if (existingOrg) {
    throw new Error('Organization with this name already exists');
  }

  // Set default values if not provided
  for (const [field, config] of Object.entries(organizationSchema)) {
    if (config.default && orgData[field] === undefined) {
      orgData[field] = typeof config.default === 'function' ? config.default() : config.default;
    }
  }

  // Convert string ID to ObjectId if needed
  if (orgData.created_by && typeof orgData.created_by === 'string') {
    orgData.created_by = new ObjectId(orgData.created_by);
  }

  const result = await db.collection('organizations').insertOne(orgData);
  const organization = await db.collection('organizations').findOne({ _id: result.insertedId });
  
  console.log("Created organization:", organization);
  return organization;
}

// Find organization by ID
async function findOrganizationById(db, id) {
  try {
    return await db.collection('organizations').findOne({ _id: new ObjectId(id) });
  } catch (err) {
    console.error('Error finding organization by ID:', err);
    return null;
  }
}

// Find organizations by user ID (either as creator or member)
async function findOrganizationsByUserId(db, userId) {
  try {
    const objectId = new ObjectId(userId);
    return await db.collection('organizations')
      .find({
        $or: [
          { created_by: objectId },
          { 'members.user_id': objectId }
        ]
      })
      .toArray();
  } catch (err) {
    console.error('Error finding organizations by user ID:', err);
    return [];
  }
}

// Update organization
async function updateOrganization(db, id, updateData) {
  try {
    const existingOrg = await db.collection('organizations').findOne({ _id: new ObjectId(id) });
    if (!existingOrg) throw new Error('Organization not found');

    // Check if name is being updated and if it's already taken
    if (updateData.name && updateData.name !== existingOrg.name) {
      const nameExists = await db.collection('organizations').findOne({
        name: updateData.name,
        _id: { $ne: new ObjectId(id) }
      });
      
      if (nameExists) {
        throw new Error('Organization with this name already exists');
      }
    }

    const mergedData = { ...existingOrg, ...updateData };
    const validation = validateOrganization(mergedData);
    if (!validation.isValid) throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);

    updateData.updated_at = new Date();

    await db.collection('organizations').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return await findOrganizationById(db, id);
  } catch (err) {
    console.error('Error updating organization:', err);
    throw err;
  }
}

// Delete organization
async function deleteOrganization(db, id) {
  const result = await db.collection('organizations').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// Add member to organization
async function addMemberToOrganization(db, orgId, memberData) {
  try {
    // Validate required fields
    if (!memberData.user_id || !memberData.name || !memberData.email || !memberData.role) {
      throw new Error('Missing required member data');
    }

    // Check if organization exists
    const organization = await findOrganizationById(db, orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Convert string ID to ObjectId if needed
    if (memberData.user_id && typeof memberData.user_id === 'string') {
      memberData.user_id = new ObjectId(memberData.user_id);
    }

    // Check if user already exists in organization
    const memberExists = organization.members.some(
      member => member.user_id.toString() === memberData.user_id.toString()
    );

    if (memberExists) {
      throw new Error('User is already a member of this organization');
    }

    // Add timestamp
    memberData.added_at = new Date();

    // Add member to organization
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(orgId) },
      { 
        $push: { members: memberData },
        $set: { updated_at: new Date() }
      }
    );

    return await findOrganizationById(db, orgId);
  } catch (err) {
    console.error('Error adding member to organization:', err);
    throw err;
  }
}

// Remove member from organization
async function removeMemberFromOrganization(db, orgId, userId) {
  try {
    // Check if organization exists
    const organization = await findOrganizationById(db, orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Convert string ID to ObjectId if needed
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // Remove member from organization
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(orgId) },
      { 
        $pull: { members: { user_id: userObjectId } },
        $set: { updated_at: new Date() }
      }
    );

    return await findOrganizationById(db, orgId);
  } catch (err) {
    console.error('Error removing member from organization:', err);
    throw err;
  }
}

// Get all organizations (admin only)
async function getAllOrganizations(db) {
  try {
    return await db.collection('organizations').find().toArray();
  } catch (err) {
    console.error('Error getting all organizations:', err);
    return [];
  }
}

module.exports = {
  organizationSchema,
  validateOrganization,
  createOrganization,
  findOrganizationById,
  findOrganizationsByUserId,
  updateOrganization,
  deleteOrganization,
  addMemberToOrganization,
  removeMemberFromOrganization,
  getAllOrganizations
};
