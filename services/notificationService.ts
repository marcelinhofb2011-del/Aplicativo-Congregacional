
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc, 
    deleteDoc, 
    getDocs, 
    Timestamp,
    limit,
    writeBatch
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { AppNotification, NotificationType } from '../types';

const COLLECTION_NAME = 'notificacoes';

export const notificationService = {
    // Listen to user notifications in real-time
    subscribeToNotifications: (userUid: string, callback: (notifications: AppNotification[]) => void) => {
        const db = getDbInstance();
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userUid', '==', userUid),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                    } as AppNotification;
                })
                .filter(n => n.isActive !== false) // Filter in memory (missing defaults to true)
                .sort((a, b) => {
                    // Sort in memory: Pinned first, then by createdAt desc
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .slice(0, 50); // Apply limit in memory

            callback(notifications);
        });
    },

    // Create a new notification
    createNotification: async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isRead' | 'isPinned' | 'createdBy'>) => {
        const db = getDbInstance();
        const docData = {
            ...notification,
            isRead: false,
            isPinned: false,
            isActive: true,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
        return docRef.id;
    },

    // Mark notification as read
    markAsRead: async (notificationId: string) => {
        const db = getDbInstance();
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isRead: true,
            updatedAt: Timestamp.now(),
        });
    },

    // Mark all as read
    markAllAsRead: async (userUid: string) => {
        const db = getDbInstance();
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userUid', '==', userUid)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs
            .filter(d => d.data().isActive && !d.data().isRead)
            .forEach((d) => {
                batch.update(d.ref, { isRead: true, updatedAt: Timestamp.now() });
            });
        
        await batch.commit();
    },

    // Toggle pin
    togglePin: async (notificationId: string, isPinned: boolean) => {
        const db = getDbInstance();
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isPinned: !isPinned,
            updatedAt: Timestamp.now(),
        });
    },

    // Delete notification
    deleteNotification: async (notificationId: string) => {
        const db = getDbInstance();
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isActive: false,
            updatedAt: Timestamp.now(),
        });
    },

    // Helper to send a notification to a specific brother/sister
    sendDesignationNotification: async (
        toUserUid: string, 
        title: string, 
        description: string, 
        referenceId: string, 
        type: NotificationType = NotificationType.DESIGNATION
    ) => {
        return notificationService.createNotification({
            userUid: toUserUid,
            title,
            description,
            type,
            date: new Date().toISOString(),
            referenceId,
        });
    }
};
