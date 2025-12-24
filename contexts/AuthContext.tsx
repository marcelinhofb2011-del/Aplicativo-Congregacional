import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth, rtdb } from '../services/firebase';
import { ref, onValue, set, onDisconnect, serverTimestamp, off } from 'firebase/database';
import { User, UserRole } from '../types';
import { ATTENDANCE_EXTRA_PASSWORD } from '../constants';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAttendanceUnlocked: boolean;
    onlineCount: number;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAttendancePassword: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAttendanceUnlocked, setAttendanceUnlocked] = useState<boolean>(false);
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const isAnon = firebaseUser.isAnonymous;
                setUser({
                    uid: firebaseUser.uid,
                    email: isAnon ? 'publicador@local' : firebaseUser.email,
                    role: isAnon ? UserRole.PUBLISHER : UserRole.SERVANT,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);
    
    // Gerenciamento de Presença do Usuário Atual
    useEffect(() => {
        if (!user) return;

        const myConnectionRef = ref(rtdb, `presence/${user.uid}`);
        const connectedRef = ref(rtdb, '.info/connected');

        const listener = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // Define como online e agenda a remoção automática ao desconectar
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
            // Se houver erro de permissão, o contador fica em 0 silenciosamente
            setOnlineCount(0);
        });

        return () => unsubscribe();
    }, []);


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
            await signOut(auth);
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            setAttendanceUnlocked(false);
        }
    }, []);
    
    const checkAttendancePassword = useCallback((password: string) => {
        if (password === ATTENDANCE_EXTRA_PASSWORD) {
            setAttendanceUnlocked(true);
            return true;
        }
        return false;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, error, isAttendanceUnlocked, onlineCount, login, logout, checkAttendancePassword }}>
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