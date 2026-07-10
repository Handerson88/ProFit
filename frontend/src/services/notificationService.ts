import { api } from './api';

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private readonly VAPID_KEY =
    import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

  // ── Platform detection ──────────────────────────────────────

  isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /** iOS requires Add to Home Screen for Web Push — return true when blocked */
  isIOSNotPWA(): boolean {
    return this.isIOS() && !this.isStandalone();
  }

  /**
   * Full capability check.
   * iOS requires PWA mode (Add to Home Screen) for Web Push.
   * All other platforms just need Notification + serviceWorker APIs.
   */
  isSupported(): boolean {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    if (!('Notification' in window)) return false;
    if (this.isIOS() && !this.isStandalone()) return false;
    return true;
  }

  getPermissionStatus(): NotificationStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationStatus;
  }

  // ── Subscribe ───────────────────────────────────────────────

  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[Push] Not supported on this platform/browser.');
      return false;
    }

    if (!this.VAPID_KEY) {
      console.error('[Push] VITE_VAPID_PUBLIC_KEY is not set.');
      return false;
    }

    // 1. Request permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.warn('[Push] Permission not granted:', permission);
      return false;
    }

    try {
      // 2. Ensure SW is registered
      let reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }

      // 3. Wait until SW is active
      await navigator.serviceWorker.ready;

      // 4. Get or create push subscription
      let subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        // Check if it was created with the same VAPID key
        const existingKey = subscription.options?.applicationServerKey;
        const newKey = this.urlBase64ToUint8Array(this.VAPID_KEY);
        if (existingKey && this.uint8ArraysEqual(new Uint8Array(existingKey), newKey)) {
          // Same key — reuse, just re-register with backend
          await api.notifications.registerDevice(subscription);
          return true;
        }
        // Different key — unsubscribe and re-subscribe
        await subscription.unsubscribe();
      }

      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_KEY),
      });

      // 5. Send to backend
      await api.notifications.registerDevice(subscription);
      await api.user.updateNotificationSettings(true);

      console.log('[Push] Subscription successful.');
      return true;
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      return false;
    }
  }

  // ── Unsubscribe ─────────────────────────────────────────────

  async unsubscribe(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await api.notifications.removeDevice();
      await api.user.updateNotificationSettings(false);
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  /** Convert URL-safe base64 VAPID key to Uint8Array (required by pushManager.subscribe) */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  private uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
}

export const notificationService = new NotificationService();
