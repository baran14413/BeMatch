
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

const db = admin.firestore();
// This is the main SUBSCRIPTION ID from the Play Console.
const GOOGLE_PLAY_SUBSCRIPTION_ID = 'premium_uyelik_1ay';

// This map translates the purchased BASE PLAN ID to the premium tier we'll store in Firestore.
const planIdToTierMap: { [key: string]: 'premium' } = {
  'monthly-base': 'premium',
  // If you add other plans like 'weekly-base' in the future, map them here.
};


/**
 * Verifies a Google Play purchase and updates the user's profile in Firestore.
 */
export const verifyPurchase = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { purchaseToken, productId, packageName } = data;
  const uid = context.auth?.uid;

  // --- Basic Validation ---
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to make a purchase.');
  }
  if (!purchaseToken || !productId || !packageName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required purchase data. The client must send purchaseToken, productId (the base plan ID), and packageName.');
  }

  try {
    // --- Initialize Google APIs ---
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const authClient = await auth.getClient();
    const publisher = google.androidpublisher({
      version: 'v3',
      auth: authClient,
    });
    
    // --- Verify with Google Play Developer API ---
    // We use the main subscription ID for verification, as the base plans are under it.
    const response = await publisher.purchases.subscriptions.get({
      packageName: packageName,
      subscriptionId: GOOGLE_PLAY_SUBSCRIPTION_ID,
      token: purchaseToken,
    });
    
    const subscription = response.data;
    
    if (response.status !== 200 || !subscription) {
      throw new functions.https.HttpsError('internal', 'Failed to verify subscription with Google Play.');
    }

    // --- Process Subscription ---
    const { expiryTimeMillis, autoRenewing } = subscription;
    
    if (!expiryTimeMillis) {
        throw new functions.https.HttpsError('internal', 'Subscription is missing an expiration date.');
    }
    
    const expiryDate = new Date(parseInt(expiryTimeMillis));
    const userRef = db.collection('users').doc(uid);

    // Determine the premium tier based on the purchased base plan ID (e.g., 'monthly-base')
    const premiumTier = planIdToTierMap[productId as keyof typeof planIdToTierMap];
    if (!premiumTier) {
        // This should not happen if the client sends a valid productId from your config
        console.error(`Invalid productId received: ${productId}. It does not exist in planIdToTierMap.`);
        throw new functions.https.HttpsError('invalid-argument', `Invalid productId provided: ${productId}.`);
    }

    // --- Update Firestore ---
    await userRef.update({
      isPremium: true,
      subscriptionId: GOOGLE_PLAY_SUBSCRIPTION_ID, // Store the main subscription ID
      purchaseToken: purchaseToken,
      expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
      autoRenewing: autoRenewing ?? false,
      premiumTier: premiumTier, // Store 'premium'
      premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiryDate),
    });

    console.log(`Successfully verified and updated subscription for user ${uid}. Tier: ${premiumTier}`);
    return { success: true, message: 'Purchase verified successfully.' };

  } catch (error: any) {
    console.error(`Error verifying purchase for user ${uid}:`, error);
    
    // Extract a more specific error message if available from Google's API response
    let errorMessage = 'An internal error occurred during purchase verification.';
    if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
    } else if (error instanceof functions.https.HttpsError) {
        errorMessage = error.message;
    } else if (error.message) {
        errorMessage = error.message;
    }

    // Return a structured error to the client
    return { success: false, message: errorMessage };
  }
});
