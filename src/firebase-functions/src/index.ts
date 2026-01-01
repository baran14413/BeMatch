import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

const db = admin.firestore();
const GOOGLE_PLAY_PRODUCT_ID = 'bematch_vip'; // Main Product ID from Play Console

// This map now translates our internal plan IDs to the premium tier we'll store in Firestore.
const planIdToTierMap: { [key: string]: 'weekly' | 'gold' | 'platinum' } = {
  'weekly-plan': 'weekly',
  'monthly-plan': 'gold',
  'yearly-plan': 'platinum',
};

const superLikePackages: { [key: string]: number } = {
    'superlike_5': 5,
    'superlike_15': 15,
    'superlike_30': 30,
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
    throw new functions.https.HttpsError('invalid-argument', 'Missing required purchase data.');
  }

  // Check if it's a superlike purchase first
  if (superLikePackages[productId]) {
      return verifySuperLikePurchase({ purchaseToken, productId, packageName }, context);
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
    // We always use the main product ID for verification, as the base plans are under it.
    const response = await publisher.purchases.subscriptions.get({
      packageName: packageName,
      subscriptionId: GOOGLE_PLAY_PRODUCT_ID,
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

    // Determine the premium tier based on the purchased base plan ID
    const premiumTier = planIdToTierMap[productId];
    if (!premiumTier) {
        // This should not happen if the client sends the correct productId
        throw new functions.https.HttpsError('invalid-argument', 'Invalid productId provided.');
    }

    // --- Update Firestore ---
    await userRef.update({
      isPremium: true,
      subscriptionId: GOOGLE_PLAY_PRODUCT_ID,
      purchaseToken: purchaseToken,
      expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
      autoRenewing: autoRenewing ?? false,
      premiumTier: premiumTier, // Store 'weekly', 'gold', or 'platinum'
      premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiryDate), // For consistency
    });

    console.log(`Successfully verified and updated subscription for user ${uid}. Tier: ${premiumTier}`);
    return { success: true, message: 'Purchase verified successfully.' };

  } catch (error: any) {
    console.error(`Error verifying purchase for user ${uid}:`, error);
    
    let errorMessage = 'An internal error occurred during purchase verification.';
    if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
    } else if (error instanceof functions.https.HttpsError) {
        errorMessage = error.message;
    }

    return { success: false, message: errorMessage };
  }
});


/**
 * Verifies a one-time product (Super Likes) purchase from Google Play.
 */
const verifySuperLikePurchase = functions.region('europe-west1').https.onCall(async (data, context) => {
    const { purchaseToken, productId, packageName } = data;
    const uid = context.auth?.uid;

    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    if (!purchaseToken || !productId || !packageName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required purchase data for Super Likes.');
    }

    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });
        const authClient = await auth.getClient();
        const publisher = google.androidpublisher({
            version: 'v3',
            auth: authClient,
        });

        // --- Verify with Google Play Developer API for one-time products ---
        const response = await publisher.purchases.products.get({
            packageName: packageName,
            productId: productId,
            token: purchaseToken,
        });

        const purchase = response.data;
        if (response.status !== 200 || !purchase || purchase.purchaseState !== 1) { // 1 = Purchased
             throw new functions.https.HttpsError('internal', 'Failed to verify one-time purchase with Google Play.');
        }

        // --- Consume the purchase to allow it to be bought again ---
        await publisher.purchases.products.consume({
            packageName,
            productId,
            token: purchaseToken
        });


        const amountToAdd = superLikePackages[productId];
        if (!amountToAdd) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid Super Like product ID.');
        }

        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            superLikes: admin.firestore.FieldValue.increment(amountToAdd)
        });

        console.log(`Successfully added ${amountToAdd} Super Likes to user ${uid}.`);
        return { success: true, message: `${amountToAdd} Super Likes added successfully.` };

    } catch (error: any) {
        console.error(`Error verifying Super Like purchase for user ${uid}:`, error);
        let errorMessage = 'An internal error occurred during Super Like purchase verification.';
        if (error.response?.data?.error?.message) {
            errorMessage = error.response.data.error.message;
        } else if (error instanceof functions.https.HttpsError) {
            errorMessage = error.message;
        }
        return { success: false, message: errorMessage };
    }
});
