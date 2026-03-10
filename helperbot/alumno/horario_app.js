// alumno/horario_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let grupoAlumno = "";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Obtener datos del alumno para saber su grupo
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const datos = userSnap.data();
            document.getElementById('nombreUsuario').innerText = datos.nombre;
            grupoAlumno = datos.grupo || "Sin Grupo";
            document.getElementById('lblGrupo').innerText = grupoAlumno;
            
            // 2. Cargar el horario de su grupo
            if(grupoAlumno !== "Sin Grupo") {
                cargarHorario(grupoAlumno);
            } else {
                document.getElementById('horarioContenedor').innerHTML = "<p style='color:red;'>No tienes un grupo asignado.</p>";
            }
        }
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarHorario(grupo) {
    const contenedor = document.getElementById('horarioContenedor');
    
    try {
        // Buscamos el horario del grupo en Firestore
        const horarioRef = doc(db, "horarios_alumnos", grupo);
        const horarioSnap = await getDoc(horarioRef);

        if (!horarioSnap.exists()) {
            contenedor.innerHTML = "<div class='text-center' style='padding: 20px;'>No hay horario registrado para el grupo " + grupo + ".</div>";
            return;
        }

        const datosHorario = horarioSnap.data();
        
        // Días de la semana para iterar
        const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
        
        // Extraemos todas las horas únicas para crear las filas de la tabla
        let horasUnicas = new Set();
        diasSemana.forEach(dia => {
            if (datosHorario[dia]) {
                Object.keys(datosHorario[dia]).forEach(hora => horasUnicas.add(hora));
            }
        });

        // Ordenamos las horas de menor a mayor (ej. 08:00, 09:00, etc.)
        const horasOrdenadas = Array.from(horasUnicas).sort();

        if(horasOrdenadas.length === 0) {
            contenedor.innerHTML = "<div class='text-center'>Horario vacío.</div>";
            return;
        }

        // Construir la tabla HTML
        let html = `
            <table class="tabla-horario">
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Lunes</th>
                        <th>Martes</th>
                        <th>Miércoles</th>
                        <th>Jueves</th>
                        <th>Viernes</th>
                    </tr>
                </thead>
                <tbody>
        `;

        horasOrdenadas.forEach(hora => {
            html += `<tr><td class="col-hora">${hora}</td>`;
            
            diasSemana.forEach(dia => {
                if (datosHorario[dia] && datosHorario[dia][hora]) {
                    const clase = datosHorario[dia][hora];
                    html += `
                        <td class="clase-activa">
                            <span class="materia-text">${clase.materia}</span>
                            <span class="profe-text">👨‍🏫 ${clase.profesor}</span>
                            <br><span class="profe-text">📍 ${clase.salon}</span>
                        </td>
                    `;
                } else {
                    html += `<td class="clase-vacia">-</td>`;
                }
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        contenedor.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar horario:", error);
        contenedor.innerHTML = "<div style='color:red;'>Error al conectar con la base de datos de horarios.</div>";
    }
}