import { useState, useEffect } from 'react';
import { personaAPI } from '../api/persona.api';
import type { PersonaData } from '../types';

interface PersonaPageProps {
  onBack: () => void;
}

export default function PersonaPage({ onBack }: PersonaPageProps) {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNewVersion() {
    try {
      const result = await personaAPI.createVersion(currentVersion || undefined);
      setCurrentVersion(result.version);
      setVersionId(result.data.id);
      alert(`Created: ${result.version}`);
      await loadPersonaData(result.data.id);
    } catch (err) {
      setError('Failed to create version');
      console.error(err);
    }
  }

  async function loadPersonaData(vId: number) {
    try {
      setLoading(true);
      const data = await personaAPI.getPersonaData(vId);
      setPersonaData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load persona data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportUsers() {
    if (!versionId) {
      alert('Create a version first');
      return;
    }

    const registryVersion = prompt('Enter registry version ID (or leave empty for unversioned):');
    const regVersion = registryVersion ? parseInt(registryVersion) : null;

    try {
      const result = await personaAPI.importUsers(regVersion, versionId);
      alert(`Imported ${result.imported} users`);
      await loadPersonaData(versionId);
    } catch (err) {
      setError('Failed to import users');
      console.error(err);
    }
  }

  async function handleBulkAddColumns() {
    if (!versionId) {
      alert('Create a version first');
      return;
    }

    const input = prompt('Enter column names (comma-separated):');
    if (!input) return;

    const columns = input.split(',').map(c => c.trim()).filter(c => c);

    try {
      const result = await personaAPI.bulkAddColumns(columns, versionId);
      alert(`Added ${result.count} columns`);
      await loadPersonaData(versionId);
    } catch (err) {
      setError('Failed to add columns');
      console.error(err);
    }
  }

  async function handleCellClick(userId: string, colId: string, currentValue: number) {
    const newValue = prompt(`Current value: ${currentValue}. Enter new value (0 or 1):`);
    if (newValue === null) return;

    const value = parseInt(newValue);
    if (value !== 0 && value !== 1) {
      alert('Value must be 0 or 1');
      return;
    }

    try {
      await personaAPI.updateCell(userId, colId, value);
      if (versionId) await loadPersonaData(versionId);
    } catch (err) {
      setError('Failed to update cell');
      console.error(err);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <h2>
        User Persona Tables
        {currentVersion && versionId && (
          <span className="version-badge">Version {versionId}: {currentVersion}</span>
        )}
      </h2>

      <div className="controls">
        <button className="back-button" onClick={onBack}>← Back to Menu</button>
        <button onClick={handleNewVersion}>New Version</button>
        <button onClick={handleImportUsers}>Import Users from Registry</button>
        <button onClick={handleBulkAddColumns}>Bulk Load Columns</button>
      </div>

      {error && <div className="error">{error}</div>}

      {!personaData && (
        <p>Create a version to get started.</p>
      )}

      {personaData && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Public ID</th>
                <th>Hash</th>
                <th>Registry Version</th>
                <th>Persona Vector</th>
                {personaData.columns.map(col => (
                  <th key={col.id}>{col.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personaData.users.length === 0 ? (
                <tr>
                  <td colSpan={5 + personaData.columns.length}>No users. Import from registry.</td>
                </tr>
              ) : (
                personaData.users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.public_id || 'N/A'}</td>
                    <td>{user.hash}</td>
                    <td>{user.registry_version_id || 'N/A'}</td>
                    <td>{user.persona_vector}</td>
                    {personaData.columns.map(col => (
                      <td
                        key={col.id}
                        style={{ cursor: 'pointer', textAlign: 'center' }}
                        onClick={() => handleCellClick(user.id, col.id, user.cells[col.id] || 0)}
                      >
                        {user.cells[col.id] !== undefined ? user.cells[col.id] : 0}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
