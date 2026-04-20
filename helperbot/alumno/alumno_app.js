document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    if (!session || session.rol !== 'alumno') {
        window.location.href = "../index.html";
        return;
    }

    console.log("Cargando horario de manera local...");
    document.getElementById('nombreUsuario').innerText = session.nombre;
});