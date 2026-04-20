// profesor/pase_lista_app.js

document.addEventListener("DOMContentLoaded", () => {
    const usuarioString = localStorage.getItem('usuarioActivo');
    if (!usuarioString) {
        window.location.href = "../index.html";
        return;
    }
    
    const usuario = JSON.parse(usuarioString);
    if (usuario.rol !== "profesor") {
        window.location.href = "../index.html";
        return;
    }

    // Extraer variables de la URL
    const parametros = new URLSearchParams(window.location.search);
    const grupo = parametros.get('grupo');
    const materia = parametros.get('materia');

    if (!grupo || !materia) {
        alert("⚠️ No se especificó el grupo o la materia.");
        window.location.href = "inicio.html";
        return;
    }

    // Pintar el título si tienes un ID en tu HTML para ello (ajusta el ID si es necesario)
    const tituloElement = document.getElementById('tituloPaseLista');
    if (tituloElement) {
        tituloElement.innerText = `Pase de Lista - ${materia} (${grupo})`;
    }

    cargarListaAlumnos(grupo, materia);
});

async function cargarListaAlumnos(grupo, materia) {
    // Asumo que tienes un div o tbody con el id 'listaAlumnos' en tu HTML
    const contenedor = document.getElementById('listaAlumnos'); 
    if(!contenedor) return;

    contenedor.innerHTML = "<div class='loader'>Cargando alumnos de la base de datos...</div>";

    try {
        // Petición al backend para traer solo a los alumnos de este grupo
        const response = await fetch(`http://localhost:3000/api/alumnos/grupo/${grupo}`);
        const alumnos = await response.json();

        if (alumnos.length === 0) {
            contenedor.innerHTML = "<p>No hay alumnos registrados en este grupo.</p>";
            return;
        }

        // Creamos un formulario dinámico
        let html = `<form id="formAsistencia" onsubmit="event.preventDefault(); guardarAsistencia('${materia}');">`;
        
        alumnos.forEach((alumno, index) => {
            html += `
                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ccc;">
                    <span><strong>${index + 1}.</strong> ${alumno.nombre}</span>
                    <div>
                        <label style="margin-right: 15px; cursor: pointer; color: #27ae60;">
                            <input type="radio" name="asistencia_${alumno.id}" value="presente" checked> Presente
                        </label>
                        <label style="cursor: pointer; color: #c0392b;">
                            <input type="radio" name="asistencia_${alumno.id}" value="falta"> Falta
                        </label>
                    </div>
                </div>
            `;
        });

        html += `
            <button type="submit" style="margin-top: 20px; width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
                💾 Guardar Asistencia
            </button>
        </form>`;

        contenedor.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar alumnos:", error);
        contenedor.innerHTML = "<p style='color:red;'>Error al cargar la lista.</p>";
    }
}

// Función que se ejecuta al enviar el formulario
window.guardarAsistencia = async function(materia) {
    const form = document.getElementById('formAsistencia');
    const formData = new FormData(form);
    const asistencias = [];

    // Extraer los IDs de los alumnos y si tienen falta o asistencia
    for (let [name, value] of formData.entries()) {
        if (name.startsWith('asistencia_')) {
            const alumnoId = name.split('_')[1];
            asistencias.push({
                alumno_id: parseInt(alumnoId),
                estatus: value
            });
        }
    }

    try {
        // Enviamos el bloque completo de datos al servidor
        const response = await fetch('http://localhost:3000/api/asistencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ materia: materia, asistencias: asistencias })
        });

        if (response.ok) {
            alert("✅ Asistencia guardada correctamente");
            window.location.href = "inicio.html"; // Lo regresamos al panel
        } else {
            throw new Error("Error del servidor al guardar");
        }
    } catch (error) {
        console.error(error);
        alert("❌ Ocurrió un error al guardar la asistencia.");
    }
}