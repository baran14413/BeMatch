import { Capacitor, registerPlugin } from '@capacitor/core'

interface PlayBillingPlugin {
    purchase(options: { productId: string; basePlanId?: string }): Promise<{ success: boolean; purchaseToken?: string; error?: string }>
}

const PlayBilling = registerPlugin<PlayBillingPlugin>('PlayBilling')

/**
 * Initiate a purchase through Google Play Billing.
 * @param productId - The subscription product ID (e.g. bematch_gold_sub)
 * @param basePlanId - The base plan ID (e.g. gold-monthly, gold-weekly, gold-yearly)
 */
export async function purchaseProduct(productId: string, basePlanId?: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        alert(`Play Store ödeme sistemi sadece Android uygulamasında çalışır.`)
        return false
    }

    try {
        const result = await PlayBilling.purchase({ productId, basePlanId })
        if (result.success) {
            console.log('Purchase successful:', result.purchaseToken)
            return true
        } else {
            console.warn('Purchase failed:', result.error)
            alert(result.error || 'Satın alma başarısız oldu.')
            return false
        }
    } catch (error: any) {
        console.error('Billing error:', error)
        alert('Ödeme işlemi sırasında bir hata oluştu.')
        return false
    }
}
