import pool from '../pool.js';

const DEFAULT_LADDER_BONUSES = [
  0.60, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.50,
  0.49, 0.48, 0.45, 0.43, 0.42, 0.41, 0.20, 0.05
];

/**
 * Shuffle array in place
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Create weighted dice from sorted persona alignments
 */
function createWeightedDice(sortedPersonas, ladderBonuses) {
  const bonuses = ladderBonuses || DEFAULT_LADDER_BONUSES;
  
  const weighted = sortedPersonas.map((persona, idx) => {
    const ladder = idx < bonuses.length ? bonuses[idx] : bonuses[bonuses.length - 1];
    return {
      persona: persona.persona,
      weightedScore: persona.percentage * ladder
    };
  });
  
  const total = weighted.reduce((sum, w) => sum + w.weightedScore, 0);
  
  if (total === 0) {
    const inc = 100 / weighted.length;
    let cumulative = 0;
    return weighted.map(w => {
      cumulative += inc;
      return { persona: w.persona, cumulativeMax: cumulative };
    });
  }
  
  let cumulative = 0;
  return weighted.map(w => {
    cumulative += (w.weightedScore / total) * 100;
    return { persona: w.persona, cumulativeMax: cumulative };
  });
}

/**
 * Roll weighted dice to select a persona
 */
function rollWeightedDice(dice) {
  const r = Math.random() * 100;
  for (const w of dice) {
    if (r <= w.cumulativeMax) {
      return w.persona;
    }
  }
  return dice[0].persona;
}

/**
 * Compute persona alignments for all users
 */
export async function computeAlignments(userPersonaVersionId, personaMatrixVersionId) {
  // Get users from persona table
  const usersQuery = `
    SELECT pu.*, pc.column_id, pc.value
    FROM core.persona_users pu
    LEFT JOIN core.persona_cells pc ON pu.id = pc.persona_user_id
    WHERE pu.persona_version_id = $1
    ORDER BY pu.id, pc.column_id
  `;
  const usersResult = await pool.query(usersQuery, [userPersonaVersionId]);
  
  // Group cells by user
  const userMap = new Map();
  usersResult.rows.forEach(row => {
    if (!userMap.has(row.id)) {
      userMap.set(row.id, {
        id: row.id,
        name: row.name,
        hash: row.hash,
        public_id: row.public_id,
        persona_vector: row.persona_vector,
        registry_version_id: row.registry_version_id,
        cells: []
      });
    }
    if (row.column_id) {
      userMap.get(row.id).cells.push(row.value);
    }
  });
  
  const users = Array.from(userMap.values());
  
  // Check archived status from registry
  const registryVersions = new Set(users.map(u => u.registry_version_id).filter(v => v !== null));
  const archivedHashes = new Set();
  
  for (const regVersion of registryVersions) {
    const archiveQuery = `
      SELECT hash FROM core.users 
      WHERE version_id = $1 AND archived = true
    `;
    const archiveResult = await pool.query(archiveQuery, [regVersion]);
    archiveResult.rows.forEach(r => archivedHashes.add(r.hash));
  }
  
  // Also check unversioned users
  const unversionedArchiveQuery = `
    SELECT hash FROM core.users 
    WHERE version_id IS NULL AND archived = true
  `;
  const unversionedResult = await pool.query(unversionedArchiveQuery);
  unversionedResult.rows.forEach(r => archivedHashes.add(r.hash));
  
  // Filter out archived users
  const activeUsers = users.filter(u => !archivedHashes.has(u.hash));
  
  if (activeUsers.length === 0) {
    return { error: 'No active (non-archived) users found', alignments: {}, userCount: 0 };
  }
  
  // Get matrix rows
  const matrixQuery = `
    SELECT mr.id, mr.name, mc.column_id, mc.value
    FROM core.matrix_rows mr
    LEFT JOIN core.matrix_cells mc ON mr.id = mc.row_id
    WHERE mr.matrix_version_id = $1
    ORDER BY mr.id, mc.column_id
  `;
  const matrixResult = await pool.query(matrixQuery, [personaMatrixVersionId]);
  
  // Group cells by row
  const matrixMap = new Map();
  matrixResult.rows.forEach(row => {
    if (!matrixMap.has(row.id)) {
      matrixMap.set(row.id, {
        name: row.name,
        cells: []
      });
    }
    if (row.column_id) {
      matrixMap.get(row.id).cells.push(row.value);
    }
  });
  
  const matrixRows = Array.from(matrixMap.values());
  
  if (matrixRows.length === 0) {
    return { error: 'No persona rows in matrix', alignments: {}, userCount: 0 };
  }
  
  // Compute alignments
  const alignments = {};
  
  activeUsers.forEach(user => {
    const userVector = user.persona_vector.split('').map(v => parseInt(v));
    const totalOnes = userVector.reduce((sum, v) => sum + v, 0);
    
    const userKey = `${user.name} (${user.public_id || 'N/A'})`;
    
    if (totalOnes === 0) {
      alignments[userKey] = [];
      return;
    }
    
    const personaScores = [];
    
    matrixRows.forEach(row => {
      let matches = 0;
      
      for (let i = 0; i < Math.min(userVector.length, row.cells.length); i++) {
        if (userVector[i] === 1 && row.cells[i] === 1) {
          matches++;
        }
      }
      
      const percentage = (matches / totalOnes) * 100;
      personaScores.push({
        persona: row.name,
        percentage: Math.round(percentage * 100) / 100
      });
    });
    
    personaScores.sort((a, b) => b.percentage - a.percentage);
    alignments[userKey] = personaScores;
  });
  
  return { alignments, userCount: activeUsers.length };
}

