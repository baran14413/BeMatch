
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

const db = admin.firestore();
const androidpublisher = google.androidpublisher('v3');

// This map links your in-app product IDs to the subscription types in Google Play
// IMPORTANT: Replace 'your_weekly_sub_id', etc. with your actual subscription IDs from Google Play Console
const planToSubscriptionIdMap: { [key: string]: string } = {
  'weekly-base': 'weekly_subscription', // e.g., weekly-base from your config -> your ID in Play Store
  'monthly-base': 'monthly_subscription', // e.g., monthly-base from your config -> your ID in Play Store
  'yearly-base': 'yearly_subscription',  // e.g., yearly-base from your config -> your ID in Play Store
};

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

  const subscriptionId = planToSubscriptionIdMap[productId];
  if (!subscriptionId) {
      throw new functions.https.HttpsError('not-found', `No Google Play subscription ID found for the product ID: ${productId}`);
  }

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
      subscriptionId: subscriptionId,
      token: purchaseToken,
    });

    const sub = res.data;

    if (!sub.expiryTimeMillis) {
        throw new functions.https.HttpsError('internal', 'Verification failed: No expiry time returned from Google.');
    }
    
    // Determine premium tier based on product ID
    let premiumTier = 'gold'; // default
    if (productId.includes('weekly')) premiumTier = 'weekly';
    if (productId.includes('yearly')) premiumTier = 'platinum';


    // Everything is valid, update the user's profile in Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      isPremium: true,
      premiumTier: premiumTier,
      purchaseToken: purchaseToken, // Store the token for potential server-to-server notifications
      expiryDate: admin.firestore.Timestamp.fromMillis(parseInt(sub.expiryTimeMillis, 10)),
      autoRenewing: sub.autoRenewing,
      subscriptionId: productId
    });

    return { success: true, message: 'Subscription verified and activated.' };

  } catch (error: any) {
    console.error('Error verifying Google Play purchase:', error);
    // Check for specific Google API errors if needed
    if (error.code === 404) {
        throw new functions.https.HttpsError('not-found', 'The purchase token or subscription was not found by Google.');
    }
    throw new functions.https.HttpsError('internal', error.message || 'An unknown error occurred during purchase verification.');
  }
});
