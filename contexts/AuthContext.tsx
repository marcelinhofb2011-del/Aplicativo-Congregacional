
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth, rtdb } from '../services/firebase';
import { ref, onValue, set, onDisconnect, serverTimestamp, off, query, orderByChild, startAt, onChildAdded } from 'firebase/database';
import { User, UserRole, AppNotification } from '../types';
import { ATTENDANCE_EXTRA_PASSWORD, PAGE_PASSWORDS } from '../constants';
import { hasNotificationPermission } from '../utils/notifications';
import { getUnreadNotifications, markNotificationsAsRead } from '../services/firestoreService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAttendanceUnlocked: boolean;
    onlineCount: number;
    notifications: AppNotification[];
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAttendancePassword: (password: string) => boolean;
    isPageUnlocked: (pagePath: string) => boolean;
    checkPagePassword: (pagePath: string, password: string) => boolean;
    handleNotificationsShown: (notificationIds: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAttendanceUnlocked, setAttendanceUnlocked] = useState<boolean>(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [unlockedPages, setUnlockedPages] = useState<Set<string>>(new Set());
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const isAnon = firebaseUser.isAnonymous;
                const currentUser = {
                    uid: firebaseUser.uid,
                    email: isAnon ? 'publicador@local' : firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    role: isAnon ? UserRole.PUBLISHER : UserRole.SERVANT,
                };
                setUser(currentUser);

                // Fetch notifications ONLY for non-anonymous users
                if (!isAnon) {
                    try {
                        const unread = await getUnreadNotifications(currentUser.uid);
                        setNotifications(unread);
                    } catch (e: any) {
                         if (e.message.includes('FAILED_PRECONDITION')) {
                            console.warn(
                                '%c[ATENÇÃO] ÍNDICE DO FIRESTORE NECESSÁRIO',
                                'color: orange; font-weight: bold;',
                                '\nPara que as notificações funcionem corretamente, por favor, crie o seguinte índice no seu Firestore:\n\n' +
                                '1. Coleção: notificacoes\n' +
                                '2. Campos a serem indexados:\n' +
                                '   - usuarioUid (Ascendente)\n' +
                                '   - notificado (Ascendente)\n' +
                                '3. Status do índice: Ativado\n\n' +
                                `Link para criar o índice (substitua [SEU_PROJETO]): https://console.firebase.google.com/project/${auth.app.options.projectId}/firestore/indexes/composite/create`
                            );
                        } else {
                            console.error("Erro ao buscar notificações:", e);
                        }
                    }
                }

            } else {
                setUser(null);
                setNotifications([]); // Clear notifications on logout
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);
    
    // Gerenciamento de Presença do Usuário Atual
    useEffect(() => {
        if (!user || user.uid.startsWith('mock-')) return;

        const myConnectionRef = ref(rtdb, `presence/${user.uid}`);
        const connectedRef = ref(rtdb, '.info/connected');

        const listener = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                set(myConnectionRef, {
                    online: true,
                    lastSeen: serverTimestamp(),
                    email: user.email
                });
                onDisconnect(myConnectionRef).remove();
            }
        });

        return () => {
            off(connectedRef, 'value', listener);
            set(myConnectionRef, null);
        };
    }, [user]);

    // Contador Global de Usuários Online
    useEffect(() => {
        const presenceRef = ref(rtdb, 'presence');
        const unsubscribe = onValue(presenceRef, (snap) => {
            if (snap.exists()) {
                setOnlineCount(snap.numChildren());
            } else {
                setOnlineCount(0);
            }
        }, (err) => {
            console.warn("Erro ao ler contador de presença:", err);
            setOnlineCount(0);
        });

        return () => unsubscribe();
    }, []);

    // Listener de Notificações em Tempo Real (RTDB - opcional, mas bom ter)
    useEffect(() => {
        if (!user || user.role !== UserRole.SERVANT) return;

        const notificationsRef = ref(rtdb, 'notifications');
        const recentNotificationsQuery = query(notificationsRef, orderByChild('timestamp'), startAt(Date.now()));

        const unsubscribe = onChildAdded(recentNotificationsQuery, (snapshot) => {
            const notification = snapshot.val();
            // Evita notificar o próprio usuário que criou o evento
            if (notification && notification.createdBy !== user.uid) {
                if (hasNotificationPermission()) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(notification.title, {
                            body: notification.body,
                            icon: '/icon-192.svg',
                            badge: '/icon-192.svg',
                            data: { url: notification.link || '/' }
                        });
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleNotificationsShown = async (notificationIds: string[]) => {
        try {
            await markNotificationsAsRead(notificationIds);
            setNotifications([]); // Clear from local state
        } catch (error) {
            console.error("Falha ao marcar notificações como lidas:", error);
        }
    };

    const login = useCallback(async (email: string, pass: string) => {
        setLoading(true);
        setError(null);

        if (email.toLowerCase() === 'publicador@local' && pass === '123') {
            try {
                await signInAnonymously(auth);
            } catch (e: any) {
                console.error("Anonymous sign-in failed:", e);
                setError('Falha ao iniciar sessão de publicador.');
                setLoading(false);
            }
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (e: any) {
            console.error("Login failed:", e);
            if (e.code === 'auth/invalid-credential') {
                setError('Email ou senha incorretos.');
            } else {
                setError('Falha no login.');
            }
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (user?.uid.startsWith('mock-')) {
                setUser(null);
            } else {
                await signOut(auth);
            }
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            setAttendanceUnlocked(false);
            setUnlockedPages(new Set());
        }
    }, [user]);
    
    const checkAttendancePassword = useCallback((password: string) => {
        if (password === ATTENDANCE_EXTRA_PASSWORD) {
            setAttendanceUnlocked(true);
            return true;
        }
        return false;
    }, []);

    const isPageUnlocked = useCallback((pagePath: string) => {
        return unlockedPages.has(pagePath);
    }, [unlockedPages]);

    const checkPagePassword = useCallback((pagePath: string, password: string) => {
        const correctPassword = PAGE_PASSWORDS[pagePath as keyof typeof PAGE_PASSWORDS];
        if (correctPassword && password === correctPassword) {
            setUnlockedPages(prev => new Set(prev).add(pagePath));
            return true;
        }
        return false;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, error, isAttendanceUnlocked, onlineCount, notifications, login, logout, checkAttendancePassword, isPageUnlocked, checkPagePassword, handleNotificationsShown }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
