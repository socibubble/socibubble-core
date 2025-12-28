import pool from '../pool.js';

/**
 * Get all matrix versions
 */
export async function getVersions() {
  const query = `
    SELECT * FROM core.matrix_versions 
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Create new matrix version
 */
export async function createVersion(baseVersion = null) {
  const base = baseVersion ? baseVersion.split("_")[0] : "PersonaTable";
  
  // Get existing versions with this base
  const existingQuery = `
    SELECT version_name FROM core.matrix_versions 
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
    INSERT INTO core.matrix_versions (version_name)
    VALUES ($1)
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [versionName]);
  return result.rows[0];
}

/**
 * Get matrix data for a version
 */
export async function getMatrixData(versionId) {
  // Get rows
  const rowsQuery = `
    SELECT * FROM core.matrix_rows 
    WHERE matrix_version_id = $1
    ORDER BY id
  `;
  const rowsResult = await pool.query(rowsQuery, [versionId]);
  const rows = rowsResult.rows;
  
  // Get columns
  const columnsQuery = `
    SELECT * FROM core.matrix_columns 
    WHERE matrix_version_id = $1
    ORDER BY id
  `;
  const columnsResult = await pool.query(columnsQuery, [versionId]);
  const columns = columnsResult.rows;
  
  // Get cells for all rows
  const cellsQuery = `
    SELECT * FROM core.matrix_cells 
    WHERE row_id = ANY($1::bigint[])
  `;
  const rowIds = rows.map(r => r.id);
  const cellsResult = rowIds.length > 0 
    ? await pool.query(cellsQuery, [rowIds])
    : { rows: [] };
  const cells = cellsResult.rows;
  
  // Build table data
  const tableData = rows.map(row => {
    const rowCells = {};
    
    columns.forEach(col => {
      const cell = cells.find(c => c.row_id === row.id && c.column_id === col.id);
      rowCells[col.id] = cell ? cell.value : 0;
    });
    
    return {
      id: row.id,
      name: row.name,
      cells: rowCells
    };
  });
  
  return { rows: tableData, columns };
}

/**
 * Add a row to matrix
 */
export async function addRow(name, versionId) {
  const query = `
    INSERT INTO core.matrix_rows (name, matrix_version_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  
  const result = await pool.query(query, [name, versionId]);
  return result.rows[0];
}

/**
 * Add a column to matrix
 */
export async function addColumn(name, versionId) {
  const query = `
    INSERT INTO core.matrix_columns (name, matrix_version_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  
  const result = await pool.query(query, [name, versionId]);
  return result.rows[0];
}

/**
 * Delete a row
 */
export async function deleteRow(rowId) {
  const query = 'DELETE FROM core.matrix_rows WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [rowId]);
  return result.rows[0];
}

/**
 * Delete a column
 */
export async function deleteColumn(columnId) {
  const query = 'DELETE FROM core.matrix_columns WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [columnId]);
  return result.rows[0];
}

/**
 * Set cell value
 */
export async function setCell(rowId, columnId, value) {
  const query = `
    INSERT INTO core.matrix_cells (row_id, column_id, value)
    VALUES ($1, $2, $3)
    ON CONFLICT (row_id, column_id) 
    DO UPDATE SET value = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [rowId, columnId, value]);
  return result.rows[0];
}

/**
 * Bulk load matrix from JSON object
 * Format: { "PersonaA": [0,1,0,1,...], "PersonaB": [1,0,1,0,...], ... }
 */
export async function bulkLoadMatrix(matrixData, versionId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const rowNames = Object.keys(matrixData);
    
    if (rowNames.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'No data provided' };
    }
    
    // Determine number of columns from first row
    const firstRow = matrixData[rowNames[0]];
    const numColumns = Array.isArray(firstRow) ? firstRow.length : 0;
    
    if (numColumns === 0) {
      await client.query('ROLLBACK');
      return { error: 'Invalid data format' };
    }
    
    // Create columns (C1, C2, C3, etc.)
    const columns = [];
    for (let i = 0; i < numColumns; i++) {
      const colName = `C${i + 1}`;
      
      const columnQuery = `
        INSERT INTO core.matrix_columns (name, matrix_version_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const columnResult = await client.query(columnQuery, [colName, versionId]);
      columns.push(columnResult.rows[0]);
    }
    
    // Create rows and populate cells
    const rows = [];
    for (const rowName of rowNames) {
      const rowQuery = `
        INSERT INTO core.matrix_rows (name, matrix_version_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const rowResult = await client.query(rowQuery, [rowName, versionId]);
      const row = rowResult.rows[0];
      rows.push(row);
      
      // Populate cells
      const vectorArray = matrixData[rowName];
      for (let i = 0; i < Math.min(vectorArray.length, columns.length); i++) {
        const value = parseInt(vectorArray[i]) || 0;
        
        const cellQuery = `
          INSERT INTO core.matrix_cells (row_id, column_id, value)
          VALUES ($1, $2, $3)
        `;
        
        await client.query(cellQuery, [row.id, columns[i].id, value]);
      }
    }
    
    await client.query('COMMIT');
    return {
      rowCount: rows.length,
      columnCount: columns.length,
      rows,
      columns
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
