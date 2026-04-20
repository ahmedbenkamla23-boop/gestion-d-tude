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
    bg: '#F4F7FB',
    card: '#FFFFFF',
    accent: '#4F7D5B', // Main brand green
    accentLight: '#E9F1EA',
    sage: '#304A9E',   // Supporting blue
    sageLight: '#E6EDF7',
    amber: '#D79C34',  // Logo amber
    amberLight: '#FAF1DF',
    textPrimary: '#1C2330',
    textSecond: '#5F6B7A',
    textHint: '#8D98A4',
    border: '#D9DFE7',
    inputBg: '#FFFFFF',
    inputBorder: '#D1D8E2',
    label: '#4C5B6D',
    tabBar: '#FFFFFF',
    tabBorder: '#D9DFE7',
  };

  const darkColors = {
    bg: '#10151F',
    card: '#172033',
    accent: '#5F8A6B', // Main brand green for dark mode
    accentLight: '#4F7D5B26',
    sage: '#5976CE',   // Supporting blue
    sageLight: '#3A5CB426',
    amber: '#E0B24B',  // Brighter amber
    amberLight: '#D79C3426',
    textPrimary: '#F4F7FB',
    textSecond: '#B0BCCF',
    textHint: '#7A8695',
    border: '#253146',
    inputBg: '#1B2333',
    inputBorder: '#32415A',
    label: '#9DA9B8',
    tabBar: '#172033',
    tabBorder: '#253146',
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};