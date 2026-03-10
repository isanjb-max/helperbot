// alumno/calificaciones_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let kardexCompleto = {};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Pintar el nombre arriba (buscando en usuarios)
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            document.getElementById('nombreUsuario').innerText = userSnap.data().nombre;
        }

        // Cargar el Kardex del alumno
        cargarKardex(user.uid);
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarKardex(uid) {
    try {
        const kardexRef = doc(db, "kardex", uid);
        const kardexSnap = await getDoc(kardexRef);

        const subjectList = document.getElementById('subjectList');
        
        if (kardexSnap.exists()) {
            kardexCompleto = kardexSnap.data();
            
            // Asumiendo que estamos viendo el "cuatri_3" por defecto
            const materiasCuatri3 = kardexCompleto.cuatri_3;

            if (materiasCuatri3) {
                subjectList.innerHTML = ""; // Limpiamos el loader
                let esPrimera = true;

                // Recorremos las materias
                for (const [nombreMateria, datosMateria] of Object.entries(materiasCuatri3)) {
                    const card = document.createElement('div');
                    card.className = `subject-card ${esPrimera ? 'active' : ''}`;
                    
                    card.innerHTML = `
                        <div class="subject-icon"><i class="fa-solid fa-book"></i></div>
                        <div class="subject-text">
                            <strong>${nombreMateria}</strong><br>
                            <span style="font-size: 11px; color: #666;">Promedio: ${datosMateria.calificacion_final}</span>
                        </div>
                    `;

                    // Al hacer clic, pintamos la tabla de la derecha
                    card.onclick = () => {
                        document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        pintarTablaCalificaciones(nombreMateria, datosMateria);
                    };

                    subjectList.appendChild(card);

                    // Autocargar la primera materia
                    if (esPrimera) {
                        pintarTablaCalificaciones(nombreMateria, datosMateria);
                        esPrimera = false;
                    }
                }
            } else {
                subjectList.innerHTML = "<div class='loader'>No hay materias para este cuatrimestre.</div>";
            }
        } else {
            subjectList.innerHTML = "<div class='loader'>Aún no tienes un kardex registrado.</div>";
        }
    } catch (error) {
        console.error("Error al cargar el kardex:", error);
    }
}

function pintarTablaCalificaciones(nombreMateria, datos) {
    const tbody = document.getElementById('gradesTableBody');
    let html = "";

    if (datos.unidades) {
        // Recorremos las unidades (Unidad 1, Unidad 2, etc.)
        for (const [nombreUnidad, califUnidad] of Object.entries(datos.unidades)) {
            html += `
                <tr>
                    <td colspan="4" class="unit-header-row">
                        ${nombreUnidad.toUpperCase()}
                        <div class="unit-summary"><strong>${califUnidad}</strong> &nbsp; <small>Ordinario</small></div>
                    </td>
                </tr>
            `;
            // Aquí podrías agregar un sub-bucle si tienes los instrumentos detallados, 
            // pero para empezar mostramos el resumen de la unidad.
        }
    } else {
        html = "<tr><td colspan='4' class='loader'>No hay desglose de unidades.</td></tr>";
    }

    tbody.innerHTML = html;
}