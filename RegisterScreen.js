import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import app from "../firebaseConfig";
import { useTheme } from './ThemeContext';

const auth = getAuth(app);

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {

    if (email === '' || password === '') {
      Alert.alert("Remplir tous les champs");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Mot de passe doit contenir au moins 6 caractères");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        Alert.alert("Compte créé avec succès");

        //  retourner vers Login
        navigation.navigate("Login");
      })
      .catch((error) => {
        Alert.alert("Erreur: " + error.message);
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Créer un compte</Text>

      <TextInput
        placeholder="Entrer votre email"
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={colors.textHint}
      />

      <TextInput
        placeholder="Entrer votre mot de passe"
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={colors.textHint}
      />

      <Button title="Créer un compte" onPress={handleRegister} />

      {/*  retour vers Login */}
      <Button
        title="Déjà un compte ? Se connecter"
        onPress={() => navigation.navigate("Login")}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});