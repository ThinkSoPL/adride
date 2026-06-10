import { useEffect, useState } from 'react';
import type { Theme } from '../lib/types';

export function useFleetTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('fleet-dashboard-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = (newTheme?: Theme) => {
    const nextTheme = newTheme ?? (theme === 'dark' ? 'light' : 'dark');
    setTheme(nextTheme);
    localStorage.setItem('fleet-dashboard-theme', nextTheme);
  };

  const colors = {
    bg: theme === 'dark' ? '#0F1219' : '#FFFFFF',
    bgSecondary: theme === 'dark' ? '#1B2332' : '#F3F4F6',
    bgTertiary: theme === 'dark' ? '#252D3D' : '#E5E7EB',
    text: theme === 'dark' ? '#E6EDF3' : '#1F2937',
    textSecondary: theme === 'dark' ? '#A0AEC0' : '#6B7280',
    textTertiary: theme === 'dark' ? '#718096' : '#9CA3AF',
    border: theme === 'dark' ? '#364156' : '#D1D5DB',
    accent: '#FF6B35',
    accentLight: '#FF9A35',
    success: theme === 'dark' ? '#34D399' : '#10B981',
    error: theme === 'dark' ? '#FCA5A5' : '#EF4444',
    warning: theme === 'dark' ? '#FBBF24' : '#F59E0B',
  };

  return { theme, toggleTheme, colors, isMounted };
}
