import axios from './axiosConfig';
import type { User, RegistryVersion } from '../types';

export const registryAPI = {
  // Get users
  getUsers: async (versionId?: number | null): Promise<User[]> => {
    const params = versionId ? { version: versionId } : {};
    const response = await axios.get('/api/users', { params });
    return response.data;
  },

  // Add user
  addUser: async (userData: { name: string; persona_vector?: string }): Promise<User> => {
    const response = await axios.post('/api/users', userData);
    return response.data;
  },

  // Bulk add users
  bulkAddUsers: async (users: { name: string; persona_vector?: string }[]): Promise<{ count: number; users: User[] }> => {
    const response = await axios.post('/api/users/bulk', { users });
    return response.data;
  },

  // Update user
  updateUser: async (userId: string, name: string): Promise<User> => {
    const response = await axios.put(`/api/users/${userId}`, { name });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ success: boolean; user: User }> => {
    const response = await axios.delete(`/api/users/${userId}`);
    return response.data;
  },

  // Toggle archive
  toggleArchive: async (userId: string, status: boolean): Promise<User> => {
    const response = await axios.patch(`/api/users/${userId}/archive`, { status });
    return response.data;
  },

  // Save version
  saveVersion: async (title: string): Promise<{ versionName: string; version: RegistryVersion }> => {
    const response = await axios.post('/api/versions', { title });
    return response.data;
  },

  // Get versions
  getVersions: async (): Promise<string[]> => {
    const response = await axios.get('/api/versions');
    return response.data;
  },
};
