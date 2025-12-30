
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

const db = admin.firestore();
const androidpublisher = google.androidpublisher('v3');

// This function securely verifies a purchase with Google and grants entitlement.
export const verifyPurchase = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { purchaseToken, productId, packageName } = data;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to make a purchase.');
  }

  if (!purchaseToken || !productId || !packageName) {
    throw new functions.https.HttpsError('invalid-argument', 'Purchase token, product ID, and package name are required.');
  }
  
  // Google Play Console'daki ana abonelik ürün kimliğiniz
  const GOOGLE_PLAY_SUBSCRIPTION_ID = 'premium_uyelik_1ay';

  try {
    // Authorize the Google API client
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    // Verify the subscription purchase with Google
    const res = await androidpublisher.purchases.subscriptions.get({
      packageName: packageName,
      subscriptionId: GOOGLE_PLAY_SUBSCRIPTION_ID, // Her zaman ana ürün kimliğini kullan
      token: purchaseToken,
    });

    const sub = res.data;

    // Check if the purchase is valid and has an expiry date
    if (!sub.expiryTimeMillis || parseInt(sub.expiryTimeMillis, 10) < Date.now()) {
        throw new functions.https.HttpsError('internal', 'Verification failed: Purchase is expired or has no expiry time.');
    }
    
    // Determine premium tier based on the base plan ID (`productId`)
    let premiumTier = 'gold'; // default
    if (productId.includes('weekly')) premiumTier = 'weekly';
    if (productId.includes('yearly')) premiumTier = 'platinum';


    // Everything is valid, update the user's profile in Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      isPremium: true, // Genel bir premium durumu
      premiumTier: premiumTier, // Hangi seviye olduğunu belirt
      purchaseToken: purchaseToken, // Sunucu bildirimleri için sakla
      expiryDate: admin.firestore.Timestamp.fromMillis(parseInt(sub.expiryTimeMillis, 10)),
      autoRenewing: sub.autoRenewing,
      subscriptionId: productId // Hangi temel planı aldığını sakla (weekly-base vb.)
    });

    return { success: true, message: 'Subscription verified and activated.' };

  } catch (error: any) {
    console.error('Error verifying Google Play purchase:', error);
    // Provide more specific feedback for common errors
    if (error.code === 404) {
        throw new functions.https.HttpsError('not-found', 'The purchase token or subscription was not found by Google.');
    }
     if (error.code === 401) {
        throw new functions.https.HttpsError('unauthenticated', 'The service account does not have permission to access the Google Play API. Check IAM roles.');
    }
    throw new functions.https.HttpsError('internal', error.message || 'An unknown error occurred during purchase verification.');
  }
});
