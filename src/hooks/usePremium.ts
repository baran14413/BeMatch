import { useAuth } from '../context/AuthContext'

export function usePremium() {
    const { userProfile } = useAuth()

    const isGold = userProfile?.subscription?.status === 'active'

    const canUseSuperLike = () => {
        if (isGold) return true
        // Logic for limited super likes for free users could go here
        return false
    }

    const canUseBoost = () => {
        return isGold
    }

    const canRewind = () => {
        return isGold
    }

    const canSeeWhoLikedYou = () => {
        return isGold
    }

    return {
        isGold,
        subscription: userProfile?.subscription,
        canUseSuperLike,
        canUseBoost,
        canRewind,
        canSeeWhoLikedYou
    }
}
