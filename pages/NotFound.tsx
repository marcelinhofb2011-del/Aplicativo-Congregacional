
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-light dark:bg-dark text-center px-4">
            <h1 className="text-6xl font-extrabold text-primary">404</h1>
            <h2 className="mt-4 text-3xl font-bold text-slate-800 dark:text-slate-200">Página não encontrada</h2>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                A página que você está procurando não existe ou você não tem permissão para acessá-la.
            </p>
            <Link
                to="/"
                className="mt-8 inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
            >
                Voltar para o Início
            </Link>
        </div>
    );
};

export default NotFound;
