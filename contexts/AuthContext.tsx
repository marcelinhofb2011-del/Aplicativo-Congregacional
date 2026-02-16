import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getAuthInstance, ensurePersistence } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { User, UserRole, AppNotification } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    // As propriedades de senha extra e notificações foram removidas para simplificar
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ensurePersistence();
        const auth = getAuthInstance();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Lógica de perfil simples baseada no email
                const isPublicadorAccount = firebaseUser.email === 'publicador@local';
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
        try {
            const auth = getAuthInstance();
            await signInWithEmailAndPassword(auth, email, pass);
            // onAuthStateChanged cuidará de definir o estado do usuário
        } catch (e: any) {
            console.error("Falha no login:", e);
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
                setError('Email ou senha incorretos.');
            } else if (e.code === 'auth/network-request-failed') {
                setError('Falha de conexão. Verifique sua internet.');
            } else {
                setError('Falha no login. Verifique as credenciais.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setError(null);
        try {
            const auth = getAuthInstance();
            await signOut(auth);
            // onAuthStateChanged cuidará da limpeza
        } catch (e) {
            console.error("Falha ao sair", e);
            setError('Falha ao sair.');
        }
    }, []);
    
    // O valor do provedor foi simplificado para conter apenas a lógica de autenticação padrão.
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