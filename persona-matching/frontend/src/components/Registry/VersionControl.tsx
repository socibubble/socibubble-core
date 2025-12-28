import { useState } from 'react';

interface VersionControlProps {
  onSaveVersion: (title: string) => void;
}

export default function VersionControl({ onSaveVersion }: VersionControlProps) {
  const [title, setTitle] = useState('UserRegistry');

  function handleSave() {
    if (!title.trim()) {
      alert('Version title is required');
      return;
    }
    onSaveVersion(title);
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
        <label htmlFor="versionTitle">Version Title:</label>
        <input
          id="versionTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., UserRegistry"
        />
      </div>
      <button onClick={handleSave}>Save Version Snapshot</button>
    </div>
  );
}
