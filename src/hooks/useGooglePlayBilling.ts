'use client';
import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

// Digital Goods API arayüzleri
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

// Hook'un durumlarını tanımlayan tip
type BillingState = 'LOADING' | 'READY' | 'PURCHASING' | 'ERROR';

interface UseGooglePlayBillingOptions {
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
}

export function useGooglePlayBilling(options?: UseGooglePlayBillingOptions) {
  const { firebaseApp, user } = useFirebase();
  const [state, setState] = useState<BillingState>('LOADING');
  const [error, setError] = useState<string | null>(null);

  // 1. Digital Goods API'yi başlatan ve durumu güncelleyen useEffect
  useEffect(() => {
    let isMounted = true;

    async function initializeService() {
      // Başlangıçta state'i LOADING yap
      if(isMounted) setState('LOADING');

      if (typeof window !== 'undefined' && 'getDigitalGoodsService' in window) {
        try {
          const service = await window.getDigitalGoodsService('https://play.google.com/billing');
          if (service && isMounted) {
            console.log('Digital Goods API Service is ready. 🔥');
            setState('READY'); // Servis hazır olduğunda durumu READY yap
          } else {
             if (isMounted) {
                console.warn('Digital Goods API service is not available.');
                setError('Ödeme servisi mevcut değil.');
                setState('ERROR');
             }
          }
        } catch (e: any) {
           if(isMounted) {
              console.error('Failed to initialize Digital Goods API:', e);
              setError('Ödeme servisi başlatılamadı.');
              setState('ERROR');
           }
        }
      } else {
         if (isMounted) {
            console.warn('Digital Goods API not supported in this browser.');
            setError('Bu tarayıcıda ödeme desteklenmiyor.');
            setState('ERROR');
         }
      }
    }
    
    initializeService();

    return () => { isMounted = false; };
  }, []);

  // 2. Satın alma fonksiyonu
  const purchase = useCallback(async (productId: string, packageName: string) => {
    // Sadece state 'READY' ise devam et
    if (state !== 'READY') {
      const msg = 'Ödeme servisi hazır değil.';
      console.warn(msg);
      options?.onPurchaseError?.(msg);
      return;
    }

    if (!user) {
      const msg = 'Satın alma için kullanıcı girişi yapılmalıdır.';
      console.warn(msg);
      options?.onPurchaseError?.(msg);
      return;
    }

    setState('PURCHASING'); // Satın alma başladığında durumu güncelle
    setError(null);

    try {
      const paymentMethod = 'https://play.google.com/billing';
      // @ts-ignore - PaymentRequest bazen TS hatası verebilir
      const paymentUi = new PaymentRequest(
        [{ supportedMethods: paymentMethod, data: { sku: productId } }]
      );
      
      const paymentResponse = await paymentUi.show();
      const { purchaseToken } = paymentResponse.details;
      
      if (!purchaseToken) {
          throw new Error("Google Play'den geçerli bir satın alma fişi alınamadı.");
      }
      
      const functions = getFunctions(firebaseApp, 'europe-west1');
      const verifyFn = httpsCallable(functions, 'verifyPurchase');
      
      const result = await verifyFn({
        purchaseToken,
        productId,
        packageName
      });

      const data = result.data as any;

      if (data.success) {
        const service = await window.getDigitalGoodsService(paymentMethod);
        await service?.acknowledge(purchaseToken, 'repeatable');
        
        console.log('Satın alma başarılı ve doğrulandı. ✅');
        options?.onPurchaseSuccess?.();
        setState('READY'); // İşlem bitince durumu tekrar READY yap
      } else {
        throw new Error(data.message || 'Sunucu doğrulaması başarısız oldu.');
      }
    } catch (e: any) {
      console.error('Satın alma sırasında hata:', e);
      
      let errorMessage = e.message || 'Bilinmeyen bir hata oluştu.';
      if (e.name === 'AbortError') {
          errorMessage = 'İşlem kullanıcı tarafından iptal edildi.';
      }

      setError(errorMessage);
      options?.onPurchaseError?.(errorMessage);
      setState('READY'); // Hata durumunda da durumu READY yap
    }
  }, [state, user, firebaseApp, options]);

  return {
    state, // 'LOADING' | 'READY' | 'PURCHASING' | 'ERROR'
    error,
    purchase,
  };
}
