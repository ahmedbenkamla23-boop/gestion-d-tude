import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import app from "../firebaseConfig";

const auth = getAuth(app);

export default function RegisterScreen({ navigation }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {

    if (email === '' || password === '') {
      alert("Remplir tous les champs");
      return;
    }

    if (password.length < 6) {
      alert("Mot de passe doit contenir au moins 6 caractères");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("Compte créé avec succès");

        //  retourner vers Login
        navigation.navigate("Login");
      })
      .catch((error) => {
        alert("Erreur: " + error.message);
      });
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        placeholder="Entrer votre email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Entrer votre mot de passe"
        style={styles.input}
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
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