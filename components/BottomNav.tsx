
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { BOTTOM_NAV_ITEMS } from '../constants';
import { Squares2X2Icon } from './icons/Icons';
import { useIsInputFocused } from '../hooks/useIsInputFocused';

const BottomNav: React.FC = () => {
    const { user } = useAuth();
    const isInputFocused = useIsInputFocused();
    
    if (!user || isInputFocused) return null;

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
            isActive
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-600'
        }`;
        
    // Show default bottom nav items for both roles.
    // Servants get an additional "Menu" link.
    const itemsToShow = BOTTOM_NAV_ITEMS;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transform-gpu bottom-nav-container">
            <nav className="max-w-2xl mx-auto h-full flex justify-around items-center px-4">
                {itemsToShow.map((item) => {
                    const targetPath = item.path;

                    return (
                        <NavLink key={item.path} to={targetPath} className={navLinkClass}>
                            {({ isActive }) => (
                                <div className="flex flex-col items-center gap-0.5">
                                    <div className={`p-1.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-amber-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-[9px] font-extrabold uppercase tracking-wider transition-all duration-500 ${isActive ? 'text-primary dark:text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            )}
                        </NavLink>
                    );
                })}
                {user.role === UserRole.SERVANT && (
                    <NavLink to="/menu" className={navLinkClass}>
                        {({ isActive }) => (
                            <div className="flex flex-col items-center gap-0.5">
                                <div className={`p-1.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-amber-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}>
                                    <Squares2X2Icon className="h-5 w-5" />
                                </div>
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider transition-all duration-500 ${isActive ? 'text-primary dark:text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                    Menu
                                </span>
                            </div>
                        )}
                    </NavLink>
                )}
            </nav>
        </div>
    );
};

export default BottomNav;
