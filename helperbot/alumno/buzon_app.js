document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    if (!session || session.rol !== 'alumno') {
        window.location.href = "../index.html";
        return;
    }

    document.getElementById('nombreUsuario').innerText = session.nombre;
    cargarHistorialLocal(session.id);

    // LÓGICA PARA ENVIAR EL TICKET
    document.getElementById('btnEnviarQueja').onclick = () => {
        const tipo = document.getElementById('tipoQueja').value;
        const descripcion = document.getElementById('descQueja').value.trim();

        if (descripcion === "") {
            alert("⚠️ Por favor, escribe los detalles de tu reporte.");
            return;
        }

        const ticketId = "TICKET-" + Math.floor(Math.random() * 100000);
        const fechaActual = new Date().toISOString().split('T')[0];

        const nuevaQueja = {
            id: ticketId,
            tipo: tipo,
            descripcion: descripcion,
            fecha: fechaActual,
            estatus: "Pendiente"
        };

        // Guardamos en LocalStorage para simular base de datos
        let quejasLocales = JSON.parse(localStorage.getItem(`siest_quejas_${session.id}`)) || [];
        quejasLocales.unshift(nuevaQueja); // Agregamos al inicio
        localStorage.setItem(`siest_quejas_${session.id}`, JSON.stringify(quejasLocales));

        alert("✅ Reporte enviado a la administración con éxito.");
        document.getElementById('descQueja').value = ""; 
        
        cargarHistorialLocal(session.id);
    };
});

function cargarHistorialLocal(idAlumno) {
    const tbody = document.getElementById('historialQuejas');
    let quejas = JSON.parse(localStorage.getItem(`siest_quejas_${idAlumno}`)) || [];

    if (quejas.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align: center; color: #666;'>No tienes ningún reporte activo.</td></tr>";
        return;
    }

    let html = "";
    quejas.forEach((q) => {
        html += `
            <tr>
                <td><strong><small>${q.id}</small></strong></td>
                <td>${q.fecha}</td>
                <td>
                    <strong>${q.tipo}</strong><br>
                    <small style="color: #555;">${q.descripcion}</small>
                </td>
                <td><span class="badge-pendiente">${q.estatus}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}