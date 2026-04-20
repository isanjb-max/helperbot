// profesor/calificar_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const grupoURL = urlParams.get('grupo');
const materiaURL = urlParams.get('materia');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if(!grupoURL || !materiaURL) {
            alert("Error: No se seleccionó un grupo.");
            window.location.href = "inicio.html";
            return;
        }

        document.getElementById('lblGrupo').innerText = grupoURL;
        document.getElementById('lblMateria').innerText = materiaURL;

        cargarAlumnosParaCalificar(grupoURL);
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarAlumnosParaCalificar(grupoBuscado) {
    const tbody = document.getElementById('listaAlumnosBody');
    try {
        const q = query(collection(db, "usuarios"), where("rol", "==", "alumno"), where("grupo", "==", grupoBuscado));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='6' class='text-center'>No hay alumnos en este grupo.</td></tr>";
            return;
        }

        let html = "";
        let contador = 1;

        querySnapshot.forEach((docSnap) => {
            const alumno = docSnap.data();
            const uid = docSnap.id;
            
            html += `
                <tr class="fila-alumno" data-uid="${uid}">
                    <td>${contador}</td>
                    <td><strong>${alumno.nombre}</strong></td>
                    <td class="text-center"><input type="number" min="0" max="10" step="0.1" class="input-calif u1_${uid}" placeholder="0.0"></td>
                    <td class="text-center"><input type="number" min="0" max="10" step="0.1" class="input-calif u2_${uid}" placeholder="0.0"></td>
                    <td class="text-center"><input type="number" min="0" max="10" step="0.1" class="input-calif u3_${uid}" placeholder="0.0"></td>
                    <td class="text-center"><input type="number" min="0" max="10" step="0.1" class="input-calif final_${uid}" placeholder="0.0" readonly style="background:#eee; font-weight:bold;"></td>
                </tr>
            `;
            contador++;
        });

        tbody.innerHTML = html;

        // Agregar evento para auto-calcular el promedio cuando el profe escriba
        document.querySelectorAll('.input-calif').forEach(input => {
            input.addEventListener('input', (e) => calcularPromedio(e.target.className));
        });

    } catch (error) {
        console.error("Error al buscar alumnos:", error);
        tbody.innerHTML = "<tr><td colspan='6' style='color:red;' class='text-center'>Error de conexión.</td></tr>";
    }
}

function calcularPromedio(className) {
    // Extraer el UID de la clase del input (ej. u1_hG8fJs...)
    const clases = className.split(' ');
    const idClase = clases.find(c => c.startsWith('u1_') || c.startsWith('u2_') || c.startsWith('u3_'));
    if (!idClase) return;
    
    const uid = idClase.split('_')[1];
    
    const u1 = parseFloat(document.querySelector(`.u1_${uid}`).value) || 0;
    const u2 = parseFloat(document.querySelector(`.u2_${uid}`).value) || 0;
    const u3 = parseFloat(document.querySelector(`.u3_${uid}`).value) || 0;
    
    // Suponiendo que las 3 unidades valen lo mismo
    let promedio = (u1 + u2 + u3) / 3;
    document.querySelector(`.final_${uid}`).value = promedio.toFixed(1);
}

// LÓGICA PARA GUARDAR EN KARDEX (FIRESTORE)
document.getElementById('btnGuardarCalif').onclick = async () => {
    const btn = document.getElementById('btnGuardarCalif');
    btn.innerText = "Guardando..."; btn.disabled = true;

    const filas = document.querySelectorAll('.fila-alumno');
    let promesasGuardado = [];

    filas.forEach(fila => {
        const uid = fila.getAttribute('data-uid');
        
        const u1 = parseFloat(document.querySelector(`.u1_${uid}`).value) || 0;
        const u2 = parseFloat(document.querySelector(`.u2_${uid}`).value) || 0;
        const u3 = parseFloat(document.querySelector(`.u3_${uid}`).value) || 0;
        const final = parseFloat(document.querySelector(`.final_${uid}`).value) || 0;

        // Armamos el objeto exactamente como lo espera el Helperbot del alumno
        const datosKardex = {
            cuatri_3: {
                [materiaURL]: {
                    calificacion_final: final,
                    unidades: {
                        "Unidad 1": u1,
                        "Unidad 2": u2,
                        "Unidad 3": u3
                    }
                }
            }
        };

        // Guardamos en Firestore. 'merge: true' es VITAL para no borrarle sus otras materias.
        const kardexRef = doc(db, "kardex", uid);
        promesasGuardado.push(setDoc(kardexRef, datosKardex, { merge: true }));
    });

    try {
        await Promise.all(promesasGuardado); // Esperamos a que se suban todas las de los alumnos
        alert("✅ Calificaciones subidas al Kardex exitosamente.");
        window.location.href = "inicio.html";
    } catch (error) {
        console.error("Error al guardar calificaciones:", error);
        alert("❌ Ocurrió un error al guardar.");
        btn.innerText = "💾 Subir Calificaciones a Control Escolar"; btn.disabled = false;
    }
};