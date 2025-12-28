import { useState } from 'react';

interface UserFormProps {
  onSubmit: (name: string, personaVector: string) => void;
}

export default function UserForm({ onSubmit }: UserFormProps) {
  const [name, setName] = useState('');
  const [personaVector, setPersonaVector] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    onSubmit(name, personaVector);
    setName('');
    setPersonaVector('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter user name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="personaVector">Persona Vector (binary string):</label>
        <input
          id="personaVector"
          type="text"
          value={personaVector}
          onChange={(e) => setPersonaVector(e.target.value)}
          placeholder="e.g., 10110100"
          pattern="[01]*"
          title="Only 0s and 1s allowed"
        />
      </div>

      <button type="submit">Add User</button>
    </form>
  );
}
