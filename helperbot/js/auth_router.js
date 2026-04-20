window.iniciarSesion = async function() {
    const email = document.getElementById('matricula').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (!email || !pass) {
        alert("⚠️ Por favor, ingresa tu usuario y contraseña.");
        return;
    }

    try {
        const response = await fetch('data/mock_db.json');
        const db = await response.json();
        const usuario = db.usuarios.find(u => u.correo === email && u.password === pass);

        if (usuario) {
            const sessionData = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, carrera: usuario.carrera };
            localStorage.setItem('siest_session', JSON.stringify(sessionData));
            
            if (usuario.rol === "alumno") {
                localStorage.setItem('siest_calificaciones', JSON.stringify(db.calificaciones[usuario.id] || []));
                localStorage.setItem('siest_horarios', JSON.stringify(db.horarios[usuario.id] || []));
                
                // 🔥 NUEVO: Guardamos las finanzas para que el bot las vea 🔥
                const finanzasUsuario = db.finanzas ? db.finanzas[usuario.id] : null;
                localStorage.setItem('siest_finanzas', JSON.stringify(finanzasUsuario || {adeudos: [], pagos_realizados: []}));
                
                window.location.href = "alumno/inicio.html";
            } else if (usuario.rol === "profesor") {
                window.location.href = "profesor/inicio.html";
            }
        } else {
            alert("❌ Credenciales incorrectas o usuario no encontrado.");
        }
    } catch (error) {
        console.error("Error BD:", error);
        alert("❌ Error de conexión local.");
    }
};

window.cerrarSesion = function() {
    localStorage.clear();
    sessionStorage.clear(); // Limpiamos también el historial del chat
    window.location.href = "../index.html";
};

document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    const path = window.location.pathname;
    if (session && (path.endsWith("index.html") || path.endsWith("/"))) {
        window.location.href = session.rol === "alumno" ? "alumno/inicio.html" : "profesor/inicio.html";
    }
});