import type { User } from '../../types';

interface UserListProps {
  users: User[];
  onDelete: (userId: string) => void;
  onToggleArchive: (userId: string, currentStatus: boolean) => void;
  selectedUserId?: string | null;
  onSelectUser?: (userId: string) => void;
}

export default function UserList({ users, onDelete, onToggleArchive, selectedUserId, onSelectUser }: UserListProps) {
  if (users.length === 0) {
    return <p>No users yet. Add one above!</p>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Root ID</th>
            <th>Public ID</th>
            <th>Hash</th>
            <th>Name</th>
            <th>Template</th>
            <th>Persona Vector</th>
            <th>Timestamp</th>
            <th>Created</th>
            <th>Archived</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr 
              key={user.id}
              onClick={() => onSelectUser?.(user.id)}
              style={{ 
                cursor: 'pointer',
                backgroundColor: selectedUserId === user.id ? '#e7f3ff' : 'transparent'
              }}
            >
              <td>{user.id}</td>
              <td>{user.root_id}</td>
              <td>{user.public_id}</td>
              <td>{user.hash}</td>
              <td>{user.name}</td>
              <td>{user.template || ''}</td>
              <td>{user.persona_vector || ''}</td>
              <td>{user.timestamp}</td>
              <td>{user.created}</td>
              <td>{user.archived ? 'true' : 'false'}</td>
              <td>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    className="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleArchive(user.id, user.archived);
                    }}
                  >
                    {user.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button 
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(user.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}