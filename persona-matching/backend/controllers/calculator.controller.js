import * as calculatorQueries from '../db/queries/calculator.js';

/**
 * POST /api/calculator/compute
 * Compute persona alignments for all users
 * Body: { userPersonaVersion, personaTableVersion }
 */
export async function computeAlignments(req, res, next) {
  try {
    const { userPersonaVersion, personaTableVersion } = req.body;
    
    if (!userPersonaVersion || !personaTableVersion) {
      return res.status(400).json({ 
        error: 'Both userPersonaVersion and personaTableVersion are required' 
      });
    }
    
    const result = await calculatorQueries.computeAlignments(
      userPersonaVersion,
      personaTableVersion
    );
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/calculator/pairs
 * Run pair matching algorithm
 * Body: { alignments, ladderBonuses? }
 */
export async function runPairMatching(req, res, next) {
  try {
    const { alignments, ladderBonuses } = req.body;
    
    if (!alignments) {
      return res.status(400).json({ error: 'Alignments are required' });
    }
    
    const result = calculatorQueries.runPairMatching(alignments, ladderBonuses);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/calculator/lobbies
 * Run lobby mode (5-7 player lobbies)
 * Body: { alignments, ladderBonuses? }
 */
export async function runLobbyMode(req, res, next) {
  try {
    const { alignments, ladderBonuses } = req.body;
    
    if (!alignments) {
      return res.status(400).json({ error: 'Alignments are required' });
    }
    
    const result = calculatorQueries.runLobbyMode(alignments, ladderBonuses);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
