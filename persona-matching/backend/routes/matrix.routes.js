import express from 'express';
import * as matrixController from '../controllers/matrix.controller.js';

const router = express.Router();

// Version management
router.get('/matrix/versions', matrixController.getVersions);
router.post('/matrix/versions', matrixController.createVersion);

// Data operations
router.get('/matrix/data', matrixController.getMatrixData);

// Row management
router.post('/matrix/rows', matrixController.addRow);
router.delete('/matrix/rows/:id', matrixController.deleteRow);

// Column management
router.post('/matrix/columns', matrixController.addColumn);
router.delete('/matrix/columns/:id', matrixController.deleteColumn);

// Cell operations
router.put('/matrix/cell', matrixController.updateCell);

// Bulk operations
router.post('/matrix/bulk', matrixController.bulkLoadMatrix);

export default router;
