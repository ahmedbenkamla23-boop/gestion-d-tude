import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDseNNs7bakJQHYCAUSbEjpfMYZH3bUROs", // Votre clé API
  authDomain: "studyapp-58923.firebaseapp.com",     // Domaine d'authentification basé sur votre projectId
  projectId: "studyapp-58923",                      // Votre ID de projet
  storageBucket: "studyapp-58923.firebasestorage.app", // Votre compartiment de stockage
  messagingSenderId: "284617295993",                // Votre ID d'expéditeur de messagerie (project_number)
  appId: "1:284617295993:android:824e9c76a557e62ebeeca8"                     // L'ID spécifique de votre application WEB (à récupérer dans la console Firebase si vous avez enregistré une app web)
};

const app = initializeApp(firebaseConfig);

export default app;
