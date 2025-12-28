import * as matrixQueries from '../db/queries/matrix.js';

/**
 * GET /api/matrix/versions
 * Get all matrix versions
 */
export async function getVersions(req, res, next) {
  try {
    const versions = await matrixQueries.getVersions();
    res.json(versions);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/matrix/versions
 * Create new matrix version
 */
export async function createVersion(req, res, next) {
  try {
    const { baseVersion } = req.body;
    const version = await matrixQueries.createVersion(baseVersion);
    res.status(201).json({ version: version.version_name, data: version });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/matrix/data?version=<version_id>
 * Get matrix table data
 */
export async function getMatrixData(req, res, next) {
  try {
    const versionId = req.query.version;
    
    if (!versionId) {
      return res.status(400).json({ error: 'Version parameter is required' });
    }
    
    const data = await matrixQueries.getMatrixData(parseInt(versionId));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/matrix/rows
 * Add a row
 */
export async function addRow(req, res, next) {
  try {
    const { name, version } = req.body;
    
    if (!name || !version) {
      return res.status(400).json({ error: 'Name and version are required' });
    }
    
    const row = await matrixQueries.addRow(name, version);
    res.status(201).json({ rowId: row.id, row });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/matrix/columns
 * Add a column
 */
export async function addColumn(req, res, next) {
  try {
    const { name, version } = req.body;
    
    if (!name || !version) {
      return res.status(400).json({ error: 'Name and version are required' });
    }
    
    const column = await matrixQueries.addColumn(name, version);
    res.status(201).json({ colId: column.id, column });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/matrix/rows/:id
 * Delete a row
 */
export async function deleteRow(req, res, next) {
  try {
    const rowId = req.params.id;
    const row = await matrixQueries.deleteRow(rowId);
    
    if (!row) {
      return res.status(404).json({ error: 'Row not found' });
    }
    
    res.json({ success: true, row });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/matrix/columns/:id
 * Delete a column
 */
export async function deleteColumn(req, res, next) {
  try {
    const columnId = req.params.id;
    const column = await matrixQueries.deleteColumn(columnId);
    
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }
    
    res.json({ success: true, column });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/matrix/cell
 * Update a cell value
 */
export async function updateCell(req, res, next) {
  try {
    const { rowId, colId, value } = req.body;
    
    if (!rowId || !colId || value === undefined) {
      return res.status(400).json({ 
        error: 'rowId, colId, and value are required' 
      });
    }
    
    if (![0, 1].includes(value)) {
      return res.status(400).json({ error: 'Value must be 0 or 1' });
    }
    
    const cell = await matrixQueries.setCell(rowId, colId, value);
    res.json({ success: true, cell });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/matrix/bulk
 * Bulk load matrix from JSON
 * Body: { matrix: { "PersonaA": [0,1,0,...], "PersonaB": [1,0,1,...] }, version: 1 }
 */
export async function bulkLoadMatrix(req, res, next) {
  try {
    const { matrix, version } = req.body;
    
    if (!matrix || !version) {
      return res.status(400).json({ error: 'Matrix data and version are required' });
    }
    
    const result = await matrixQueries.bulkLoadMatrix(matrix, version);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
