
import {onCall, HttpsError} from "firebase-functions/v2/ons";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";


// Initialize Firebase Admin SDK
admin.initializeApp();
const db = getFirestore();

// --- TYPES ---
interface VerifySubscriptionParams {
  purchaseToken: string;
  productId: string; // This will be the Base Plan ID, e.g., 'monthly-base'
  packageName: string;
}

// Google Play API SubscriptionPurchase type (simplified)
interface SubscriptionPurchase {
  kind: "androidpublisher#subscriptionPurchase";
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number; // 1: Payment received, 2: Free trial, 3: Pending
  orderId: string;
  purchaseType: number; // 0: Test, 1: Promo, 2: Rewarded
  acknowledgementState: number; // 0: Yet to be acknowledged, 1: Acknowledged
  // This field contains the base plan ID.
  lineItems: {
    productId: string;
    // ... other line item properties
  }[];
}

// Map Base Plan IDs to Subscription Product IDs
// IMPORTANT: This must match your Google Play Console setup
const planToSubscriptionIdMap: { [key: string]: string } = {
    'weekly-base': 'premium_uyelik_1ay', // Assuming weekly plan is under the same subscription product
    'monthly-base': 'premium_uyelik_1ay',
    'yearly-base': 'premium_uyelik_1ay',
};


// Setup Google Play API client
const auth = new google.auth.GoogleAuth({
  // Scopes required to access the Google Play Developer API
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const androidpublisher = google.androidpublisher({
  version: "v3",
  auth: auth,
});


/**
 * Verifies a Google Play subscription and updates the user's status
 * in Firestore.
 */
export const verifySubscription = onCall(
  {
    // Enable App Check in production
    enforceAppCheck: process.env.NODE_ENV === "production",
  },
  async (request) => {
    logger.info("Verifying subscription...", {structuredData: true});

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }
    const {uid} = request.auth;
    const {
      purchaseToken,
      productId, // This is the Base Plan ID from the client
      packageName,
    } = request.data as VerifySubscriptionParams;

    if (!purchaseToken || !productId || !packageName) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required parameters (purchaseToken, productId, packageName).",
      );
    }

    try {
      // In production, always verify with Google Play
      const subscriptionProductId = planToSubscriptionIdMap[productId];
       if (!subscriptionProductId) {
            throw new HttpsError('invalid-argument', `Invalid productId: ${productId}. No matching subscription ID found.`);
       }


      const response =
        await androidpublisher.purchases.subscriptions.get({
          packageName: packageName,
          subscriptionId: subscriptionProductId,
          token: purchaseToken,
        });

      const subscription: SubscriptionPurchase = response.data;
      logger.info("Google Play API Response:", subscription);

      if (
        response.status !== 200 ||
        (subscription.paymentState !== 1 && subscription.paymentState !== 2)
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Purchase is not valid or payment has not been received.",
        );
      }

      if (subscription.acknowledgementState !== 1) {
        await androidpublisher.purchases.subscriptions.acknowledge({
          packageName: packageName,
          subscriptionId: subscriptionProductId,
          token: purchaseToken,
        });
        logger.info(`Subscription ${subscriptionProductId} acknowledged.`);
      }

      const expiryTimeMillis = subscription.expiryTimeMillis;
      const autoRenewing = subscription.autoRenewing;

      let premiumTier: "weekly" | "gold" | "platinum" | null = null;
      if (productId.includes("yearly")) {
        premiumTier = "platinum";
      } else if (productId.includes("monthly")) {
        premiumTier = "gold";
      } else if (productId.includes("weekly")) {
        premiumTier = "weekly";
      }

      const userRef = db.collection("users").doc(uid);
      const expiryDate =
        Timestamp.fromMillis(parseInt(expiryTimeMillis, 10));

      await userRef.update({
        isPremium: true,
        subscriptionId: productId,
        purchaseToken: purchaseToken,
        premiumExpiresAt: expiryDate,
        autoRenewing: autoRenewing,
        premiumTier: premiumTier,
      });

      logger.info(`User ${uid} successfully granted ${premiumTier} status.`);
      return {success: true};
    } catch (error: any) {
      logger.error("Error verifying subscription:", error);
      let message = "An unknown error occurred during verification.";
      if (error.code === 404) {
        message = "Purchase token not found or already consumed.";
      } else if (error.code === 410) {
        message = "Subscription is expired or has been canceled.";
      }
      throw new HttpsError("internal", message, error);
    }
  },
);

/**
 * A scheduled function to check the status of all active subscriptions
 * and downgrade users whose subscriptions have expired or been cancelled.
 * This function runs automatically every 24 hours.
 */
export const checkSubscriptionStatuses = onSchedule("every 24 hours", async (event) => {
  logger.info("Running scheduled job to check subscription statuses.");
  const now = Timestamp.now();

  // Find all users who are marked as premium and have an expiry date in the past
  const expiredQuery = db
    .collection("users")
    .where("isPremium", "==", true)
    .where("premiumExpiresAt", "<=", now);

  const snapshot = await expiredQuery.get();

  if (snapshot.empty) {
    logger.info("No expired subscriptions to process.");
    return {success: true, message: "No expired subscriptions found."};
  }

  const promises = snapshot.docs.map(async (doc) => {
    const user = doc.data() as {
      purchaseToken: string,
      subscriptionId: string // This is the Base Plan ID, e.g. 'monthly-base'
    };
    logger.info(`Processing expired subscription for user ${doc.id}`);

    try {
        const subscriptionProductId = planToSubscriptionIdMap[user.subscriptionId];
        if (!subscriptionProductId || !user.purchaseToken) {
             logger.warn(`User ${doc.id} has invalid subscription data. Downgrading.`, { subId: user.subscriptionId });
             return doc.ref.update({ isPremium: false, premiumTier: null, autoRenewing: false });
        }
      
      const response =
        await androidpublisher.purchases.subscriptions.get({
          packageName: "app.be.match", // Replace with your package name
          subscriptionId: subscriptionProductId,
          token: user.purchaseToken,
        });

      const subscription: SubscriptionPurchase = response.data;
      const googleExpiry =
        Timestamp.fromMillis(parseInt(subscription.expiryTimeMillis, 10));

      // If Google says it's still active, update our DB and skip downgrade
      if (googleExpiry > now) {
        logger.info(`Subscription for ${doc.id} renewed. Updating expiry.`);
        return doc.ref.update({premiumExpiresAt: googleExpiry, autoRenewing: subscription.autoRenewing});
      }
    } catch (error: any) {
      // If the token is invalid (404/410), it confirms the subscription is dead.
      logger.warn(`Could not re-verify token for ${doc.id}. Proceeding ` +
        "with downgrade.", {error: error.message});
    }

    // Downgrade the user
    return doc.ref.update({
      isPremium: false,
      premiumTier: null,
      autoRenewing: false,
    });
  });

  await Promise.all(promises);

  logger.info(`Processed ${snapshot.size} expired subscriptions.`);
  return {success: true, message: `Processed ${snapshot.size} subscriptions.`};
});
