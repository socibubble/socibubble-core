import pool from '../pool.js';

/**
 * Fetch users from registry
 * @param {number|null} versionId - Optional version ID to filter by
 */
export async function fetchUsers(versionId = null) {
  let query = `
    SELECT 
      u.*,
      rv.version_name
    FROM core.users u
    LEFT JOIN core.registry_versions rv ON u.version_id = rv.id
  `;
  
  const params = [];
  
  if (versionId) {
    query += ' WHERE u.version_id = $1';
    params.push(versionId);
  } else {
    query += ' WHERE u.version_id IS NULL';
  }
  
  query += ' ORDER BY u.id DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Insert new user
 */
export async function insertUser(userData) {
  const query = `
    INSERT INTO core.users (
      root_id, public_id, hash, name, template, 
      persona_vector, archived, version_id, timestamp, created
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const values = [
    userData.root_id,
    userData.public_id,
    userData.hash,
    userData.name,
    userData.template || null,
    userData.persona_vector || '',
    userData.archived || false,
    userData.version_id || null,
    userData.timestamp,
    userData.created
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Bulk insert users
 */
export async function bulkInsertUsers(usersData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const insertedUsers = [];
    
    for (const userData of usersData) {
      const query = `
        INSERT INTO core.users (
          root_id, public_id, hash, name, template, 
          persona_vector, archived, version_id, timestamp, created
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        userData.root_id,
        userData.public_id,
        userData.hash,
        userData.name,
        userData.template || null,
        userData.persona_vector || '',
        userData.archived || false,
        userData.version_id || null,
        userData.timestamp,
        userData.created
      ];
      
      const result = await client.query(query, values);
      insertedUsers.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    return insertedUsers;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update user name
 */
export async function updateUser(userId, newName) {
  const query = `
    UPDATE core.users 
    SET name = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [newName, userId]);
  return result.rows[0];
}

/**
 * Delete user
 */
export async function deleteUser(userId) {
  const query = 'DELETE FROM core.users WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Toggle archived status
 */
export async function toggleArchived(userId, archived) {
  const query = `
    UPDATE core.users 
    SET archived = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [archived, userId]);
  return result.rows[0];
}

/**
 * Create new registry version
 */
export async function createVersion(versionName) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert version
    const versionQuery = `
      INSERT INTO core.registry_versions (version_name)
      VALUES ($1)
      RETURNING *
    `;
    const versionResult = await client.query(versionQuery, [versionName]);
    const version = versionResult.rows[0];
    
    // Get all unversioned users
    const usersQuery = `
      SELECT * FROM core.users 
      WHERE version_id IS NULL
    `;
    const usersResult = await client.query(usersQuery);
    const users = usersResult.rows;
    
    // Copy users with new version_id
    for (const user of users) {
      const copyQuery = `
        INSERT INTO core.users (
          root_id, public_id, hash, name, template, 
          persona_vector, archived, version_id, timestamp, created
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      
      await client.query(copyQuery, [
        user.root_id,
        user.public_id,
        user.hash,
        user.name,
        user.template,
        user.persona_vector,
        user.archived,
        version.id,
        user.timestamp,
        user.created
      ]);
    }
    
    await client.query('COMMIT');
    return version;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * List all versions
 */
export async function listVersions() {
  const query = `
    SELECT * FROM core.registry_versions 
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get version by ID
 */
export async function getVersionById(versionId) {
  const query = 'SELECT * FROM core.registry_versions WHERE id = $1';
  const result = await pool.query(query, [versionId]);
  return result.rows[0];
}

/**
 * Get version by name
 */
export async function getVersionByName(versionName) {
  const query = 'SELECT * FROM core.registry_versions WHERE version_name = $1';
  const result = await pool.query(query, [versionName]);
  return result.rows[0];
}
