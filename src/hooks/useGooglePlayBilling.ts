import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase'; // Firebase context yolun doğruysa burası kalsın

// Paket ismini buraya sabitliyoruz (Senin verdiğin bilgiye göre)
const PACKAGE_NAME = "com.bematch.bematch";

// Window interface genişletmesi
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

interface UseGooglePlayBillingOptions {
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
}

// UI tarafında beklenen dönüş tipi
interface PurchaseResult {
    success: boolean;
    message?: string;
}

export function useGooglePlayBilling(options?: UseGooglePlayBillingOptions) {
  const { firebaseApp, user } = useFirebase();
  const [isReady, setIsReady] = useState(false);
  // Başlangıçta 'LOADING' durumu.
  // Component'deki "isLoading" buna bakarak butonları kilitliyor.
  const [state, setState] = useState<'IDLE' | 'LOADING' | 'PURCHASING'>('LOADING'); 
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  // 1. Digital Goods API Hazır mı Kontrolü
  useEffect(() => {
    let isMounted = true;

    async function initializeService() {
      if (typeof window !== 'undefined' && 'getDigitalGoodsService' in window) {
        try {
          const service = await window.getDigitalGoodsService('https://play.google.com/billing');
          if (service && isMounted) {
            setIsReady(true);
            console.log('Digital Goods API Service is ready. 🔥');
          } else {
            console.warn('Digital Goods API service is not available.');
          }
        } catch (e: any) {
          console.error('Failed to initialize Digital Goods API:', e);
        } finally {
          // KRİTİK NOKTA: Başarılı olsa da olmasa da loading'i kapat.
          if (isMounted) setState('IDLE');
        }
      } else {
        console.warn('Digital Goods API not supported in this browser.');
        if (isMounted) setState('IDLE');
      }
    }
    initializeService();

    return () => { isMounted = false; };
  }, []);

  // 2. Satın Alma Fonksiyonu
  const purchase = useCallback(async (productId: string): Promise<PurchaseResult> => {
    if (!isReady) {
      const msg = 'Ödeme servisi (Digital Goods) hazır değil.';
      setError({ message: msg });
      return { success: false, message: msg };
    }

    if (!user) {
        const msg = 'Kullanıcı girişi yapılmamış.';
        setError({ message: msg });
        return { success: false, message: msg };
    }

    // Yükleniyor durumuna al
    setState('PURCHASING');
    setError(null);

    try {
        const paymentMethod = 'https://play.google.com/billing';
        const paymentInstruments = [{
            supportedMethods: paymentMethod,
            data: { sku: productId },
        }];

        // @ts-ignore - PaymentRequest bazen TS hatası verebilir
        const paymentUi = new PaymentRequest(paymentInstruments);
        
        // 1. Google Play penceresini aç
        const paymentResponse = await paymentUi.show();
        const { purchaseToken } = paymentResponse.details;
        
        // 2. Backend Doğrulaması (Verify)
        // DİKKAT: Fonksiyon ismini 'verifySubscription' olarak düzelttik.
        const functions = getFunctions(firebaseApp, 'europe-west1'); // Senin bölgen neyse o kalmalı
        const verifyFn = httpsCallable(functions, 'verifySubscription');
        
        const result = await verifyFn({
            purchaseToken,
            productId,
            packageName: PACKAGE_NAME // Sabit paket ismi
        });

        const data = result.data as any;

        if (data.success) {
            // 3. Client tarafında onayla (Acknowledge)
            // Bu, kullanıcının "Tekrar satın al" diyebilmesi için bazen gereklidir
            try {
                const service = await window.getDigitalGoodsService(paymentMethod);
                await service?.acknowledge(purchaseToken, 'repeatable');
            } catch (ackError) {
                console.warn("Acknowledge warning:", ackError);
                // Acknowledge hatası satın almayı iptal etmemeli, backend zaten onayladı.
            }

            console.log('Satın alma başarılı ve doğrulandı. ✅');
            options?.onPurchaseSuccess?.();
            
            // Başarılı olduğunda IDLE'a çek
            setState('IDLE'); 
            return { success: true };
        } else {
            throw new Error(data.message || 'Sunucu doğrulaması başarısız.');
        }

    } catch (e: any) {
      console.error('Satın alma sırasında hata:', e);
      
      let errorMessage = e.message || 'Bilinmeyen bir hata oluştu.';
      let errorCode = 'UNKNOWN';

      if (e.name === 'AbortError') {
          errorMessage = 'İşlem kullanıcı tarafından iptal edildi.';
          errorCode = 'USER_CANCELLED';
      }

      setError({ code: errorCode, message: errorMessage });
      options?.onPurchaseError?.(errorMessage);

      // Hata durumunda IDLE'a çek
      setState('IDLE');
      return { success: false, message: errorMessage };
    }
  }, [isReady, user, firebaseApp, options]);

  return {
    isReady,
    // Component'in isLoading kontrolü için 'state'i kontrol ediyoruz
    state, // 'IDLE' | 'LOADING' | 'PURCHASING'
    error,
    purchase,
  };
}
//amk google play ödemesi seni