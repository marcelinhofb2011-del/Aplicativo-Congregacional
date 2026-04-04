
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50 pb-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <nav className="max-w-md mx-auto h-20 flex justify-around items-center px-4">
                {itemsToShow.map((item) => (
                    <NavLink key={item.path} to={item.path} className={navLinkClass}>
                        {({ isActive }) => (
                            <>
                                <item.icon className={`h-6 w-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-tighter transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-2 h-1 w-8 bg-primary rounded-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
                {user.role === UserRole.SERVANT && (
                    <NavLink to="/menu" className={navLinkClass}>
                        {({ isActive }) => (
                            <>
                                <Squares2X2Icon className={`h-6 w-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-tighter transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                    Menu
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-2 h-1 w-8 bg-primary rounded-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                )}
            </nav>
        </div>
    );
};

export default BottomNav;
