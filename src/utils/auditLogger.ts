import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

export type AdminAction =
    | 'BAN_USER'
    | 'UNBAN_USER'
    | 'TOGGLE_FLAG'
    | 'UPDATE_CONFIG'
    | 'GRANT_PREMIUM'
    | 'REPORT_DISMISS'
    | 'EDIT_TRANSLATION';

export const logAdminAction = async (action: AdminAction, targetId: string, details: string) => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.warn('Attempted to log admin action without authenticated user:', action);
            return;
        }

        const logEntry = {
            adminUid: user.uid,
            adminEmail: user.email || 'Unknown',
            action,
            targetId,
            details,
            timestamp: serverTimestamp(),
            // Getting real client IP from frontend reliably requires an external API call. 
            // For now, we'll mark it as captured by the client or leave it empty/placeholder 
            // depending on integration needs.
            ip: 'Client-Side Capture'
        };

        await addDoc(collection(db, 'audit_logs'), logEntry);
        console.log(`[Audit] Logged action: ${action} on ${targetId}`);
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};
