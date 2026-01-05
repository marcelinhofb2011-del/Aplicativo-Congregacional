import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '../components/icons/Icons';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, error, loading } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    // Este URL é o mesmo do manifest.json, garantindo consistência visual.
    const appIconUrl = "https://ui-avatars.com/api/?name=VL+Cisper&background=f1f5f9&color=0f172a&size=128&bold=true";

    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 lg:px-8">
            {/* Fundo gradiente sofisticado */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-800 dark:via-slate-900 dark:to-black"></div>

            <div className="relative w-full max-w-md space-y-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="p-8 sm:p-10">
                    <div className="text-center mb-6">
                        <img 
                            src={appIconUrl} 
                            alt="Logo da Congregação VL Cisper" 
                            className="mx-auto h-20 w-20 rounded-2xl shadow-md mb-4" 
                        />
                        <div className="mb-5">
                            <h1 className="text-xs font-medium tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">
                                Congregação
                            </h1>
                            <p className="text-lg font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                                Vila Cisper
                            </p>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Acesse sua conta
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Bem-vindo ao portal da congregação
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
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
                                className="input-style bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary"
                                placeholder="Email"
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-style bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary pr-10"
                                placeholder="Senha"
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        
                        {error && <div className="text-red-500 dark:text-red-400 text-sm font-medium text-center pt-1">{error}</div>}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-6 border border-transparent font-semibold rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-primary/60 disabled:cursor-not-allowed text-base transition-colors"
                            >
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>

                     <div className="text-center mt-6 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Não tem uma conta? </span>
                        <Link to="/cadastro" className="font-medium text-primary hover:text-primary-dark">
                            Cadastre-se
                        </Link>
                    </div>
                </div>
                
                <div className="bg-slate-100/70 dark:bg-slate-900/70 p-4 border-t border-slate-200/80 dark:border-slate-700/80 text-center text-sm text-slate-500 dark:text-slate-400">
                    <div>
                        <span className="font-semibold">Publicador:</span>
                        <span> Email: <b>publicador@local</b> | Senha: <b>123</b></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;