'use client';
import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

// Digital Goods API interfaces
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
  }

  interface DigitalGoodsPurchaseDetails {
    itemId: string;
    purchaseToken: string;
  }
}

// Hook's state type
type BillingState = 'IDLE' | 'PURCHASING' | 'ERROR';

interface UseGooglePlayBillingOptions {
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
}

export function useGooglePlayBilling(options?: UseGooglePlayBillingOptions) {
  const { firebaseApp, user } = useFirebase();
  const [state, setState] = useState<BillingState>('IDLE');
  const [error, setError] = useState<string | null>(null);

  // The purchase function is now the single point of entry and initializes everything on demand.
  const purchase = useCallback(async (productId: string, packageName: string) => {
    // 1. Basic checks before starting
    if (typeof window === 'undefined' || !('getDigitalGoodsService' in window)) {
      const msg = 'Bu tarayıcıda ödeme desteklenmiyor.';
      console.warn(msg);
      options?.onPurchaseError?.(msg);
      setError(msg);
      setState('ERROR');
      return;
    }

    if (!user) {
      const msg = 'Satın alma için kullanıcı girişi yapılmalıdır.';
      console.warn(msg);
      options?.onPurchaseError?.(msg);
      setError(msg);
      setState('IDLE');
      return;
    }

    setState('PURCHASING');
    setError(null);

    try {
      // 2. Get the service AT THE TIME OF PURCHASE
      const service = await window.getDigitalGoodsService('https://play.google.com/billing');
      if (!service) {
        throw new Error('Ödeme servisi mevcut değil. Lütfen Play Store hesabınızla giriş yaptığınızdan emin olun.');
      }

      // 3. Create and show the payment UI
      const paymentMethod = 'https://play.google.com/billing';
      // @ts-ignore - PaymentRequest might give a TS error in some setups but is correct
      const paymentUi = new PaymentRequest(
        [{ supportedMethods: paymentMethod, data: { sku: productId } }]
      );
      
      const paymentResponse = await paymentUi.show();
      await paymentResponse.complete('success');
      
      const { purchaseToken } = paymentResponse.details;
      
      if (!purchaseToken) {
          throw new Error("Google Play'den geçerli bir satın alma fişi alınamadı.");
      }
      
      // 4. Verify the purchase with Firebase Functions
      const functions = getFunctions(firebaseApp, 'europe-west1');
      const verifyFn = httpsCallable(functions, 'verifyPurchase');
      
      const result = await verifyFn({
        purchaseToken,
        productId, // This is the base plan ID like 'monthly-base'
        packageName
      });

      const data = result.data as any;

      if (data.success) {
        console.log('Satın alma başarılı ve doğrulandı. ✅');
        options?.onPurchaseSuccess?.();
        setState('IDLE');
      } else {
        throw new Error(data.message || 'Sunucu doğrulaması başarısız oldu.');
      }
    } catch (e: any) {
      console.error('Satın alma sırasında hata:', e);
      
      let errorMessage = e.message || 'Bilinmeyen bir hata oluştu.';
      if (e.name === 'AbortError' || e.code === 8) { // DOMException code for user cancellation
          errorMessage = 'İşlem kullanıcı tarafından iptal edildi.';
      }

      setError(errorMessage);
      options?.onPurchaseError?.(errorMessage);
      setState('IDLE');
    }
  }, [user, firebaseApp, options]);

  return {
    state,
    error,
    purchase,
  };
}
