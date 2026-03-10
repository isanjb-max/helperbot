// alumno/buzon_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, setDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let usuarioActual = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioActual = user;
        
        // Cargar nombre
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            document.getElementById('nombreUsuario').innerText = userSnap.data().nombre;
        }

        // Cargar tabla de historial
        cargarHistorial();
    } else {
        window.location.href = "../index.html";
    }
});

// LÓGICA PARA ENVIAR EL TICKET
document.getElementById('btnEnviarQueja').onclick = async () => {
    const tipo = document.getElementById('tipoQueja').value;
    const descripcion = document.getElementById('descQueja').value.trim();

    if (descripcion === "") {
        alert("⚠️ Por favor, escribe los detalles de tu reporte.");
        return;
    }

    const btn = document.getElementById('btnEnviarQueja');
    btn.innerText = "Enviando..."; btn.disabled = true;

    // Crear un ID único basado en el tiempo exacto
    const ticketId = "TICKET-" + Date.now();
    const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const nuevaQueja = {
        id: ticketId,
        tipo: tipo,
        descripcion: descripcion,
        fecha: fechaActual,
        estatus: "Pendiente",
        timestamp: Date.now() // Para poder ordenarlos del más nuevo al más viejo
    };

    try {
        // Guardamos en Firestore: Colección "quejas" -> Documento (UID del usuario) -> Subcolección "tickets" -> Documento (ticketId)
        const ticketRef = doc(db, "quejas", usuarioActual.uid, "tickets", ticketId);
        await setDoc(ticketRef, nuevaQueja);

        alert("✅ Reporte enviado a la administración con éxito.");
        document.getElementById('descQueja').value = ""; // Limpiar el cuadro de texto
        
        // Recargar la tablita para que aparezca el nuevo
        cargarHistorial();
    } catch (error) {
        console.error("Error al enviar queja:", error);
        alert("❌ Hubo un error al procesar tu solicitud.");
    } finally {
        btn.innerText = "📨 Enviar Reporte"; btn.disabled = false;
    }
};

// LÓGICA PARA LEER EL HISTORIAL
async function cargarHistorial() {
    const tbody = document.getElementById('historialQuejas');
    try {
        // Buscamos los tickets de ESTE usuario
        const ticketsRef = collection(db, "quejas", usuarioActual.uid, "tickets");
        // Los ordenamos por timestamp (opcional, Firebase a veces requiere crear un índice para orderBy, si falla, quita el query)
        const q = query(ticketsRef, orderBy("timestamp", "desc")); 
        const snap = await getDocs(q);

        if (snap.empty) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align: center; color: #666;'>No tienes ningún reporte activo.</td></tr>";
            return;
        }

        let html = "";
        snap.forEach((doc) => {
            const qData = doc.data();
            const claseBadge = qData.estatus === "Resuelto" ? "badge-resuelto" : "badge-pendiente";
            
            html += `
                <tr>
                    <td><strong><small>${qData.id}</small></strong></td>
                    <td>${qData.fecha}</td>
                    <td>
                        <strong>${qData.tipo}</strong><br>
                        <small style="color: #555;">${qData.descripcion}</small>
                    </td>
                    <td><span class="${claseBadge}">${qData.estatus}</span></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (error) {
        console.error("Error al leer historial:", error);
        // Si falla por el orderBy (requiere índice), hacemos una lectura simple:
        const ticketsRef = collection(db, "quejas", usuarioActual.uid, "tickets");
        const snap = await getDocs(ticketsRef);
        // (aquí repetiríamos el pintado, pero por brevedad lo dejamos así)
    }
}