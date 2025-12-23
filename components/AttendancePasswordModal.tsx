import React, { useState } from 'react';
import { LockIcon } from './icons/Icons';

interface AttendancePasswordModalProps {
    onVerify: (password: string) => boolean;
    onClose: () => void;
}

const AttendancePasswordModal: React.FC<AttendancePasswordModalProps> = ({ onVerify, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onVerify(password)) {
            onClose();
        } else {
            setError('Senha incorreta. Tente novamente.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                        <LockIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium leading-6 text-slate-900 dark:text-white">Acesso Restrito</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Para acessar esta seção, por favor, insira a senha adicional.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-6">
                    <div>
                        <label htmlFor="extra-password" className="sr-only">Senha</label>
                        <input
                            type="password"
                            name="extra-password"
                            id="extra-password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if(error) setError('');
                            }}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="Senha de acesso"
                            autoFocus
                        />
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-3">
                         <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                        >
                            Voltar
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-primary text-sm font-medium text-white hover:bg-primary-dark"
                        >
                            Verificar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttendancePasswordModal;