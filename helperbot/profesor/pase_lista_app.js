// profesor/pase_lista_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Leer los parámetros de la URL (ej. ?grupo=DSM51&materia=Matematicas)
const urlParams = new URLSearchParams(window.location.search);
const grupoURL = urlParams.get('grupo');
const materiaURL = urlParams.get('materia');

// Poner la fecha de hoy por defecto
document.getElementById('fechaAsistencia').valueAsDate = new Date();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if(!grupoURL || !materiaURL) {
            alert("Error: No se seleccionó un grupo.");
            window.location.href = "inicio.html";
            return;
        }

        document.getElementById('lblGrupo').innerText = grupoURL;
        document.getElementById('lblMateria').innerText = materiaURL;

        cargarAlumnosDelGrupo(grupoURL);
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarAlumnosDelGrupo(grupoBuscado) {
    const tbody = document.getElementById('listaAlumnosBody');
    try {
        // Consultar a Firestore: Buscar alumnos de ese grupo
        const q = query(collection(db, "usuarios"), where("rol", "==", "alumno"), where("grupo", "==", grupoBuscado));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No hay alumnos registrados en este grupo.</td></tr>";
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
                    <td style="text-align: center;"><input type="radio" name="asist_${uid}" value="presente" checked style="transform: scale(1.5);"></td>
                    <td style="text-align: center;"><input type="radio" name="asist_${uid}" value="falta" style="transform: scale(1.5);"></td>
                </tr>
            `;
            contador++;
        });

        tbody.innerHTML = html;

    } catch (error) {
        console.error("Error al buscar alumnos:", error);
        tbody.innerHTML = "<tr><td colspan='4' style='color:red;'>Error de conexión con la base de datos.</td></tr>";
    }
}

// LÓGICA PARA GUARDAR EN LA BASE DE DATOS
document.getElementById('btnGuardarLista').onclick = async () => {
    const fecha = document.getElementById('fechaAsistencia').value;
    if(!fecha) return alert("Selecciona una fecha válida.");

    const btn = document.getElementById('btnGuardarLista');
    btn.innerText = "Guardando..."; btn.disabled = true;

    const filas = document.querySelectorAll('.fila-alumno');
    let registroDiario = {};

    filas.forEach(fila => {
        const uid = fila.getAttribute('data-uid');
        const opciones = document.getElementsByName(`asist_${uid}`);
        let valorSeleccionado = "presente";
        
        opciones.forEach(radio => {
            if(radio.checked) valorSeleccionado = radio.value;
        });

        registroDiario[uid] = valorSeleccionado;
    });

    try {
        // Guardar en Firestore: Colección 'asistencias' -> Doc 'DSM51' -> Subcolección 'Proyecto Integrador II' -> Doc '2026-03-05'
        // Es una estructura súper limpia y fácil de leer para el Helperbot después
        const asistenciaRef = doc(db, "asistencias", grupoURL, materiaURL, fecha);
        await setDoc(asistenciaRef, { records: registroDiario });

        alert("✅ Pase de lista guardado exitosamente.");
        window.location.href = "inicio.html"; // Regresar al menú
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        alert("❌ Error al guardar. Revisa tu conexión.");
        btn.innerText = "💾 Guardar Asistencia"; btn.disabled = false;
    }
};