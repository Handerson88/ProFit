import { api } from './api';
import { getFCMToken } from './firebaseService';

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  /**
   * Check real browser permission status
   */
  getPermissionStatus(): NotificationStatus {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationStatus;
  }

  /**
   * Subscribe to push notifications using FCM (primary) + Web Push (fallback)
   */
  async subscribe(): Promise<boolean> {
    const status = this.getPermissionStatus();
    if (status === 'unsupported') {
      console.warn('[Notifications] Not supported in this browser');
      return false;
    }

    if (status === 'denied') {
      console.warn('[Notifications] Permission denied by user');
      return false;
    }

    try {
      // --- FCM Path (primary) ---
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        // Send FCM token to backend
        await api.notifications.saveFCMToken(fcmToken);
        // Mark user as notifications_enabled
        await api.user.updateNotificationSettings(true);
        console.log('[Notifications] FCM subscription successful');
        return true;
      }

      // --- Web Push Fallback ---
      console.log('[Notifications] FCM not available, using Web Push fallback');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const PUBLIC_VAPID_KEY = 'BDZj5D4q4-h8VYjQC37AG3yW7Yw6y-oScxrsdwUajfaXXpSBoc_h3S9HwFpb8x0awJTBeEeAR_hwN6MyRPBi050';
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY).buffer as ArrayBuffer,
        });
      }
      await api.notifications.registerDevice(subscription);
      await api.user.updateNotificationSettings(true);

      return true;
    } catch (error) {
      console.error('[Notifications] Subscribe error:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      // Remove Web Push subscription
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
      }
      // Update backend
      await api.user.updateNotificationSettings(false);
    } catch (error) {
      console.error('[Notifications] Unsubscribe error:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();
