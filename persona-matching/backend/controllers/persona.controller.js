import * as personaQueries from '../db/queries/persona.js';

/**
 * GET /api/persona/versions
 * Get all persona versions
 */
export async function getVersions(req, res, next) {
  try {
    const versions = await personaQueries.getVersions();
    res.json(versions);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/persona/versions
 * Create new persona version
 */
export async function createVersion(req, res, next) {
  try {
    const { baseVersion } = req.body;
    const version = await personaQueries.createVersion(baseVersion);
    res.status(201).json({ version: version.version_name, data: version });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/persona/import
 * Import users from registry version
 */
export async function importUsers(req, res, next) {
  try {
    const { registryVersion, personaVersion } = req.body;
    
    if (personaVersion === undefined) {
      return res.status(400).json({ 
        error: 'personaVersion is required' 
      });
    }
    
    const result = await personaQueries.importUsersFromRegistry(
      registryVersion ?? null,
      personaVersion
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/persona/data?version=<version_id>
 * Get persona table data
 */
export async function getPersonaData(req, res, next) {
  try {
    const versionId = req.query.version;
    
    if (!versionId) {
      return res.status(400).json({ error: 'Version parameter is required' });
    }
    
    const data = await personaQueries.getPersonaData(parseInt(versionId));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/persona/columns
 * Add a column
 */
export async function addColumn(req, res, next) {
  try {
    const { name, version } = req.body;
    
    if (!name || !version) {
      return res.status(400).json({ error: 'Name and version are required' });
    }
    
    const column = await personaQueries.addColumn(name, version);
    res.status(201).json({ colId: column.id, column });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/persona/columns/bulk
 * Bulk add columns and auto-populate from persona vectors
 */
export async function bulkAddColumns(req, res, next) {
  try {
    const { columns, version } = req.body;
    
    if (!Array.isArray(columns) || !version) {
      return res.status(400).json({ 
        error: 'Columns array and version are required' 
      });
    }
    
    const result = await personaQueries.bulkAddColumns(columns, version);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/persona/columns/:id
 * Delete a column
 */
export async function deleteColumn(req, res, next) {
  try {
    const columnId = req.params.id;
    const column = await personaQueries.deleteColumn(columnId);
    
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }
    
    res.json({ success: true, column });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/persona/users/:id
 * Delete a user from persona table
 */
export async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;
    const user = await personaQueries.deleteUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/persona/cell
 * Update a cell value
 */
export async function updateCell(req, res, next) {
  try {
    const { userId, colId, value } = req.body;
    
    if (!userId || !colId || value === undefined) {
      return res.status(400).json({ 
        error: 'userId, colId, and value are required' 
      });
    }
    
    if (![0, 1].includes(value)) {
      return res.status(400).json({ error: 'Value must be 0 or 1' });
    }
    
    const cell = await personaQueries.setCell(userId, colId, value);
    res.json({ success: true, cell });
  } catch (error) {
    next(error);
  }
}
