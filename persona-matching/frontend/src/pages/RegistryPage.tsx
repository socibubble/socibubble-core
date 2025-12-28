import { useState, useEffect } from 'react';
import { registryAPI } from '../api/registry.api';
import type { User } from '../types';
import UserList from '../components/Registry/UserList';
import UserForm from '../components/Registry/UserForm';

interface RegistryPageProps {
  onBack: () => void;
}

export default function RegistryPage({ onBack }: RegistryPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await registryAPI.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(name: string, personaVector: string) {
    try {
      await registryAPI.addUser({ name, persona_vector: personaVector });
      await loadUsers();
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add user');
      console.error(err);
    }
  }

  async function handleBulkLoadUsers() {
    const input = prompt(
      'Enter users as JSON:\n\nExample:\n{\n  "Alice": "10110100",\n  "Bob": "01001011"\n}'
    );
    if (!input) return;

    try {
      const data = JSON.parse(input);
      
      // Convert object format to array of users
      const users = Object.entries(data).map(([name, vector]) => ({
        name: name,
        persona_vector: Array.isArray(vector) ? (vector as number[]).join('') : String(vector)
      }));

      if (users.length === 0) {
        alert('No users found');
        return;
      }

      if (!confirm(`Load ${users.length} users?`)) {
        return;
      }

      await registryAPI.bulkAddUsers(users);
      alert(`Loaded ${users.length} users!`);
      await loadUsers();
    } catch (err) {
      alert(`Error parsing JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Delete this user?')) return;
    
    try {
      await registryAPI.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  }

  async function handleToggleArchive(userId: string, currentStatus: boolean) {
    try {
      await registryAPI.toggleArchive(userId, !currentStatus);
      await loadUsers();
    } catch (err) {
      setError('Failed to update archive status');
      console.error(err);
    }
  }

  async function handleSaveVersion() {
    const title = prompt('Version title:', 'UserRegistry');
    if (!title) return;

    try {
      const result = await registryAPI.saveVersion(title);
      alert(`Version created: ${result.versionName}`);
      setCurrentVersion(result.versionName);
      await loadUsers();
    } catch (err) {
      setError('Failed to save version');
      console.error(err);
    }
  }

  async function handleLoadVersion() {
    try {
      const versions = await registryAPI.getVersions();
      
      if (versions.length === 0) {
        alert('No versions available');
        return;
      }

      const versionList = versions.map((v, i) => `${i + 1}. ${v}`).join('\n');
      const selection = prompt(`Select a version:\n\n${versionList}\n\nEnter the version name:`);
      
      if (!selection) return;

      // Load users for that version
      const versionId = selection; // Using version name as ID for now
      setCurrentVersion(versionId);
      // TODO: Load users by version - need to update API
      await loadUsers();
    } catch (err) {
      setError('Failed to load version');
      console.error(err);
    }
  }

  async function handleUpdateUser() {
    if (!selectedUserId) {
      alert('Please select a user from the table first');
      return;
    }

    const newName = prompt('Enter new name for the user:');
    if (!newName) return;

    try {
      await registryAPI.updateUser(selectedUserId, newName);
      alert('User updated successfully');
      await loadUsers();
      setSelectedUserId(null);
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    }
  }

  async function handleDeleteUserToolbar() {
    if (!selectedUserId) {
      alert('Please select a user from the table first');
      return;
    }

    if (!confirm('Delete this user?')) return;

    try {
      await registryAPI.deleteUser(selectedUserId);
      alert('User deleted successfully');
      await loadUsers();
      setSelectedUserId(null);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  }

  async function handleToggleArchivedToolbar() {
    if (!selectedUserId) {
      alert('Please select a user from the table first');
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    try {
      await registryAPI.toggleArchive(selectedUserId, user.archived);
      alert(`User ${user.archived ? 'unarchived' : 'archived'} successfully`);
      await loadUsers();
    } catch (err) {
      setError('Failed to toggle archive status');
      console.error(err);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <h2>
        User Table CRUD App
        {currentVersion && <span className="version-badge">Version: {currentVersion}</span>}
      </h2>
      
      <div className="controls">
        <button className="back-button" onClick={onBack}>← Back to Menu</button>
        <button onClick={() => setShowAddForm(!showAddForm)}>Add User</button>
        <button onClick={handleBulkLoadUsers}>Bulk Load Users</button>
        <button onClick={handleUpdateUser}>Update User</button>
        <button onClick={handleDeleteUserToolbar}>Delete User</button>
        <button onClick={handleToggleArchivedToolbar}>Toggle Archived</button>
        <button onClick={handleSaveVersion}>Save Version</button>
        <button onClick={handleLoadVersion}>Load Version</button>
      </div>

      {error && <div className="error">{error}</div>}

      {showAddForm && (
        <div className="section">
          <h3>Add User</h3>
          <UserForm onSubmit={handleAddUser} />
          <button onClick={() => setShowAddForm(false)} style={{ marginTop: '10px' }}>Cancel</button>
        </div>
      )}

      <UserList 
        users={users} 
        onDelete={handleDeleteUser}
        onToggleArchive={handleToggleArchive}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
      />
    </div>
  );
}
