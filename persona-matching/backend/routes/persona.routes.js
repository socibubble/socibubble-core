import express from 'express';
import * as personaController from '../controllers/persona.controller.js';

const router = express.Router();

// Version management
router.get('/persona/versions', personaController.getVersions);
router.post('/persona/versions', personaController.createVersion);

// Data operations
router.post('/persona/import', personaController.importUsers);
router.get('/persona/data', personaController.getPersonaData);

// Column management
router.post('/persona/columns', personaController.addColumn);
router.post('/persona/columns/bulk', personaController.bulkAddColumns);
router.delete('/persona/columns/:id', personaController.deleteColumn);

// User management
router.delete('/persona/users/:id', personaController.deleteUser);

// Cell operations
router.put('/persona/cell', personaController.updateCell);

export default router;
