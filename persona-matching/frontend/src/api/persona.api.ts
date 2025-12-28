import axios from './axiosConfig';
import type { PersonaData, PersonaVersion, PersonaColumn } from '../types';

export const personaAPI = {
  // Get versions
  getVersions: async (): Promise<Array<{ id: number; version_name: string }>> => {
    const response = await axios.get('/api/persona/versions');
    return response.data;
  },

  // Create version
  createVersion: async (baseVersion?: string): Promise<{ version: string; data: PersonaVersion }> => {
    const response = await axios.post('/api/persona/versions', { baseVersion });
    return response.data;
  },

  // Import users from registry
  importUsers: async (registryVersion: number | null, personaVersion: number): Promise<{ imported: number; total: number }> => {
    const response = await axios.post('/api/persona/import', { 
      registryVersion, 
      personaVersion 
    });
    return response.data;
  },

  // Get persona data
  getPersonaData: async (versionId: number): Promise<PersonaData> => {
    const response = await axios.get('/api/persona/data', { 
      params: { version: versionId } 
    });
    return response.data;
  },

  // Add column
  addColumn: async (name: string, version: number): Promise<{ colId: string; column: PersonaColumn }> => {
    const response = await axios.post('/api/persona/columns', { name, version });
    return response.data;
  },

  // Bulk add columns
  bulkAddColumns: async (columns: string[], version: number): Promise<{ count: number; columns: PersonaColumn[] }> => {
    const response = await axios.post('/api/persona/columns/bulk', { columns, version });
    return response.data;
  },

  // Delete column
  deleteColumn: async (columnId: string): Promise<{ success: boolean; column: PersonaColumn }> => {
    const response = await axios.delete(`/api/persona/columns/${columnId}`);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`/api/persona/users/${userId}`);
    return response.data;
  },

  // Update cell
  updateCell: async (userId: string, colId: string, value: number): Promise<{ success: boolean }> => {
    const response = await axios.put('/api/persona/cell', { userId, colId, value });
    return response.data;
  },
};
