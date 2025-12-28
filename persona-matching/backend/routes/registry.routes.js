import express from 'express';
import * as registryController from '../controllers/registry.controller.js';

const router = express.Router();

// User CRUD
router.get('/users', registryController.getUsers);
router.post('/users', registryController.addUser);
router.post('/users/bulk', registryController.bulkAddUsers);
router.put('/users/:id', registryController.updateUserName);
router.delete('/users/:id', registryController.deleteUser);
router.patch('/users/:id/archive', registryController.toggleUserArchive);

// Version control
router.post('/versions', registryController.saveVersion);
router.get('/versions', registryController.getVersions);

export default router;
