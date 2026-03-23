import { api } from './api';

const PUBLIC_VAPID_KEY = 'BDZj5D4q4-h8VYjQC37AG3yW7Yw6y-oScxrsdwUajfaXXpSBoc_h3S9HwFpb8x0awJTBeEeAR_hwN6MyRPBi050';

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  /**
   * Check if notifications are supported and get current permission status
   */
  getPermissionStatus(): NotificationStatus {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationStatus;
  }

  /**
   * Helper to convert VAPID key for pushManager
   */
  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Request permission and subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (this.getPermissionStatus() === 'unsupported') {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Get or create subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
      }

      // Sync with backend
      await api.notifications.registerDevice(subscription);
      
      // Update bit in user profile (legacy support)
      await api.user.updateNotificationSettings(true);

      return true;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      
      // Update backend
      await api.user.updateNotificationSettings(false);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  }
}

export const notificationService = new NotificationService();
