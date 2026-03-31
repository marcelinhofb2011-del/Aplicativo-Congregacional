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
    // As propriedades de senha extra e notificações foram removidas para simplificar
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
                // Lógica de perfil simples baseada no email
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
            // onAuthStateChanged cuidará de definir o estado do usuário
        } catch (e: any) {
            // Se o login falhar para a conta de publicador padrão, tente criá-la.
            // Isso garante que a conta de teste sempre funcione.
            if ((e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') && email === PUBLISHER_EMAIL && pass === PUBLISHER_PASS) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                    await updateProfile(userCredential.user, { displayName: 'Publicador' });
                    // onAuthStateChanged irá lidar com o login automaticamente após a criação.
                    setError(null); // Limpa o erro de login inicial
                } catch (creationError: any) {
                     // Se a criação também falhar (ex: email já existe com outra senha), exibe o erro original.
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
