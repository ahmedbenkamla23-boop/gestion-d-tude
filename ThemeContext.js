import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  bg:          '#F7F3EE',
  card:        '#FDF9F5',
  border:      '#EDE8E0',
  inputBg:     '#FDF9F5',
  inputBorder: '#DDD6CE',
  textPrimary: '#2D2A26',
  textSecond:  '#8A7F74',
  textHint:    '#B0A89E',
  label:       '#5C6354',
  accent:      '#5C6BC0',
  accentLight: '#ECEEFF',
  amber:       '#C49A3C',
  amberLight:  '#FDF3E0',
  sage:        '#5A8A6A',
  sageLight:   '#E8F3EC',
  tabBar:      '#FDF9F5',
  tabBorder:   '#EDE8E0',
};

const dark = {
  bg:          '#1A1714',
  card:        '#26221E',
  border:      '#3A352F',
  inputBg:     '#2E2A25',
  inputBorder: '#3A352F',
  textPrimary: '#F0EBE4',
  textSecond:  '#A89880',
  textHint:    '#6E6258',
  label:       '#C4B8A8',
  accent:      '#7C8FE0',
  accentLight: '#2A2D4A',
  amber:       '#D4AA4C',
  amberLight:  '#2E2510',
  sage:        '#6A9A7A',
  sageLight:   '#1A2E20',
  tabBar:      '#26221E',
  tabBorder:   '#3A352F',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [override, setOverride] = useState(null); // null = follow system

  const isDark = override !== null ? override === 'dark' : system === 'dark';
  const colors = isDark ? dark : light;
  const toggleTheme = () => setOverride(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
