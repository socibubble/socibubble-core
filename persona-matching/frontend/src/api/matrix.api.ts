import axios from './axiosConfig';
import type { MatrixData, MatrixVersion, MatrixRow, MatrixColumn } from '../types';

export const matrixAPI = {
  // Get versions
  getVersions: async (): Promise<Array<{ id: number; version_name: string }>> => {
    const response = await axios.get('/api/matrix/versions');
    return response.data;
  },

  // Create version
  createVersion: async (baseVersion?: string): Promise<{ version: string; data: MatrixVersion }> => {
    const response = await axios.post('/api/matrix/versions', { baseVersion });
    return response.data;
  },

  // Get matrix data
  getMatrixData: async (versionId: number): Promise<MatrixData> => {
    const response = await axios.get('/api/matrix/data', { 
      params: { version: versionId } 
    });
    return response.data;
  },

  // Add row
  addRow: async (name: string, version: number): Promise<{ rowId: string; row: MatrixRow }> => {
    const response = await axios.post('/api/matrix/rows', { name, version });
    return response.data;
  },

  // Add column
  addColumn: async (name: string, version: number): Promise<{ colId: string; column: MatrixColumn }> => {
    const response = await axios.post('/api/matrix/columns', { name, version });
    return response.data;
  },

  // Delete row
  deleteRow: async (rowId: string): Promise<{ success: boolean; row: MatrixRow }> => {
    const response = await axios.delete(`/api/matrix/rows/${rowId}`);
    return response.data;
  },

  // Delete column
  deleteColumn: async (columnId: string): Promise<{ success: boolean; column: MatrixColumn }> => {
    const response = await axios.delete(`/api/matrix/columns/${columnId}`);
    return response.data;
  },

  // Update cell
  updateCell: async (rowId: string, colId: string, value: number): Promise<{ success: boolean }> => {
    const response = await axios.put('/api/matrix/cell', { rowId, colId, value });
    return response.data;
  },

  // Bulk load matrix
  bulkLoadMatrix: async (
    matrix: { [personaName: string]: number[] }, 
    version: number
  ): Promise<{ rowCount: number; columnCount: number; rows: MatrixRow[]; columns: MatrixColumn[] }> => {
    const response = await axios.post('/api/matrix/bulk', { matrix, version });
    return response.data;
  },
};
