
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ChurchIcon } from '../components/icons/Icons';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, loading } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <div className="flex justify-center">
                       <ChurchIcon className="h-12 w-auto text-primary text-5xl" />
                    </div>
                    <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        Acesse sua conta
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                        Bem-vindo ao portal da congregação
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-base"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-base"
                                placeholder="Senha"
                            />
                        </div>
                    </div>
                    
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-6 border border-transparent font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-primary/50 text-base"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p className="font-semibold">Acesso Limitado (Publicador):</p>
                    <p className="mb-2">Email: <b>publicador@local</b> / Senha: <b>123</b></p>
                    <p className="font-semibold">Acesso Total (Servo/Ancião):</p>
                    <p>Use seu email e senha cadastrados.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
