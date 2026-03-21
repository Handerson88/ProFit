import { api } from './api';

class AppService {
  private status: { totalUsers: number, monetizationEnabled: boolean } | null = null;

  async getStatus() {
    try {
      const data = await api.app.getStatus();
      this.status = data;
      return data;
    } catch (error) {
      console.error('Failed to get app status:', error);
      return { totalUsers: 0, monetizationEnabled: false };
    }
  }

  isMonetizationEnabled() {
    return this.status?.monetizationEnabled || false;
  }
}

export const appService = new AppService();
