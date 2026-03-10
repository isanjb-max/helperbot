// profesor/profesor_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Obtener datos del profesor
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            document.getElementById('nombreUsuario').innerText = userSnap.data().nombre || "Profe";
        }

        // 2. Cargar sus grupos desde su horario
        cargarGruposProfesor(user.uid);
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarGruposProfesor(uid) {
    const contenedor = document.querySelector('.grid-grupos');
    contenedor.innerHTML = "<div class='loader'>Cargando tus grupos...</div>";

    try {
        const horarioRef = doc(db, "horarios_profes", uid);
        const horarioSnap = await getDoc(horarioRef);

        if (horarioSnap.exists()) {
            const datosHorario = horarioSnap.data();
            contenedor.innerHTML = ""; // Limpiamos

            // Usamos un Set para no repetir grupos si les da clase varios días
            const clasesUnicas = new Set();
            
            // Recorremos los días (Lunes, Martes...)
            for (const dia in datosHorario) {
                for (const hora in datosHorario[dia]) {
                    const clase = datosHorario[dia][hora];
                    // Formato: "DSM51|Proyecto Integrador II|Lab A"
                    clasesUnicas.add(`${clase.grupo}|${clase.materia}|${clase.salon}`);
                }
            }

            if (clasesUnicas.size === 0) {
                contenedor.innerHTML = "<p>No tienes clases asignadas este periodo.</p>";
                return;
            }

            // Pintar las tarjetas
            clasesUnicas.forEach(item => {
                const [grupo, materia, salon] = item.split('|');
                
                const card = document.createElement('div');
                card.className = "card-grupo-profe"; // Clase que ya está en tu style.css
                card.innerHTML = `
                    <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #004080; font-size: 18px;">${materia}</h3>
                            <span style="background: #f39c12; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">${grupo}</span>
                        </div>
                        <p style="color: #666; font-size: 14px; margin-bottom: 15px;"><i class="fa-solid fa-location-dot"></i> Salón: ${salon}</p>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.location.href='pase_lista.html?grupo=${grupo}&materia=${materia}'" style="flex: 1; background: #27ae60; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">📋 Pasar Lista</button>
                            <button onclick="window.location.href='calificar.html?grupo=${grupo}&materia=${materia}'" style="flex: 1; background: #2980b9; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">💯 Calificar</button>
                        </div>
                    </div>
                `;
                contenedor.appendChild(card);
            });

        } else {
            contenedor.innerHTML = "<p>No se encontró tu horario en la base de datos.</p>";
        }
    } catch (error) {
        console.error("Error al cargar grupos:", error);
        contenedor.innerHTML = "<p style='color:red;'>Error al conectar con Control Escolar.</p>";
    }
}