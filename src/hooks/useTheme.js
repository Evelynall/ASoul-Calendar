import { useState, useEffect } from 'react';
import { THEME_KEY } from '../constants';

/**
 * useTheme Hook
 * 管理深色/浅色/跟随系统三种主题模式
 */
export function useTheme() {
    const [themeMode, setThemeMode] = useState(
        () => localStorage.getItem(THEME_KEY) || 'auto'
    );

    useEffect(() => {
        const root = document.documentElement;
        localStorage.setItem(THEME_KEY, themeMode);

        const applyTheme = () => {
            if (themeMode === 'auto') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.classList.toggle('dark', isDark);
            } else {
                root.classList.toggle('dark', themeMode === 'dark');
            }
        };

        applyTheme();

        if (themeMode === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = (e) => root.classList.toggle('dark', e.matches);
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
    }, [themeMode]);

    const toggleTheme = () =>
        setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));

    return { themeMode, setThemeMode, toggleTheme };
}
