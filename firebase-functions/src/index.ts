

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
const planToSubscriptionIdMap: { [key: string]: string } = {
    'weekly-base': 'premium_uyelik_1ay',
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

    // --- DEVELOPMENT ONLY ---
    // This block allows testing purchases in non-TWA environments
    if (request.data.isDevelopment) {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Dev mode requires auth.");
      }
      const { uid } = request.auth;
      const { productId } = request.data;
      
      let premiumTier: "weekly" | "gold" | "platinum" | null = null;
      if (productId.includes("yearly")) premiumTier = "platinum";
      else if (productId.includes("monthly")) premiumTier = "gold";
      else if (productId.includes("weekly")) premiumTier = "weekly";
      
      const userRef = db.collection("users").doc(uid);
      await userRef.update({
        isPremium: true,
        subscriptionId: productId,
        premiumExpiresAt: Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        autoRenewing: true,
        premiumTier: premiumTier,
      });
      logger.info(`DEV: User ${uid} granted ${premiumTier} status.`);
      return { success: true, message: "Development purchase successful."};
    }
    // --- END DEVELOPMENT ONLY ---

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
      const subscriptionProductId = planToSubscriptionIdMap[productId];
       if (!subscriptionProductId) {
            throw new HttpsError('invalid-argument', `Invalid productId: ${productId}. No matching subscription ID found.`);
       }


      const response =
        await androidpublisher.purchases.subscriptions.get({
          packageName: packageName, // Correct package name
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
          packageName: packageName, // Correct package name
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
      subscriptionId: string
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
          packageName: "com.bematch.bematch", // Correct package name
          subscriptionId: subscriptionProductId,
          token: user.purchaseToken,
        });

      const subscription: SubscriptionPurchase = response.data;
      const googleExpiry =
        Timestamp.fromMillis(parseInt(subscription.expiryTimeMillis, 10));

      if (googleExpiry > now) {
        logger.info(`Subscription for ${doc.id} renewed. Updating expiry.`);
        return doc.ref.update({premiumExpiresAt: googleExpiry, autoRenewing: subscription.autoRenewing});
      }
    } catch (error: any) {
      logger.warn(`Could not re-verify token for ${doc.id}. Proceeding ` +
        "with downgrade.", {error: error.message});
    }

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


/**
 * Triggers a push notification when a new message is created in a chat.
 */
export const onMessageCreate = onDocumentCreated("matches/{matchId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const messageData = snapshot.data() as { senderId: string; text: string; };
    const matchId = event.params.matchId;

    try {
        // Get the match document to find the participants
        const matchDoc = await db.collection("matches").doc(matchId).get();
        if (!matchDoc.exists) {
            logger.log("Match document not found.");
            return;
        }

        const matchData = matchDoc.data() as { users: string[]; };
        const senderId = messageData.senderId;

        // Find the recipient's ID
        const recipientId = matchData.users.find(uid => uid !== senderId);
        if (!recipientId) {
            logger.log("Recipient not found.");
            return;
        }

        // Get sender's and recipient's profile
        const senderDoc = await db.collection("users").doc(senderId).get();
        const recipientDoc = await db.collection("users").doc(recipientId).get();

        if (!recipientDoc.exists || !senderDoc.exists) {
            logger.log("Sender or recipient document not found.");
            return;
        }

        const recipientData = recipientDoc.data() as { fcmTokens?: string[]; };
        const senderData = senderDoc.data() as { name: string; avatarUrl: string; };
        
        const tokens = recipientData.fcmTokens;
        if (!tokens || tokens.length === 0) {
            logger.log("No FCM tokens for recipient.");
            return;
        }

        // Construct the notification payload
        const payload = {
            notification: {
                title: `${senderData.name} sana bir mesaj gönderdi`,
                body: messageData.text,
                icon: senderData.avatarUrl || '/icons/icon-192x192.png',
                click_action: `https://bematch-f168d.web.app/chat/${matchId}`
            },
            tokens: tokens,
        };

        // Send the notification
        const response = await admin.messaging().sendEachForMulticast(payload);
        logger.log("Successfully sent message:", response);
        
        // Clean up invalid tokens
        const tokensToRemove: Promise<any>[] = [];
        response.responses.forEach((result, index) => {
            const error = result.error;
            if (error) {
                logger.error("Failure sending notification to", tokens[index], error);
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(db.collection("users").doc(recipientId).update({
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(tokens[index])
                    }));
                }
            }
        });
        return Promise.all(tokensToRemove);

    } catch (error) {
        logger.error("Error in onMessageCreate:", error);
        return;
    }
});
