// alumno/alumno_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Escuchar si hay un usuario logueado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Ir a Firestore y buscar el documento de este usuario usando su UID
            const userRef = doc(db, "usuarios", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const datosAlumno = userSnap.data();
                
                // Pintar los datos en el HTML
                document.getElementById('nombreUsuario').innerText = datosAlumno.nombre || "Alumno sin nombre";
                document.getElementById('infoNombre').innerText = datosAlumno.nombre || "No registrado";
                
                // Si tuvieras un campo para mostrar el grupo en tu tabla:
                // document.getElementById('infoGrupo').innerText = datosAlumno.grupo || "Sin grupo asignado";

                console.log("🟢 Datos del alumno cargados exitosamente.");
            } else {
                console.error("No se encontró el perfil del alumno en la base de datos.");
            }
        } catch (error) {
            console.error("Error al obtener datos del alumno:", error);
        }
    } else {
        // Si por alguna razón no hay sesión, lo pateamos al login
        window.location.href = "../index.html";
    }
});