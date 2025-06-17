const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// User schema definition for documentation and validation purposes
const userSchema = {
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v) => v.length >= 3,
      message: 'Name must be at least 3 characters long'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Email must be a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: (v) => v.length >= 6,
      message: 'Password must be at least 6 characters long'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  organizations: {
    type: Array,
    default: []
  },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
  last_login: { type: Date, default: () => new Date() }
};

function validateUser(userData) {
  const errors = {};

  for (const [field, config] of Object.entries(userSchema)) {
    if (config.required && !userData[field]) {
      errors[field] = `${field} is required`;
    } else if (config.validate && !config.validate.validator(userData[field])) {
      errors[field] = config.validate.message;
    } else if (config.enum && !config.enum.includes(userData[field])) {
      errors[field] = `Invalid value for ${field}`;
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function createUser(db, userData) {
  console.log("Creating user:", userData);
  
  const validation = validateUser(userData);
  if (!validation.isValid) throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);

  for (const [field, config] of Object.entries(userSchema)) {
    if (config.default && userData[field] === undefined) {
      userData[field] = typeof config.default === 'function' ? config.default() : config.default;
    }
  }

  userData.password = await bcrypt.hash(userData.password, 10);

  const result = await db.collection('users').insertOne(userData);
  const user = await db.collection('users').findOne({ _id: result.insertedId });
  console.log("Created user:", user);
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function findUserById(db, id) {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (err) {
    console.error('Error finding user by ID:', err);
    return null;
  }
}

async function findUserByEmail(db, email) {
  return db.collection('users').findOne({ email });
}

async function updateUser(db, id, updateData) {
  try {
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!existingUser) throw new Error('User not found');

    const mergedData = { ...existingUser, ...updateData };
    const validation = validateUser(mergedData);
    if (!validation.isValid) throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);

    updateData.updated_at = new Date();
    delete updateData.password; // Don't allow password update here

    await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return findUserById(db, id);
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
}

async function updatePassword(db, id, newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: { password: hashedPassword, updated_at: new Date() } }
  );
  return true;
}

async function addOrganizationToUser(db, userId, orgData) {
  if (!orgData.org_id || !orgData.name || !['admin', 'user'].includes(orgData.role)) {
    throw new Error('Invalid organization data');
  }

  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $push: { organizations: orgData }, $set: { updated_at: new Date() } }
  );

  return findUserById(db, userId);
}

async function deleteUser(db, id) {
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

module.exports = {
  userSchema,
  validateUser,
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
  updatePassword,
  addOrganizationToUser,
  deleteUser
};
