// profesor/calificar_app.js

document.addEventListener("DOMContentLoaded", () => {
    const usuarioString = localStorage.getItem('usuarioActivo');
    if (!usuarioString) { window.location.href = "../index.html"; return; }
    
    const usuario = JSON.parse(usuarioString);
    if (usuario.rol !== "profesor") { window.location.href = "../index.html"; return; }

    const parametros = new URLSearchParams(window.location.search);
    const grupo = parametros.get('grupo');
    const materia = parametros.get('materia');

    document.getElementById('lblGrupo').innerText = grupo;
    document.getElementById('lblMateria').innerText = materia;

    cargarAlumnosParaCalificar(grupo);
});

async function cargarAlumnosParaCalificar(grupo) {
    const tbody = document.getElementById('listaAlumnosBody');
    const res = await fetch(`http://localhost:3000/api/alumnos/grupo/${grupo}`);
    const alumnos = await res.json();

    let html = "";
    alumnos.forEach((al, index) => {
        html += `
            <tr data-uid="${al.id}">
                <td>${index + 1}</td>
                <td><strong>${al.nombre}</strong></td>
                <td><input type="number" class="input-calif u1" oninput="calcularFila(this)" placeholder="0"></td>
                <td><input type="number" class="input-calif u2" oninput="calcularFila(this)" placeholder="0"></td>
                <td><input type="number" class="input-calif u3" oninput="calcularFila(this)" placeholder="0"></td>
                <td><input type="number" class="input-calif final" readonly style="background:#eee;"></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.calcularFila = (el) => {
    const fila = el.closest('tr');
    const u1 = parseFloat(fila.querySelector('.u1').value) || 0;
    const u2 = parseFloat(fila.querySelector('.u2').value) || 0;
    const u3 = parseFloat(fila.querySelector('.u3').value) || 0;
    fila.querySelector('.final').value = ((u1 + u2 + u3) / 3).toFixed(1);
};

document.getElementById('btnGuardarCalif').onclick = async () => {
    const materia = document.getElementById('lblMateria').innerText;
    const filas = document.querySelectorAll('#listaAlumnosBody tr');
    const datos = Array.from(filas).map(f => ({
        alumno_id: f.dataset.uid,
        u1: f.querySelector('.u1').value,
        u2: f.querySelector('.u2').value,
        u3: f.querySelector('.u3').value,
        final: f.querySelector('.final').value
    }));

    await fetch('http://localhost:3000/api/calificaciones/subir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia, calificaciones: datos })
    });

    alert("✅ Calificaciones guardadas en PostgreSQL");
    window.location.href = "inicio.html";
};