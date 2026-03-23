/**
 * Firebase Admin SDK initialization
 * 
 * CONFIGURATION REQUIRED:
 * Set these environment variables in your backend/.env and on Vercel:
 *   FIREBASE_PROJECT_ID=your-project-id
 *   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
 *   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 * 
 * How to get these values:
 * Firebase Console → ⚙️ Configurações do Projeto → Contas de Serviço
 * → Gerar nova chave privada → Download JSON
 * The JSON file contains: project_id, client_email, private_key
 */

const admin = require('firebase-admin');

let firebaseApp = null;

function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] ⚠️  Firebase credentials not configured. FCM push notifications are disabled.');
    console.warn('[Firebase] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase] ✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('[Firebase] ❌ Failed to initialize Firebase Admin:', error.message);
    return null;
  }

  return firebaseApp;
}

/**
 * Send FCM push notification to a list of FCM tokens
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {object} payload - { title, body, data }
 * @returns {object} - { successCount, failureCount, invalidTokens }
 */
async function sendFCMNotification(tokens, payload) {
  const app = getFirebaseAdmin();
  if (!app) {
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }

  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const message = {
    tokens,
    notification: {
      title: payload.title || 'ProFit',
      body: payload.body || '',
    },
    data: payload.data ? Object.fromEntries(
      Object.entries(payload.data).map(([k, v]) => [k, String(v)])
    ) : {},
    webpush: {
      notification: {
        title: payload.title || 'ProFit',
        body: payload.body || '',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        click_action: process.env.FRONTEND_URL || 'https://pro-fit-two.vercel.app',
      },
    },
    android: {
      notification: {
        sound: 'default',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(tokens[idx]);
        }
        console.error(`[FCM] Failed for token ${tokens[idx]?.substring(0, 20)}...: ${resp.error?.message}`);
      }
    });

    console.log(`[FCM] Sent: ${response.successCount} success, ${response.failureCount} failed`);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('[FCM] sendEachForMulticast error:', error);
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}

module.exports = { getFirebaseAdmin, sendFCMNotification };
