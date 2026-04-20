import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { getAuth, signOut } from "firebase/auth";
import app from "../firebaseConfig";

const auth = getAuth(app);

export default function HomeScreen({ navigation }) {

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        alert("Déconnexion réussie");
        navigation.navigate("Login");
      })
      .catch((error) => {
        alert("Erreur: " + error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue dans votre application !</Text>

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