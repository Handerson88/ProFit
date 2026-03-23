/**
 * Firebase Frontend Configuration
 *
 * REQUIRED: Fill in your Firebase project config below.
 * 
 * How to get these values:
 * Firebase Console → ⚙️ Configurações → Geral → "Seus apps" → Web App → Configuração do SDK
 * 
 * For VITE_FIREBASE_VAPID_KEY:
 * Firebase Console → Cloud Messaging → Configurações da Web → Certificados Web Push → Gerar chave
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// VAPID key from Firebase Console → Cloud Messaging → Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Check if Firebase is configured (all required env vars are set)
 */
function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    VAPID_KEY
  );
}

/**
 * Initialize Firebase app (only once)
 */
function initFirebase(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    return app;
  } catch (e) {
    console.error('[Firebase] Init error:', e);
    return null;
  }
}

/**
 * Get Firebase Messaging instance
 */
function getFirebaseMessaging(): Messaging | null {
  if (!isFirebaseConfigured()) return null;
  if (messaging) return messaging;
  const firebaseApp = initFirebase();
  if (!firebaseApp) return null;
  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (e) {
    console.error('[Firebase] Messaging init error:', e);
    return null;
  }
}

/**
 * Request notification permission and get FCM token
 * Returns the FCM token string, or null if unavailable/not configured
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Not configured. Set VITE_FIREBASE_* env vars.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const msg = getFirebaseMessaging();
    if (!msg) return null;

    // Register the Firebase service worker
    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
    }
    return token || null;
  } catch (error) {
    console.error('[FCM] getToken error:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 * Call this once after the user grants permission
 */
export function listenForForegroundMessages(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
) {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};

  const unsubscribe = onMessage(msg, (payload) => {
    console.log('[FCM] Foreground message received:', payload);
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data as Record<string, string>,
    });
  });

  return unsubscribe;
}

export { isFirebaseConfigured };
