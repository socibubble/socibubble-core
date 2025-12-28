import { useState } from 'react';
import { matrixAPI } from '../api/matrix.api';
import type { MatrixData } from '../types';

interface MatrixPageProps {
  onBack: () => void;
}

export default function MatrixPage({ onBack }: MatrixPageProps) {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNewVersion() {
    try {
      const result = await matrixAPI.createVersion(currentVersion || undefined);
      setCurrentVersion(result.version);
      setVersionId(result.data.id);
      alert(`Created: ${result.version}`);
      await loadMatrixData(result.data.id);
    } catch (err) {
      setError('Failed to create version');
      console.error(err);
    }
  }

  async function loadMatrixData(vId: number) {
    try {
      setLoading(true);
      const data = await matrixAPI.getMatrixData(vId);
      setMatrixData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load matrix data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkLoadMatrix() {
    if (!versionId) {
      alert('Create a version first');
      return;
    }

    const input = prompt(
      'Enter matrix data as JSON:\n\nExample:\n{\n  "PersonaA": [0,1,0,1],\n  "PersonaB": [1,0,1,0]\n}'
    );
    if (!input) return;

    try {
      const matrix = JSON.parse(input);
      const result = await matrixAPI.bulkLoadMatrix(matrix, versionId);
      alert(`Loaded ${result.rowCount} rows and ${result.columnCount} columns`);
      await loadMatrixData(versionId);
    } catch (err) {
      setError('Failed to bulk load matrix');
      console.error(err);
    }
  }

  async function handleAddRow() {
    if (!versionId) {
      alert('Create a version first');
      return;
    }

    const name = prompt('Enter row name (persona archetype):');
    if (!name) return;

    try {
      await matrixAPI.addRow(name, versionId);
      await loadMatrixData(versionId);
    } catch (err) {
      setError('Failed to add row');
      console.error(err);
    }
  }

  async function handleAddColumn() {
    if (!versionId) {
      alert('Create a version first');
      return;
    }

    const name = prompt('Enter column name:');
    if (!name) return;

    try {
      await matrixAPI.addColumn(name, versionId);
      await loadMatrixData(versionId);
    } catch (err) {
      setError('Failed to add column');
      console.error(err);
    }
  }

  async function handleCellClick(rowId: string, colId: string, currentValue: number) {
    const newValue = prompt(`Current value: ${currentValue}. Enter new value (0 or 1):`);
    if (newValue === null) return;

    const value = parseInt(newValue);
    if (value !== 0 && value !== 1) {
      alert('Value must be 0 or 1');
      return;
    }

    try {
      await matrixAPI.updateCell(rowId, colId, value);
      if (versionId) await loadMatrixData(versionId);
    } catch (err) {
      setError('Failed to update cell');
      console.error(err);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <h2>
        Persona Tables (Matrix)
        {currentVersion && versionId && (
          <span className="version-badge">Version {versionId}: {currentVersion}</span>
        )}
      </h2>

      <div className="controls">
        <button className="back-button" onClick={onBack}>← Back to Menu</button>
        <button onClick={handleNewVersion}>New Version</button>
        <button onClick={handleBulkLoadMatrix}>Bulk Load Matrix</button>
        <button onClick={handleAddRow}>Add Row</button>
        <button onClick={handleAddColumn}>Add Column</button>
      </div>

      {error && <div className="error">{error}</div>}

      {!matrixData && (
        <p>Create a version to get started.</p>
      )}

      {matrixData && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Persona</th>
                {matrixData.columns.map(col => (
                  <th key={col.id}>{col.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.rows.length === 0 ? (
                <tr>
                  <td colSpan={1 + matrixData.columns.length}>No rows. Add rows or bulk load matrix.</td>
                </tr>
              ) : (
                matrixData.rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    {matrixData.columns.map(col => (
                      <td
                        key={col.id}
                        style={{ cursor: 'pointer', textAlign: 'center' }}
                        onClick={() => handleCellClick(row.id, col.id, row.cells[col.id] || 0)}
                      >
                        {row.cells[col.id] !== undefined ? row.cells[col.id] : 0}
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
