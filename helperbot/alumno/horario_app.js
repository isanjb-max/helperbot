document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    if (!session || session.rol !== 'alumno') {
        window.location.href = "../index.html";
        return;
    }

    document.getElementById('nombreUsuario').innerText = session.nombre;

    // Leemos los horarios
    const horariosDB = JSON.parse(localStorage.getItem('siest_horarios')) || {};
    const periodsBar = document.getElementById('periodsBar');

    const periodos = Object.keys(horariosDB);

    // Si el formato viejo es un array, mandamos error
    if (periodos.length === 0 || Array.isArray(horariosDB)) { 
        periodsBar.innerHTML = "<div class='loader-msg'>Por favor, cierra sesión y vuelve a entrar para actualizar el formato del horario.</div>";
        return;
    }

    periodsBar.innerHTML = "";
    let esPrimerPeriodo = true;

    periodos.forEach(grupoId => {
        const datosPeriodo = horariosDB[grupoId];
        
        const block = document.createElement('div');
        block.className = `period-block ${esPrimerPeriodo ? 'active' : ''}`;
        block.innerHTML = `
            <div class="group-name">${grupoId}</div>
            <div class="period-date">${datosPeriodo.periodo_texto}</div>
        `;

        block.onclick = () => {
            document.querySelectorAll('.period-block').forEach(b => b.classList.remove('active'));
            block.classList.add('active');
            pintarHorario(datosPeriodo.clases);
        };

        periodsBar.appendChild(block);

        if (esPrimerPeriodo) {
            pintarHorario(datosPeriodo.clases);
            esPrimerPeriodo = false;
        }
    });
});

function pintarHorario(clases) {
    const tbody = document.getElementById('horarioBody');
    
    if (!clases || clases.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' class='loader-msg'>No hay clases asignadas para este periodo.</td></tr>";
        return;
    }

    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    // Agrupar clases por hora y día
    const mapaHorario = {};
    let horasSet = new Set();

    clases.forEach(clase => {
        horasSet.add(clase.hora);
        if(!mapaHorario[clase.hora]) mapaHorario[clase.hora] = {};
        
        // Normalizamos el miércoles por si viene sin acento
        let diaNormalizado = clase.dia.replace("Miercoles", "Miércoles");
        mapaHorario[clase.hora][diaNormalizado] = clase;
    });

    const horasOrdenadas = Array.from(horasSet).sort();

    let html = "";

    horasOrdenadas.forEach(hora => {
        html += `<tr><td class="col-hora">${hora}</td>`;
        
        dias.forEach(dia => {
            const clase = mapaHorario[hora] ? mapaHorario[hora][dia] : null;
            if (clase) {
                // Si es la palabra RECESO, no le pintamos el nombre del profe
                const nombreMaestro = clase.materia === "RECESO" ? "Receso" : clase.maestro;
                html += `
                    <td>
                        <div class="class-card">
                            <div class="materia-name">${clase.materia}</div>
                            <div class="materia-teacher">${nombreMaestro}</div>
                        </div>
                    </td>
                `;
            } else {
                html += `<td></td>`;
            }
        });
        html += `</tr>`;
    });

    tbody.innerHTML = html;
}