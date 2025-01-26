import { API_CONFIG } from '@/config/api';

export const healthService = {
  async checkHealth(): Promise<boolean> {
    try {
      console.log('Checking backend health at:', `${API_CONFIG.BASE_URL}/health`);
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
      const data = await response.json();
      console.log('Health check response:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};