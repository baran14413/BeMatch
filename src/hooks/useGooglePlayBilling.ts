
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

export function useGooglePlayBilling() {
  const { firebaseApp } = useFirebase();
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
            setError({ code: 'NOT_SUPPORTED', message: 'Digital Goods API is not supported in this context.' });
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

  const purchase = useCallback(async (productId: string) => {
    if (!billingService) {
      setError({ code: 'NOT_SUPPORTED', message: 'Billing service is not available.' });
      setState('ERROR');
      return;
    }
    
    setState('PURCHASING');
    setError(null);

    try {
      // 1. Initiate the purchase flow via Digital Goods API
      // The Digital Goods API's purchase method is not standard, we cast to any to use it.
      // The `productId` here should correspond to the Base Plan ID in Google Play.
      await (billingService as any).purchase({ itemIds: [productId] });
      
      // 2. After a successful client-side purchase, list purchases to get the token
      const purchases = await billingService.listPurchases();
      // Find the purchase that corresponds to the product family, not the specific plan ID.
      // This is a simplification; a real app might need more logic if multiple products are sold.
      const newPurchase = purchases[purchases.length - 1];

      if (!newPurchase) {
        throw new Error('Purchase completed, but could not find purchase token.');
      }
      
      const { purchaseToken } = newPurchase;

      // 3. Call backend function for verification and fulfillment
      const functions = getFunctions(firebaseApp);
      const verifySubscription = httpsCallable(functions, 'verifySubscription');
      
      // The backend function needs the base plan ID to know which subscription was bought.
      const verificationResult = await verifySubscription({
        purchaseToken,
        productId, // Send the specific plan ID to the backend.
        packageName: 'app.be.match',
      });
      
      const data = verificationResult.data as { success: boolean; message?: string };
      
      if (!data.success) {
        throw new Error(data.message || 'Backend verification failed.');
      }
      
      // Backend verification is successful. The user's premium status is updated in Firestore.
      // The UI will update automatically via Firestore listeners.
      setState('READY');
      return { success: true };

    } catch (err: any) {
      console.error('Purchase flow failed:', err);
      // Differentiate between user cancelling and other errors
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        setError({ code: 'USER_CANCELLED', message: 'Purchase was cancelled by the user.' });
      } else {
        setError({ code: 'PAYMENT_FAILED', message: `Purchase failed: ${err.message}` });
      }
      setState('ERROR');
      return { success: false };
    }

  }, [billingService, firebaseApp]);

  return {
    state,
    error,
    getProductDetails,
    purchase,
    itemDetails,
    isReady: state === 'READY',
  };
}
