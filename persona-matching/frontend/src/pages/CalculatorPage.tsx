import { useState } from 'react';
import { calculatorAPI } from '../api/calculator.api';
import { personaAPI } from '../api/persona.api';
import { matrixAPI } from '../api/matrix.api';
import type { Alignments, PairMatchResult, LobbyResult } from '../types';

interface CalculatorPageProps {
  onBack: () => void;
}

export default function CalculatorPage({ onBack }: CalculatorPageProps) {
  const [userPersonaVersion, setUserPersonaVersion] = useState<number | null>(null);
  const [personaTableVersion, setPersonaTableVersion] = useState<number | null>(null);
  const [alignments, setAlignments] = useState<Alignments | null>(null);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showVersionList, setShowVersionList] = useState(false);
  const [personaVersions, setPersonaVersions] = useState<Array<{ id: number; version_name: string }>>([]);
  const [matrixVersions, setMatrixVersions] = useState<Array<{ id: number; version_name: string }>>([]);

  async function handleShowVersions() {
    try {
      const pVersions = await personaAPI.getVersions();
      const mVersions = await matrixAPI.getVersions();
      
      setPersonaVersions(pVersions);
      setMatrixVersions(mVersions);
      setShowVersionList(true);
    } catch (err) {
      setError('Failed to load versions');
      console.error(err);
    }
  }

  function handleSelectUserPersonaVersion() {
    const input = prompt('Enter User Persona Version ID (number):');
    if (!input) return;
    
    const versionId = parseInt(input);
    if (isNaN(versionId)) {
      alert('Invalid version ID');
      return;
    }
    
    setUserPersonaVersion(versionId);
  }

  function handleSelectPersonaTableVersion() {
    const input = prompt('Enter Persona Table (Matrix) Version ID (number):');
    if (!input) return;
    
    const versionId = parseInt(input);
    if (isNaN(versionId)) {
      alert('Invalid version ID');
      return;
    }
    
    setPersonaTableVersion(versionId);
  }

  async function handleRunSimulation() {
    if (!userPersonaVersion || !personaTableVersion) {
      alert('Select both versions first');
      return;
    }

    try {
      setOutput('Computing alignments...\n');
      const result = await calculatorAPI.computeAlignments(userPersonaVersion, personaTableVersion);
      
      if (!result.alignments || Object.keys(result.alignments).length === 0) {
        setOutput('No alignments computed. Check if users and matrix are populated.');
        return;
      }

      setAlignments(result.alignments);
      setOutput(`Alignments computed for ${result.userCount} active users.\nUse buttons above to view alignments or run simulations.`);
      setShowControls(true);
      setError(null);
    } catch (err: any) {
      setError('Failed to compute alignments');
      setOutput(`Error: ${err.message || 'Unknown error'}`);
      console.error(err);
    }
  }

  function handleShowAlignments() {
    if (!alignments) {
      alert('Run simulation first');
      return;
    }

    let text = '';
    for (const [userName, personas] of Object.entries(alignments)) {
      text += `--- ${userName} ---\n`;
      personas.forEach((p, i) => {
        text += `${String(i + 1).padStart(2, ' ')}. ${p.persona}: ${p.percentage.toFixed(2)}%\n`;
      });
      text += '\n';
    }
    setOutput(text);
  }

  async function handleRunPairMatching() {
    if (!alignments) {
      alert('Run simulation first');
      return;
    }

    try {
      setOutput('[Run Pairs] Starting matchmaking...\n');
      const result: PairMatchResult = await calculatorAPI.runPairMatching(alignments);

      let text = '\nMatches:\n';
      result.matches.forEach((match, i) => {
        text += `${i + 1}. ${match.user1} ('${match.persona1}', rank ${match.rank1}) + ${match.user2} ('${match.persona2}', rank ${match.rank2}) via ${match.persona}\n`;
      });

      if (result.remaining.length > 0) {
        text += '\nRemaining in queue:\n';
        result.remaining.forEach(username => {
          text += ` - ${username}\n`;
        });
      }

      setOutput(text);
    } catch (err: any) {
      setError('Failed to run pair matching');
      setOutput(`Error: ${err.message || 'Unknown error'}`);
      console.error(err);
    }
  }

  async function handleRunLobbyMode() {
    if (!alignments) {
      alert('Run simulation first');
      return;
    }

    try {
      setOutput('[Run Lobbies] Creating lobbies...\n');
      const result: LobbyResult = await calculatorAPI.runLobbyMode(alignments);

      let text = '';

      if (result.lobbies && result.lobbies.length > 0) {
        text += '\nLobbies:\n';
        result.lobbies.forEach((lobby, i) => {
          text += `Lobby ${i + 1} (${lobby.length} players):\n`;
          lobby.forEach(player => {
            text += `  ${player.account_number} ('${player.persona}', rank ${player.rank})\n`;
          });
          text += '\n';
        });
      }

      if (result.leftovers && result.leftovers.length > 0) {
        text += 'Leftover players:\n';
        result.leftovers.forEach(username => {
          text += ` - ${username}\n`;
        });
      }

      setOutput(text);
    } catch (err: any) {
      setError('Failed to run lobby mode');
      setOutput(`Error: ${err.message || 'Unknown error'}`);
      console.error(err);
    }
  }

  return (
    <div className="page">
      <h2>User Persona Calculate</h2>

      <div className="controls">
        <button className="back-button" onClick={onBack}>← Back to Menu</button>
        <button onClick={handleShowVersions}>📋 Show Available Versions</button>
        <button onClick={handleSelectUserPersonaVersion}>Select User Persona Version</button>
        <button onClick={handleSelectPersonaTableVersion}>Select Persona Table Version</button>
        <button onClick={handleRunSimulation}>Run Simulation</button>
      </div>

      {showVersionList && (
        <div style={{ 
          padding: '20px', 
          background: '#fff3cd', 
          margin: '10px 0', 
          borderRadius: '4px',
          border: '2px solid #ffc107'
        }}>
          <h3>📋 Available Versions</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>USER PERSONA VERSIONS:</strong>
            {personaVersions.length === 0 ? (
              <p>No versions found. Create one in User Persona Tables page.</p>
            ) : (
              <table style={{ width: '100%', marginTop: '5px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>ID</th>
                    <th style={{ textAlign: 'left' }}>Version Name</th>
                  </tr>
                </thead>
                <tbody>
                  {personaVersions.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.id}</strong></td>
                      <td>{v.version_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <strong>PERSONA TABLE (MATRIX) VERSIONS:</strong>
            {matrixVersions.length === 0 ? (
              <p>No versions found. Create one in Persona Tables page.</p>
            ) : (
              <table style={{ width: '100%', marginTop: '5px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>ID</th>
                    <th style={{ textAlign: 'left' }}>Version Name</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixVersions.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.id}</strong></td>
                      <td>{v.version_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p style={{ marginTop: '15px', color: '#856404' }}>
            <strong>💡 Tip:</strong> Use the <strong>ID</strong> numbers when selecting versions above!
          </p>
          
          <button onClick={() => setShowVersionList(false)} style={{ marginTop: '10px' }}>
            Close
          </button>
        </div>
      )}

      <div style={{ padding: '20px', background: '#f8f9fa', margin: '10px 0', borderRadius: '4px' }}>
        <div><strong>User Persona Version:</strong> {userPersonaVersion || 'None selected'}</div>
        <div><strong>Persona Table Version:</strong> {personaTableVersion || 'None selected'}</div>
      </div>

      {showControls && (
        <div className="controls">
          <button onClick={handleShowAlignments}>Show Persona Alignments</button>
          <button onClick={handleRunPairMatching}>Run Pair Matching</button>
          <button onClick={handleRunLobbyMode}>Run Lobby Mode</button>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="table-container" style={{ maxHeight: 'none' }}>
        <div style={{ 
          padding: '20px', 
          fontFamily: "'Consolas', monospace", 
          whiteSpace: 'pre-wrap', 
          lineHeight: 1.6,
          color: '#333'
        }}>
          {output || 'Click "Show Available Versions" to see what versions you can use, then select them and run simulation...'}
        </div>
      </div>
    </div>
  );
}
