import * as registryQueries from '../db/queries/registry.js';
import {
  generateRootID,
  generatePublicID,
  generateHash,
  getNextUserNumber,
  formatTimestamp
} from '../utils/generators.js';

/**
 * GET /api/users?version=<version_id>
 * Fetch all users (optionally filtered by version)
 */
export async function getUsers(req, res, next) {
  try {
    const versionId = req.query.version ? parseInt(req.query.version) : null;
    const users = await registryQueries.fetchUsers(versionId);
    res.json(users);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function addUser(req, res, next) {
  try {
    const { name, persona_vector } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const nextNum = await getNextUserNumber();
    const now = new Date();
    
    const userData = {
      root_id: generateRootID(nextNum),
      public_id: generatePublicID(nextNum),
      hash: generateHash(name),
      name,
      template: null,
      persona_vector: persona_vector || '',
      archived: false,
      version_id: null,
      timestamp: now.toISOString(),
      created: formatTimestamp(now)
    };
    
    const user = await registryQueries.insertUser(userData);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/bulk
 * Bulk create users
 */
export async function bulkAddUsers(req, res, next) {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }
    
    let nextNum = await getNextUserNumber();
    const now = new Date();
    
    const usersData = users.map((user, index) => ({
      root_id: generateRootID(nextNum + index),
      public_id: generatePublicID(nextNum + index),
      hash: generateHash(user.name || 'user'),
      name: user.name,
      template: null,
      persona_vector: user.persona_vector || '',
      archived: false,
      version_id: null,
      timestamp: now.toISOString(),
      created: formatTimestamp(now)
    }));
    
    const insertedUsers = await registryQueries.bulkInsertUsers(usersData);
    
    res.status(201).json({
      count: insertedUsers.length,
      users: insertedUsers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/:id
 * Update user name
 */
export async function updateUserName(req, res, next) {
  try {
    const userId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const user = await registryQueries.updateUser(userId, name);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id
 * Delete a user
 */
export async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;
    const user = await registryQueries.deleteUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id/archive
 * Toggle user archived status
 */
export async function toggleUserArchive(req, res, next) {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    
    if (typeof status !== 'boolean') {
      return res.status(400).json({ error: 'Status must be boolean' });
    }
    
    const user = await registryQueries.toggleArchived(userId, status);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/versions
 * Create a new version snapshot
 */
export async function saveVersion(req, res, next) {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Version title is required' });
    }
    
    // Generate version name with timestamp
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0]
      .replace('T', '_');
    
    const versionName = `${title}_V1_${timestamp}`;
    
    const version = await registryQueries.createVersion(versionName);
    
    res.status(201).json({
      versionName: version.version_name,
      version
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/versions
 * List all versions
 */
export async function getVersions(req, res, next) {
  try {
    const versions = await registryQueries.listVersions();
    res.json(versions.map(v => v.version_name));
  } catch (error) {
    next(error);
  }
}
