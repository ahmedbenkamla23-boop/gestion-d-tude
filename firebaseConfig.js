import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDseNNs7bakJQHYCAUSbEjpfMYZH3bUROs",
  authDomain: "studyapp-58923.firebaseapp.com",
  projectId: "studyapp-58923",
  storageBucket: "studyapp-58923.firebasestorage.app",
  messagingSenderId: "284617295993",
  appId: "1:284617295993:android:824e9c76a557e62ebeeca8"
};

const app = initializeApp(firebaseConfig);

export default app;