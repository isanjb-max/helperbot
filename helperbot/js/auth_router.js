// js/auth_router.js
import { auth, db } from './firebase_config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---------------------------------------------------------
// 1. FUNCIÓN DE LOGIN (Se llama desde el botón del index.html)
// ---------------------------------------------------------
window.iniciarSesion = async function() {
    const email = document.getElementById('matricula').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (!email || !pass) {
        alert("⚠️ Por favor, ingresa tu usuario (correo) y contraseña.");
        return;
    }

    try {
        // 1. Autenticar en Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        // 2. Buscar su perfil en Firestore para saber qué rol tiene
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const datosUsuario = userDoc.data();
            console.log("🟢 Usuario verificado. Rol:", datosUsuario.rol);

            // 3. Redirección estricta por carpetas
            if (datosUsuario.rol === "alumno") {
                window.location.href = "alumno/inicio.html";
            } else if (datosUsuario.rol === "profesor") {
                window.location.href = "profesor/inicio.html";
            } else {
                alert("⚠️ Rol no reconocido en el sistema.");
                signOut(auth);
            }
        } else {
            alert("⛔ Tu cuenta no está en la base de datos de Firestore. Contacta a Control Escolar.");
            signOut(auth);
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("❌ Credenciales incorrectas. Revisa tus datos.");
    }
};

// ---------------------------------------------------------
// 2. PROTECCIÓN GLOBAL (Cerrar sesión y evitar intrusos)
// ---------------------------------------------------------
window.cerrarSesion = function() {
    signOut(auth).then(() => {
        // Si cierran sesión desde cualquier carpeta, los mandamos a la raíz
        window.location.href = "../index.html"; 
    }).catch(error => console.error(error));
};

// Si un usuario ya logueado intenta entrar al index.html, lo regresamos a su dashboard
onAuthStateChanged(auth, async (user) => {
    const paginaActual = window.location.pathname.split("/").pop();
    
    // Si estamos en la página de login (index.html o vacío) y ya hay sesión activa
    if (user && (paginaActual === "index.html" || paginaActual === "")) {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const rol = userDoc.data().rol;
            window.location.href = rol === "profesor" ? "profesor/inicio.html" : "alumno/inicio.html";
        }
    }
});