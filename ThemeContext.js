import React, { createContext, useContext, useState } from 'react';

const light = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecond: '#6B7280',
  textHint: '#9CA3AF',
  accent: '#4F7D5B',
  accentLight: '#EAF2EC',
  amber: '#D79C34',
  amberLight: '#FDF6E3',
  sage: '#5A8A6A',
  sageLight: '#EAF2EC',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  inputBorder: '#D1D5DB',
  label: '#374151',
  tabBar: '#FFFFFF',
  tabBorder: '#E5E7EB',
};

const dark = {
  bg: '#0F1117',
  card: '#1C1F2A',
  textPrimary: '#F1F5F9',
  textSecond: '#94A3B8',
  textHint: '#64748B',
  accent: '#5A9068',
  accentLight: '#1A2E1F',
  amber: '#E0A83A',
  amberLight: '#2E2210',
  sage: '#6AA07A',
  sageLight: '#1A2E1F',
  border: '#2D3142',
  inputBg: '#252836',
  inputBorder: '#3D4160',
  label: '#CBD5E1',
  tabBar: '#1C1F2A',
  tabBorder: '#2D3142',
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(v => !v);
  return (
    <ThemeContext.Provider value={{ colors: isDark ? dark : light, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
