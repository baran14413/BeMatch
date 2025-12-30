'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Type definitions for the Digital Goods API
// Based on https://github.com/WICG/digital-goods/blob/main/explainer.md

interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>;
  listPurchases(): Promise<PurchaseDetails[]>;
  consume(purchaseToken: string): Promise<void>;
  acknowledge(
    purchaseToken: string,
    type?: 'purchase' | 'subscription'
  ): Promise<void>;
  // The purchase method is not officially in the spec but used by Chrome
  purchase(options: { itemIds: string[] }): Promise<void>;
}

interface ItemDetails {
  itemId: string;
  title: string;
  description: string;
  price: {
    currency: string;
    value: string;
  };
  type: 'subscription' | 'inapp';
}

interface PurchaseDetails {
  itemId: string;
  purchaseToken: string;
}

declare global {
  interface Window {
    getDigitalGoodsService: (
      serviceId: 'https://play.google.com/billing'
    ) => Promise<DigitalGoodsService | undefined>;
  }
}

type BillingState = 'INITIAL' | 'LOADING' | 'READY' | 'PURCHASING' | 'ERROR';
type BillingError = {
  code: 'NOT_SUPPORTED' | 'USER_CANCELLED' | 'PAYMENT_FAILED' | 'VERIFICATION_FAILED' | 'UNKNOWN';
  message: string;
}

interface PurchaseOptions {
    productId: string;
    packageName: string;
    isDevelopment?: boolean;
}

export function useGooglePlayBilling() {
  const { firebaseApp, user } = useFirebase();
  const [billingService, setBillingService] = useState<DigitalGoodsService | null>(null);
  const [state, setState] = useState<BillingState>('INITIAL');
  const [error, setError] = useState<BillingError | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);

  // Initialize the Digital Goods Service
  useEffect(() => {
    setState('LOADING');
    if (window.getDigitalGoodsService) {
      window.getDigitalGoodsService('https://play.google.com/billing')
        .then(service => {
          if (service) {
            setBillingService(service);
            setState('READY');
          } else {
            setError({ code: 'NOT_SUPPORTED', message: 'Digital Goods API is not supported in this context (e.g. not in a TWA).' });
            setState('ERROR');
          }
        })
        .catch(err => {
          console.error('Error initializing Digital Goods Service:', err);
          setError({ code: 'UNKNOWN', message: 'Failed to initialize billing service.' });
          setState('ERROR');
        });
    } else {
      setError({ code: 'NOT_SUPPORTED', message: 'Digital Goods API not available on this device.' });
      setState('ERROR');
    }
  }, []);

  const getProductDetails = useCallback(async (productId: string) => {
    if (!billingService) {
      console.warn('Billing service not ready.');
      return null;
    }
    try {
      const details = await billingService.getDetails([productId]);
      if (details && details.length > 0) {
        setItemDetails(details[0]);
        return details[0];
      }
      return null;
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError({ code: 'UNKNOWN', message: 'Could not fetch product details.' });
      setState('ERROR');
      return null;
    }
  }, [billingService]);

  const purchase = useCallback(async ({ productId, packageName, isDevelopment = false }: PurchaseOptions) => {
    setState('PURCHASING');
    setError(null);

    // --- DEVELOPMENT ONLY ---
    // This block simulates a successful purchase for local development.
    if (isDevelopment) {
        if (!user) {
            setError({ code: 'UNKNOWN', message: 'User must be logged in for development purchase simulation.' });
            setState('ERROR');
            return { success: false };
        }
        console.warn("DEV MODE: Simulating purchase flow.");
        try {
            const functions = getFunctions(firebaseApp);
            const verifySubscription = httpsCallable(functions, 'verifySubscription');
            const verificationResult = await verifySubscription({
                isDevelopment: true,
                productId: productId,
            });
            const data = verificationResult.data as { success: boolean; message?: string };
            if (!data.success) throw new Error(data.message);
            setState('READY');
            return { success: true };
        } catch (err: any) {
            setError({ code: 'VERIFICATION_FAILED', message: `DEV: Verification failed: ${err.message}` });
            setState('ERROR');
            return { success: false };
        }
    }
    // --- END DEVELOPMENT ONLY ---

    if (!billingService) {
      setError({ code: 'NOT_SUPPORTED', message: 'Billing service is not available.' });
      setState('ERROR');
      return { success: false };
    }

    let purchaseToken: string;

    try {
      // The 'purchase' method is an extension used by Chrome for PWAs.
      await (billingService as any).purchase({ itemIds: [productId] });
      // After purchase, we need to get the purchase token to verify on the backend.
      const purchases = await billingService.listPurchases();
      const newPurchase = purchases[purchases.length - 1]; // Assuming the latest one is the new one
      if (!newPurchase) {
        throw new Error('Purchase completed, but could not find purchase token.');
      }
      purchaseToken = newPurchase.purchaseToken;
    } catch (err: any) {
      console.error('Purchase flow failed:', err);
      // 'AbortError' is a standard DOMException name for user cancellations.
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
          setError({ code: 'USER_CANCELLED', message: 'Purchase was cancelled by the user.' });
      } else {
          setError({ code: 'PAYMENT_FAILED', message: `Purchase failed: ${err.message}` });
      }
      setState('ERROR');
      return { success: false };
    }

    // --- VERIFICATION FLOW ---
    try {
      const functions = getFunctions(firebaseApp);
      const verifySubscription = httpsCallable(functions, 'verifySubscription');
      
      const verificationResult = await verifySubscription({
        purchaseToken,
        productId,
        packageName,
      });
      
      const data = verificationResult.data as { success: boolean; message?: string };
      
      if (!data.success) {
        throw new Error(data.message || 'Backend verification failed.');
      }
      
      setState('READY');
      return { success: true };

    } catch (err: any) {
       console.error('Verification flow failed:', err);
       setError({ code: 'VERIFICATION_FAILED', message: `Verification failed: ${err.message}` });
       setState('ERROR');
       return { success: false };
    }
  }, [billingService, firebaseApp, user]);

  return {
    state,
    error,
    getProductDetails,
    purchase,
    itemDetails,
    isReady: state === 'READY',
  };
}
