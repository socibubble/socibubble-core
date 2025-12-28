import axios from './axiosConfig';
import type { AlignmentResult, Alignments, PairMatchResult, LobbyResult } from '../types';

export const calculatorAPI = {
  // Compute alignments
  computeAlignments: async (
    userPersonaVersion: number, 
    personaTableVersion: number
  ): Promise<AlignmentResult> => {
    const response = await axios.post('/api/calculator/compute', {
      userPersonaVersion,
      personaTableVersion,
    });
    return response.data;
  },

  // Run pair matching
  runPairMatching: async (
    alignments: Alignments, 
    ladderBonuses?: number[]
  ): Promise<PairMatchResult> => {
    const response = await axios.post('/api/calculator/pairs', {
      alignments,
      ladderBonuses,
    });
    return response.data;
  },

  // Run lobby mode
  runLobbyMode: async (
    alignments: Alignments, 
    ladderBonuses?: number[]
  ): Promise<LobbyResult> => {
    const response = await axios.post('/api/calculator/lobbies', {
      alignments,
      ladderBonuses,
    });
    return response.data;
  },
};
