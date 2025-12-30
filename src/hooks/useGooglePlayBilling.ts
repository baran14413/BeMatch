
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

// Extend the Window interface to include the Digital Goods API service
declare global {
  interface Window {
    getDigitalGoodsService: (serviceId: string) => Promise<DigitalGoodsService | undefined>;
  }

  interface DigitalGoodsService {
    getDetails: (skus: string[]) => Promise<DigitalGoodsProductDetails[]>;
    listPurchases: () => Promise<DigitalGoodsPurchaseDetails[]>;
    consume: (purchaseToken: string) => Promise<void>;
    acknowledge: (purchaseToken: string, type?: 'onetime' | 'repeatable') => Promise<void>;
  }

  interface DigitalGoodsProductDetails {
    itemId: string;
    title: string;
    description: string;
    price: {
      currency: string;
      value: string;
    };
    // Other properties...
  }

  interface DigitalGoodsPurchaseDetails {
    itemId: string;
    purchaseToken: string;
    // Other properties...
  }
}

interface UseGooglePlayBillingOptions {
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
}

export function useGooglePlayBilling({ onPurchaseSuccess, onPurchaseError }: UseGooglePlayBillingOptions) {
  const { firebaseApp, user } = useFirebase();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  // Initialize Digital Goods Service
  useEffect(() => {
    async function initializeService() {
      if ('getDigitalGoodsService' in window) {
        try {
          const service = await window.getDigitalGoodsService('https://play.google.com/billing');
          if (service) {
            setIsReady(true);
            console.log('Digital Goods API Service is ready.');
          } else {
             const errMsg = 'Digital Goods API service is not available.';
             setError(errMsg);
             console.error(errMsg);
          }
        } catch (e: any) {
          setError(e.message);
          console.error('Failed to initialize Digital Goods API:', e);
        } finally {
            setIsLoading(false); // Stop loading after initialization attempt
        }
      } else {
        const errMsg = 'Digital Goods API not supported in this browser.';
        console.warn(errMsg);
        setError(errMsg);
        setIsLoading(false); // Stop loading if not supported
      }
    }
    initializeService();
  }, []);

  const purchase = useCallback(async (productId: string, packageName: string) => {
    if (!isReady) {
      const errorMsg = 'Google Play Billing service is not ready.';
      console.error(errorMsg);
      onPurchaseError?.(errorMsg);
      return;
    }

    if (!user) {
      const errorMsg = 'User is not authenticated.';
      console.error(errorMsg);
      onPurchaseError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const paymentMethod = 'https://play.google.com/billing';
        const paymentInstruments = [{
            supportedMethods: paymentMethod,
            data: { sku: productId },
        }];

        const paymentUi = new (window as any).PaymentRequest(paymentInstruments);
        const paymentResponse = await paymentUi.show();
        
        const { purchaseToken } = paymentResponse.details;
        
        // After getting the token, call the verification function on the server.
        const functions = getFunctions(firebaseApp, 'europe-west1');
        const verifyPurchase = httpsCallable(functions, 'verifyPurchase');
        
        const result = await verifyPurchase({
            purchaseToken,
            productId,
            packageName
        });

        if ((result.data as any).success) {
            // Acknowledge the purchase on the client side
            const service = await window.getDigitalGoodsService('https://play.google.com/billing');
            await service?.acknowledge(purchaseToken, 'repeatable');
            
            console.log('Purchase successful and verified.');
            onPurchaseSuccess?.();
        } else {
            throw new Error((result.data as any).message || 'Verification failed on server.');
        }

    } catch (e: any) {
      console.error('An error occurred during the purchase flow:', e);
      let errorMessage = e.message || 'An unknown error occurred.';
      if (e.name === 'AbortError') {
          errorMessage = 'Payment was cancelled by the user.';
      }
      setError(errorMessage);
      onPurchaseError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, user, firebaseApp, onPurchaseSuccess, onPurchaseError]);

  return {
    isReady,
    isLoading,
    error,
    purchase,
  };
}
