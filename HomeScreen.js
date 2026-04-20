import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { getAuth, signOut } from "firebase/auth";
import app from "../firebaseConfig";
import { useTheme } from './ThemeContext';

const auth = getAuth(app);

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        Alert.alert("Déconnexion réussie");
        navigation.navigate("Login");
      })
      .catch((error) => {
        Alert.alert("Erreur: " + error.message);
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Bienvenue dans votre application !</Text>

      {/* 🔹 Bouton logout */}
      <Button title="Se déconnecter" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
});