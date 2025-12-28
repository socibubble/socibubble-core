import express from 'express';
import * as calculatorController from '../controllers/calculator.controller.js';

const router = express.Router();

// Alignment computation
router.post('/calculator/compute', calculatorController.computeAlignments);

// Matching modes
router.post('/calculator/pairs', calculatorController.runPairMatching);
router.post('/calculator/lobbies', calculatorController.runLobbyMode);

export default router;
