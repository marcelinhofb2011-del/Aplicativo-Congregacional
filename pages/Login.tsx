
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

    return (
        <div className="relative flex items-center justify-center min-h-screen w-full bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Colorful background effect */}
            <div className="absolute inset-0 z-0">
                <div className="absolute bottom-0 left-[-20%] right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(168,85,247,0.2),rgba(255,255,255,0))]"></div>
                <div className="absolute bottom-[-10%] right-[5%] top-[-20%] h-[600px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(132,204,22,0.2),rgba(255,255,255,0))]"></div>
                <div className="absolute bottom-[20%] right-[-20%] top-[-10%] h-[400px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(59,130,246,0.1),rgba(255,255,255,0))]"></div>
            </div>

            <div className="relative w-full max-w-md space-y-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-fade-in">
                <div className="p-8 sm:p-10">
                    <div className="text-center mb-8">
                        {/* Reusing the Publisher Dashboard logo style */}
                        <div className="mx-auto mb-4 w-20 h-20 bg-[#65a30d] rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-3xl tracking-wider">VC</span>
                        </div>
                        <p className="text-sm font-bold tracking-[0.3em] text-slate-800 dark:text-slate-200">
                            VILA CISPER
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
                                className="input-style bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 focus:border-[#65a30d] focus:ring-[#65a30d]"
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
                                className="input-style bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 focus:border-[#65a30d] focus:ring-[#65a30d] pr-10"
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
                                className="group relative w-full flex justify-center py-3 px-6 border border-transparent font-semibold rounded-md text-white bg-[#65a30d] hover:bg-[#588d0b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#588d0b] disabled:bg-lime-500/60 disabled:cursor-not-allowed text-base transition-colors"
                            >
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>

                     <div className="text-center mt-6 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Não tem uma conta? </span>
                        <Link to="/cadastro" className="font-medium text-[#65a30d] hover:text-[#588d0b]">
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