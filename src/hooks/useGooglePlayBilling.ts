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

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Initialize the Digital Goods Service
  useEffect(() => {
    // If in development, we don't need the real API. We'll simulate it.
    if (isDevelopment) {
        setState('READY');
        return;
    }
    
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
  }, [isDevelopment]);

  const getProductDetails = useCallback(async (productId: string) => {
    if (isDevelopment) return null; // No need to fetch details in dev
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
  }, [billingService, isDevelopment]);

  const purchase = useCallback(async (productId: string) => {
    setState('PURCHASING');
    setError(null);

    let purchaseToken = `dev_token_${Date.now()}`; // Default fake token for development

    // --- REAL PURCHASE FLOW (Production) ---
    if (!isDevelopment) {
      if (!billingService) {
        setError({ code: 'NOT_SUPPORTED', message: 'Billing service is not available.' });
        setState('ERROR');
        return;
      }
      try {
        await (billingService as any).purchase({ itemIds: [productId] });
        const purchases = await billingService.listPurchases();
        const newPurchase = purchases[purchases.length - 1];
        if (!newPurchase) {
          throw new Error('Purchase completed, but could not find purchase token.');
        }
        purchaseToken = newPurchase.purchaseToken;
      } catch (err: any) {
         console.error('Purchase flow failed:', err);
        if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
            setError({ code: 'USER_CANCELLED', message: 'Purchase was cancelled by the user.' });
        } else {
            setError({ code: 'PAYMENT_FAILED', message: `Purchase failed: ${err.message}` });
        }
        setState('ERROR');
        return { success: false };
      }
    }

    // --- VERIFICATION FLOW (Both Dev and Prod) ---
    try {
      const functions = getFunctions(firebaseApp);
      const verifySubscription = httpsCallable(functions, 'verifySubscription');
      
      const verificationResult = await verifySubscription({
        purchaseToken,
        productId,
        packageName: 'app.be.match',
        isDevelopment: isDevelopment, // Pass the environment flag to the backend
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

  }, [billingService, firebaseApp, isDevelopment]);

  return {
    state,
    error,
    getProductDetails,
    purchase,
    itemDetails,
    isReady: state === 'READY',
  };
}
