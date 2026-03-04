import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'

/**
 * Request necessary permissions after a short delay to ensure
 * Capacitor bridge is fully initialized.
 * Only runs on native platforms (Android/iOS).
 */
export function requestAllPermissions() {
    if (!Capacitor.isNativePlatform()) return

    // Delay to ensure Capacitor bridge is fully ready
    setTimeout(async () => {
        // Camera permission
        try {
            const cameraStatus = await Camera.checkPermissions()
            if (cameraStatus.camera !== 'granted') {
                await Camera.requestPermissions({ permissions: ['camera'] })
            }
        } catch (e) {
            console.warn('Camera permission error:', e)
        }

        // Location permission
        try {
            const locationStatus = await Geolocation.checkPermissions()
            if (locationStatus.location !== 'granted') {
                await Geolocation.requestPermissions({ permissions: ['location'] })
            }
        } catch (e) {
            console.warn('Location permission error:', e)
        }

        console.log('Permissions requested')
    }, 1500)
}
