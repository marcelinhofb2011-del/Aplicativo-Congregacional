import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { EyeIcon, EyeSlashIcon } from '../components/icons/Icons';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAccessCode, setShowAccessCode] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (accessCode !== 'jw') {
            setError('Senha de acesso incorreta.');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
            
            // Clear form fields
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAccessCode('');

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Este email já está em uso.');
            } else if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else {
                setError('Falha ao criar a conta. Tente novamente.');
                console.error("Registration failed:", err);
            }
            setLoading(false); // Stop loading only on error
        }
    };

    const appIconUrl = "https://ui-avatars.com/api/?name=VL+Cisper&background=f1f5f9&color=0f172a&size=128&bold=true";

    return (
         <div className="flex items-center justify-center min-h-screen w-full bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-800 dark:via-slate-900 dark:to-black"></div>

            <div className="relative w-full max-w-md space-y-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 sm:p-10">
                <div className="text-center mb-6">
                    <img src={appIconUrl} alt="Logo" className="mx-auto h-20 w-20 rounded-2xl shadow-md mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Cadastro de Administrador
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Crie sua conta para gerenciar o sistema.
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input name="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nome Completo" className="input-style" disabled={loading || !!successMessage} />
                    <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="input-style" disabled={loading || !!successMessage} />
                    
                    <div className="relative">
                        <input name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Senha" className="input-style pr-10" disabled={loading || !!successMessage} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} disabled={loading || !!successMessage}>
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirmar Senha" className="input-style pr-10" disabled={loading || !!successMessage} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"} disabled={loading || !!successMessage}>
                            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <input name="accessCode" type={showAccessCode ? 'text' : 'password'} value={accessCode} onChange={e => setAccessCode(e.target.value)} required placeholder="Senha de Acesso" className="input-style pr-10" disabled={loading || !!successMessage} />
                        <button type="button" onClick={() => setShowAccessCode(!showAccessCode)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label={showAccessCode ? "Ocultar senha de acesso" : "Mostrar senha de acesso"} disabled={loading || !!successMessage}>
                            {showAccessCode ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    {error && !successMessage && <div className="text-red-500 dark:text-red-400 text-sm font-medium text-center pt-1">{error}</div>}
                    {successMessage && <div className="text-green-600 dark:text-green-400 text-sm font-medium text-center pt-1">{successMessage}</div>}

                    <div className="pt-2">
                        <button type="submit" disabled={loading || !!successMessage} className="w-full flex justify-center py-3 px-6 font-semibold rounded-md text-white bg-primary hover:bg-primary-dark disabled:bg-primary/60 disabled:cursor-not-allowed">
                            {loading ? 'Cadastrando...' : (successMessage ? 'Sucesso!' : 'Cadastrar')}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-6 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Já tem uma conta? </span>
                    <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                        Faça login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;