/**
 * Run pair matching algorithm
 */
export function runPairMatching(alignments, ladderBonuses) {
  const userSelections = [];
  
  for (const [userName, personas] of Object.entries(alignments)) {
    const dice = createWeightedDice(personas, ladderBonuses);
    const selected = rollWeightedDice(dice);
    const rank = personas.findIndex(p => p.persona === selected) + 1;
    
    userSelections.push({
      account_number: userName,
      selectedPersona: selected,
      originalRanking: rank
    });
  }
  
  const matched = [];
  const remaining = [];
  
  // Group by persona
  const personaGroups = {};
  userSelections.forEach(u => {
    if (!personaGroups[u.selectedPersona]) {
      personaGroups[u.selectedPersona] = [];
    }
    personaGroups[u.selectedPersona].push(u);
  });
  
  // Pair within same persona
  for (const [persona, users] of Object.entries(personaGroups)) {
    shuffleArray(users);
    while (users.length >= 2) {
      const u1 = users.pop();
      const u2 = users.pop();
      matched.push({
        user1: u1.account_number,
        user2: u2.account_number,
        persona: persona,
        rank1: u1.originalRanking,
        rank2: u2.originalRanking,
        persona1: u1.selectedPersona,
        persona2: u2.selectedPersona
      });
    }
    remaining.push(...users);
  }
  
  // Random fallback pairing
  if (remaining.length >= 2) {
    shuffleArray(remaining);
    const newRemaining = [];
    while (remaining.length >= 2) {
      const u1 = remaining.pop();
      const u2 = remaining.pop();
      matched.push({
        user1: u1.account_number,
        user2: u2.account_number,
        persona: 'mixed',
        rank1: u1.originalRanking,
        rank2: u2.originalRanking,
        persona1: u1.selectedPersona,
        persona2: u2.selectedPersona
      });
    }
    newRemaining.push(...remaining);
    return { matches: matched, remaining: newRemaining };
  }
  
  return { matches: matched, remaining };
}

/**
 * Run lobby mode (5-7 player lobbies)
 */
export function runLobbyMode(alignments, ladderBonuses) {
  const userSelections = [];
  
  for (const [userName, personas] of Object.entries(alignments)) {
    const dice = createWeightedDice(personas, ladderBonuses);
    const selected = rollWeightedDice(dice);
    const rank = personas.findIndex(p => p.persona === selected) + 1;
    
    userSelections.push({
      account_number: userName,
      selectedPersona: selected,
      originalRanking: rank
    });
  }
  
  if (userSelections.length < 5) {
    return { 
      error: 'Need at least 5 users for lobby mode', 
      lobbies: [], 
      leftovers: userSelections.map(u => u.account_number) 
    };
  }
  
  const allPlayers = [];
  const pairedAccounts = new Set();
  
  // Group by persona and pair
  const personaGroups = {};
  userSelections.forEach(u => {
    if (!personaGroups[u.selectedPersona]) {
      personaGroups[u.selectedPersona] = [];
    }
    personaGroups[u.selectedPersona].push(u);
  });
  
  for (const [persona, users] of Object.entries(personaGroups)) {
    shuffleArray(users);
    while (users.length >= 2) {
      const u1 = users.pop();
      const u2 = users.pop();
      allPlayers.push(u1, u2);
      pairedAccounts.add(u1.account_number);
      pairedAccounts.add(u2.account_number);
    }
    allPlayers.push(...users);
  }
  
  // Random pair remaining unpaired
  const unpaired = allPlayers.filter(p => !pairedAccounts.has(p.account_number));
  shuffleArray(unpaired);
  while (unpaired.length >= 2) {
    const u1 = unpaired.pop();
    const u2 = unpaired.pop();
    pairedAccounts.add(u1.account_number);
    pairedAccounts.add(u2.account_number);
  }
  
  // Shuffle for lobby assignment
  shuffleArray(allPlayers);
  
  // Create lobbies 5-7 players
  const lobbies = [];
  const leftovers = [];
  
  while (allPlayers.length >= 5) {
    const size = Math.min(7, allPlayers.length);
    const lobby = [];
    for (let i = 0; i < size; i++) {
      const p = allPlayers.shift();
      lobby.push({
        account_number: p.account_number,
        persona: p.selectedPersona,
        rank: p.originalRanking
      });
    }
    lobbies.push(lobby);
  }
  
  leftovers.push(...allPlayers.map(p => p.account_number));
  
  return { lobbies, leftovers };
}
