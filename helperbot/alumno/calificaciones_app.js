document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    if (!session || session.rol !== 'alumno') {
        window.location.href = "../index.html";
        return;
    }

    document.getElementById('nombreUsuario').innerText = session.nombre;

    // Leemos las calificaciones con la nueva estructura de periodos
    const calificacionesDB = JSON.parse(localStorage.getItem('siest_calificaciones')) || {};
    const periodsBar = document.getElementById('periodsBar');

    const periodos = Object.keys(calificacionesDB);

    if (periodos.length === 0) {
        periodsBar.innerHTML = "<div class='loader-msg'>No hay periodos registrados en tu historial.</div>";
        return;
    }

    // 1. Pintar la barra superior de Periodos (DSM51, DSM41, etc.)
    periodsBar.innerHTML = "";
    let esPrimerPeriodo = true;

    periodos.forEach(grupoId => {
        const datosPeriodo = calificacionesDB[grupoId];
        
        const block = document.createElement('div');
        block.className = `period-block ${esPrimerPeriodo ? 'active' : ''}`;
        block.innerHTML = `
            <div class="group-name">${grupoId}</div>
            <div class="period-date">${datosPeriodo.periodo_texto}</div>
        `;

        block.onclick = () => {
            document.querySelectorAll('.period-block').forEach(b => b.classList.remove('active'));
            block.classList.add('active');
            pintarAsignaturas(datosPeriodo.materias);
        };

        periodsBar.appendChild(block);

        // Auto-cargar el primer periodo al entrar a la página
        if (esPrimerPeriodo) {
            pintarAsignaturas(datosPeriodo.materias);
            esPrimerPeriodo = false;
        }
    });
});

// 2. Pintar la barra lateral de Asignaturas
function pintarAsignaturas(materias) {
    const subjectList = document.getElementById('subjectList');
    const instrumentsBody = document.getElementById('instrumentsBody');
    subjectList.innerHTML = "";

    if (!materias || materias.length === 0) {
        subjectList.innerHTML = "<div class='loader-msg'>No hay asignaturas en este periodo.</div>";
        instrumentsBody.innerHTML = "";
        return;
    }

    let esPrimeraMateria = true;

    materias.forEach(materia => {
        const item = document.createElement('div');
        item.className = `subject-item ${esPrimeraMateria ? 'active' : ''}`;
        
        // Ícono simulando la foto del maestro
        item.innerHTML = `
            <div class="subject-icon"><i class="fa-solid fa-user"></i></div>
            <div class="subject-info">
                <div class="subject-name">${materia.nombre}</div>
                <div class="subject-teacher">${materia.profesor}</div>
            </div>
        `;

        item.onclick = () => {
            document.querySelectorAll('.subject-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            pintarInstrumentos(materia.unidades);
        };

        subjectList.appendChild(item);

        if (esPrimeraMateria) {
            pintarInstrumentos(materia.unidades);
            esPrimeraMateria = false;
        }
    });
}

// 3. Pintar la tabla detallada de Instrumentos y Unidades
function pintarInstrumentos(unidades) {
    const tbody = document.getElementById('instrumentsBody');
    let html = "";

    if (!unidades || unidades.length === 0) {
        tbody.innerHTML = "<div class='loader-msg'>Las calificaciones de esta asignatura aún no han sido capturadas por el docente.</div>";
        return;
    }

    unidades.forEach(unidad => {
        // Fila de la Unidad Principal
        html += `
            <div class="unit-row">
                <div class="col-name">${unidad.nombre}</div>
                <div class="col-weight"></div>
                <div class="col-grade">${unidad.calificacion_total ? unidad.calificacion_total.toFixed(1) : '-'}</div>
                <div class="col-level">${unidad.nivel || 'Ordinario'}</div>
            </div>
        `;

        // Filas de los Instrumentos (Métrica, Examen, etc.)
        if (unidad.instrumentos) {
            unidad.instrumentos.forEach(inst => {
                const calif = inst.calificacion ? inst.calificacion.toFixed(1) : '';
                html += `
                    <div class="instrument-row">
                        <div class="col-name">+ ${inst.nombre}</div>
                        <div class="col-weight">${inst.ponderacion}</div>
                        <div class="col-grade">${calif}</div>
                        <div class="col-level"></div>
                    </div>
                `;
            });
        }
    });

    tbody.innerHTML = html;
}