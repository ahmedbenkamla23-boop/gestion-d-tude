import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Logo palette applied to app variables
  const lightColors = {
    bg: '#F5F7FA',
    card: '#FFFFFF',
    accent: '#5C6BC0', // Logo Indigo
    accentLight: '#EEF0F8',
    sage: '#5A8A6A',   // Logo Green
    sageLight: '#EEF3F0',
    amber: '#C49A3C',  // Logo Amber
    amberLight: '#F8F4EC',
    textPrimary: '#1A1D21',
    textSecond: '#687076',
    textHint: '#9BA1A6',
    border: '#E6E8EB',
    inputBg: '#FFFFFF',
    inputBorder: '#D7DBDF',
    label: '#4B5563',
    tabBar: '#FFFFFF',
    tabBorder: '#E6E8EB',
  };

  const darkColors = {
    bg: '#121212',
    card: '#1E1E1E',
    accent: '#7383DB', // Slightly lighter Indigo for dark mode visibility
    accentLight: '#5C6BC026', 
    sage: '#679B78',   // Slightly lighter Sage
    sageLight: '#5A8A6A26',
    amber: '#D9AB44',  // Slightly lighter Amber
    amberLight: '#C49A3C26',
    textPrimary: '#F1F3F5',
    textSecond: '#AEC0CB',
    textHint: '#687076',
    border: '#2C2E33',
    inputBg: '#181818',
    inputBorder: '#3A3F45',
    label: '#9BA1A6',
    tabBar: '#1E1E1E',
    tabBorder: '#2C2E33',
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};