import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth, rtdb } from '../services/firebase';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
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
        // onAuthStateChanged is the single source of truth for the user's auth state.
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // A user is signed in. Determine their role based on whether they are anonymous.
                const isAnon = firebaseUser.isAnonymous;
                setUser({
                    uid: firebaseUser.uid,
                    email: isAnon ? 'publicador@local' : firebaseUser.email,
                    role: isAnon ? UserRole.PUBLISHER : UserRole.SERVANT,
                });
            } else {
                // No user is signed in.
                setUser(null);
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);
    
    // Effect to manage real-time presence for the logged-in user
    useEffect(() => {
        if (!user) return;

        const myConnectionRef = ref(rtdb, `presence/${user.uid}`);
        const connectedRef = ref(rtdb, '.info/connected');

        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                // We're connected.
                set(myConnectionRef, true);

                // When I disconnect, remove this device
                onDisconnect(myConnectionRef).remove();
            }
        });

        return () => {
            unsubscribe();
            set(myConnectionRef, null); // Clean up on user change/logout
        };
    }, [user]);

    // Effect to count the total number of online users
    useEffect(() => {
        const presenceRef = ref(rtdb, 'presence');
        const unsubscribe = onValue(presenceRef, (snap) => {
            setOnlineCount(snap.numChildren());
        });

        return () => unsubscribe();
    }, []);


    const login = useCallback(async (email: string, pass: string) => {
        setLoading(true);
        setError(null);

        // Use Firebase anonymous auth for publishers. This requires Anonymous Sign-In to be enabled in the Firebase console.
        if (email.toLowerCase() === 'publicador@local' && pass === '123') {
            try {
                await signInAnonymously(auth);
                // onAuthStateChanged will handle setting the user state.
            } catch (e: any) {
                console.error("Anonymous sign-in failed:", e);
                if (e.code === 'auth/admin-restricted-operation') {
                     setError('Ação necessária: Login anônimo precisa ser habilitado no Console do Firebase.');
                } else {
                     setError('Falha ao iniciar sessão de publicador.');
                }
                setLoading(false);
            }
            return;
        }

        // Proceed with standard email/password auth for servants
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // The onAuthStateChanged listener will handle setting the user state.
        } catch (e: any) {
            console.error("Login failed:", e);
            if (e.code === 'auth/invalid-credential') {
                setError('Email ou senha incorretos. Verifique e tente novamente.');
            } else {
                setError('Falha no login. Verifique suas credenciais ou a conexão.');
            }
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // The presence useEffect cleanup will handle removing the user from RTDB
            await signOut(auth);
            // onAuthStateChanged will automatically set user to null.
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            // Also reset any local state related to the session
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