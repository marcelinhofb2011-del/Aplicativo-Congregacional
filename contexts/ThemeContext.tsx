
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'congregacao-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            return (storedTheme as Theme) || 'system';
        } catch {
            return 'system';
        }
    });

    const applyTheme = useCallback((selectedTheme: Theme) => {
        const root = window.document.documentElement;
        
        const isDark = selectedTheme === 'dark' || 
                       (selectedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(isDark ? 'dark' : 'light');
    }, []);

    useEffect(() => {
        applyTheme(theme);
        
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme, applyTheme]);

    const setTheme = (newTheme: Theme) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
            setThemeState(newTheme);
        } catch (e) {
            console.error("Failed to set theme in localStorage", e);
        }
    };
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
