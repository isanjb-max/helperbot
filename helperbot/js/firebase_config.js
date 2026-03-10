// js/firebase_config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tus credenciales exactas (las tomé de tu app.js original)
const firebaseConfig = {
  apiKey: "AIzaSyDKzU_FGTqGTLPHUdjNCkv8Zf5xGiUMxxk",
  authDomain: "helperbot-374c3.firebaseapp.com",
  projectId: "helperbot-374c3",
  storageBucket: "helperbot-374c3.firebasestorage.app",
  messagingSenderId: "641357841706",
  appId: "1:641357841706:web:904c5dd4e0b96921124a53"
};

// Inicializar la app, autenticación y la nueva base de datos Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos 'auth' y 'db' para usarlos en cualquier otro archivo del proyecto
export { auth, db };