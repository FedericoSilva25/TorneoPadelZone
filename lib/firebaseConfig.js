// /lib/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- REEMPLAZA ESTOS VALORES CON TUS PROPIOS DATOS DE CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCBYMTt5TilhUy5HAXHEc0TDDz6F6Egk4U",
    authDomain: "padelzonelive-torneos.firebaseapp.com",
    projectId: "padelzonelive-torneos",
    storageBucket: "padelzonelive-torneos.firebasestorage.app",
    messagingSenderId: "401990005713",
    appId: "1:401990005713:web:a468e4bbc89143eec7a6f0"
  };

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtén una referencia a Firestore
export const db = getFirestore(app);

// Exporta la instancia de la aplicación si es necesaria para otros servicios (Auth, Storage)
export default app;