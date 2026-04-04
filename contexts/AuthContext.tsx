import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getAuthInstance, ensurePersistence } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { User, UserRole, AppNotification } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLISHER_EMAIL = 'publicador@app.dev';
const PUBLISHER_PASS = '123456';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuthInstance();
        ensurePersistence();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const isPublicadorAccount = firebaseUser.email === PUBLISHER_EMAIL;
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    role: isPublicadorAccount ? UserRole.PUBLISHER : UserRole.SERVANT,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, pass: string) => {
        setLoading(true);
        setError(null);
        
        const auth = getAuthInstance();

        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (e: any) {
            if ((e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') && email === PUBLISHER_EMAIL && pass === PUBLISHER_PASS) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                    await updateProfile(userCredential.user, { displayName: 'Publicador' });
                    setError(null);
                } catch (creationError: any) {
                    console.error("Falha ao criar conta de publicador de fallback:", creationError);
                    setError('Email ou senha incorretos.');
                }
            } else {
                console.error("Falha no login:", e);
                if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
                    setError('Email ou senha incorretos.');
                } else if (e.code === 'auth/network-request-failed') {
                    setError('Falha de conexão. Verifique sua internet.');
                } else {
                    setError('Falha no login. Verifique as credenciais.');
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setError(null);
        const auth = getAuthInstance();
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Falha ao sair", e);
            setError('Falha ao sair.');
        }
    }, []);
    
    const contextValue = {
        user,
        loading,
        error,
        login,
        logout,
    };
    
    return (
        <AuthContext.Provider value={contextValue as AuthContextType}>
            {children}
        </AuthContext.Provider>
    );
};
