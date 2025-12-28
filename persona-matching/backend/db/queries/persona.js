import pool from '../pool.js';

/**
 * Get all persona versions
 */
export async function getVersions() {
  const query = `
    SELECT * FROM core.persona_versions 
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Create new persona version
 */
export async function createVersion(baseVersion = null) {
  const base = baseVersion ? baseVersion.split("_")[0] : "UserPersonaTable";
  
  // Get existing versions with this base
  const existingQuery = `
    SELECT version_name FROM core.persona_versions 
    WHERE version_name LIKE $1
    ORDER BY created_at DESC
  `;
  const existing = await pool.query(existingQuery, [`${base}%`]);
  
  const number = existing.rows.length + 1;
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0]
    .replace('T', '_');
  
  const versionName = `${base}_V${number}_${timestamp}`;
  
  const insertQuery = `
    INSERT INTO core.persona_versions (version_name)
    VALUES ($1)
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [versionName]);
  return result.rows[0];
}

/**
 * Import users from registry version to persona version
 */
export async function importUsersFromRegistry(registryVersionId, personaVersionId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get users from registry
    const registryQuery = `
      SELECT * FROM core.users 
      WHERE version_id = $1 OR ($1 IS NULL AND version_id IS NULL)
    `;
    const registryResult = await client.query(registryQuery, [registryVersionId]);
    const registryUsers = registryResult.rows;
    
    if (registryUsers.length === 0) {
      await client.query('ROLLBACK');
      return { imported: 0, total: 0 };
    }
    
    let imported = 0;
    
    for (const user of registryUsers) {
      // Check if user already exists in this persona version
      const checkQuery = `
        SELECT id FROM core.persona_users 
        WHERE hash = $1 AND persona_version_id = $2
      `;
      const checkResult = await client.query(checkQuery, [user.hash, personaVersionId]);
      
      if (checkResult.rows.length === 0) {
        const insertQuery = `
          INSERT INTO core.persona_users (
            name, hash, public_id, persona_vector, 
            registry_version_id, persona_version_id
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(insertQuery, [
          user.name,
          user.hash,
          user.public_id,
          user.persona_vector,
          registryVersionId,
          personaVersionId
        ]);
        
        imported++;
      }
    }
    
    await client.query('COMMIT');
    return { imported, total: registryUsers.length };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get persona table data for a version
 */
export async function getPersonaData(versionId) {
  // Get users
  const usersQuery = `
    SELECT * FROM core.persona_users 
    WHERE persona_version_id = $1
    ORDER BY id
  `;
  const usersResult = await pool.query(usersQuery, [versionId]);
  const users = usersResult.rows;
  
  // Get columns
  const columnsQuery = `
    SELECT * FROM core.persona_columns 
    WHERE persona_version_id = $1
    ORDER BY id
  `;
  const columnsResult = await pool.query(columnsQuery, [versionId]);
  const columns = columnsResult.rows;
  
  // Get cells for all users
  const cellsQuery = `
    SELECT * FROM core.persona_cells 
    WHERE persona_user_id = ANY($1::bigint[])
  `;
  const userIds = users.map(u => u.id);
  const cellsResult = await pool.query(cellsQuery, [userIds]);
  const cells = cellsResult.rows;
  
  // Build table data
  const tableData = users.map(user => {
    const userCells = {};
    
    columns.forEach(col => {
      const cell = cells.find(c => c.persona_user_id === user.id && c.column_id === col.id);
      userCells[col.id] = cell ? cell.value : 0;
    });
    
    return {
      id: user.id,
      name: user.name,
      hash: user.hash,
      public_id: user.public_id,
      registry_version_id: user.registry_version_id,
      persona_vector: user.persona_vector,
      cells: userCells
    };
  });
  
  return { users: tableData, columns };
}

/**
 * Add a column to persona table
 */
export async function addColumn(name, versionId) {
  const query = `
    INSERT INTO core.persona_columns (name, persona_version_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  
  const result = await pool.query(query, [name, versionId]);
  return result.rows[0];
}

/**
 * Bulk add columns and auto-populate from persona vectors
 */
export async function bulkAddColumns(columnNames, versionId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const addedColumns = [];
    
    // Insert columns
    for (let i = 0; i < columnNames.length; i++) {
      const columnQuery = `
        INSERT INTO core.persona_columns (name, persona_version_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const columnResult = await client.query(columnQuery, [columnNames[i], versionId]);
      const column = columnResult.rows[0];
      addedColumns.push({ ...column, index: i });
    }
    
    // Get all users in this version
    const usersQuery = `
      SELECT * FROM core.persona_users 
      WHERE persona_version_id = $1
    `;
    const usersResult = await client.query(usersQuery, [versionId]);
    const users = usersResult.rows;
    
    // Populate cells from persona vectors
    for (const user of users) {
      if (user.persona_vector) {
        const vectorArray = user.persona_vector.split('');
        
        for (const column of addedColumns) {
          const bitIndex = column.index;
          
          if (bitIndex < vectorArray.length) {
            const value = parseInt(vectorArray[bitIndex]) || 0;
            
            const cellQuery = `
              INSERT INTO core.persona_cells (persona_user_id, column_id, value)
              VALUES ($1, $2, $3)
            `;
            
            await client.query(cellQuery, [user.id, column.id, value]);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    return { count: addedColumns.length, columns: addedColumns };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a column
 */
export async function deleteColumn(columnId) {
  const query = 'DELETE FROM core.persona_columns WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [columnId]);
  return result.rows[0];
}

/**
 * Delete a user from persona table
 */
export async function deleteUser(userId) {
  const query = 'DELETE FROM core.persona_users WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Set cell value
 */
export async function setCell(userId, columnId, value) {
  const query = `
    INSERT INTO core.persona_cells (persona_user_id, column_id, value)
    VALUES ($1, $2, $3)
    ON CONFLICT (persona_user_id, column_id) 
    DO UPDATE SET value = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId, columnId, value]);
  return result.rows[0];
}
