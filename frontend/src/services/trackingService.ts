import { api, API_URL } from './api';
import { syncService } from './syncService';

class TrackingService {
  async logEvent(action: string, details?: any) {
    try {
      await api.activity.log(action, details);
    } catch (err: any) {
      // Offline fallback
      if (!err.status || err.status >= 500 || err.message === 'Failed to fetch') {
        syncService.enqueue(`${API_URL}/activity/log`, 'POST', {
          action,
          details
        });
      }
    }
  }
}

export const trackingService = new TrackingService();
