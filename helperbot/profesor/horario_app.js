// profesor/horario_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Cargar nombre del profe
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            document.getElementById('nombreUsuario').innerText = userSnap.data().nombre || "Profesor";
        }

        // Cargar el horario
        cargarHorario(user.uid);
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarHorario(uid) {
    const contenedor = document.getElementById('horarioContenedor');
    
    try {
        // Buscamos el horario del profesor en Firestore
        const horarioRef = doc(db, "horarios_profes", uid);
        const horarioSnap = await getDoc(horarioRef);

        if (!horarioSnap.exists()) {
            contenedor.innerHTML = "<div class='text-center' style='padding: 20px;'>No tienes un horario registrado para este periodo.</div>";
            return;
        }

        const datosHorario = horarioSnap.data();
        
        // Días de la semana para iterar
        const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
        
        // Extraemos todas las horas únicas
        let horasUnicas = new Set();
        diasSemana.forEach(dia => {
            if (datosHorario[dia]) {
                Object.keys(datosHorario[dia]).forEach(hora => horasUnicas.add(hora));
            }
        });

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
                            <span class="detalle-text"><span class="badge-grupo">${clase.grupo}</span></span>
                            <br><span class="detalle-text">📍 ${clase.salon}</span>
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
        console.error("Error al cargar horario del profe:", error);
        contenedor.innerHTML = "<div style='color:red;' class='text-center'>Error al conectar con la base de datos de horarios.</div>";
    }
}