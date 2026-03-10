// alumno/pagos_app.js
import { auth, db } from '../js/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let usuarioActual = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioActual = user;
        
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            document.getElementById('nombreUsuario').innerText = userSnap.data().nombre;
        }

        cargarFinanzas();
    } else {
        window.location.href = "../index.html";
    }
});

async function cargarFinanzas() {
    const tbodyAdeudos = document.getElementById('tablaAdeudos');
    const tbodyPagos = document.getElementById('tablaHistorialPagos');
    const alertaContainer = document.getElementById('alertaAdeudosContainer');

    try {
        // 1. Cargar Adeudos
        const adeudosRef = collection(db, "finanzas", usuarioActual.uid, "adeudos");
        const snapAdeudos = await getDocs(adeudosRef);
        
        let htmlAdeudos = "";
        let totalDeuda = 0;

        if (snapAdeudos.empty) {
            htmlAdeudos = "<tr><td colspan='4' class='text-center' style='color: #27ae60; font-weight: bold;'>¡Excelente! No tienes adeudos pendientes.</td></tr>";
        } else {
            snapAdeudos.forEach((docSnap) => {
                const adeudo = docSnap.data();
                const montoStr = `$${adeudo.monto.toFixed(2)}`;
                totalDeuda += adeudo.monto;
                
                htmlAdeudos += `
                    <tr>
                        <td><strong>${adeudo.concepto}</strong></td>
                        <td>${adeudo.fecha_limite || "Inmediata"}</td>
                        <td class="monto-deuda">${montoStr}</td>
                        <td class="text-center"><button class="btn-pagar" onclick="alert('Redirigiendo a pasarela de pago para folio: ${docSnap.id}')">💳 Pagar en línea</button></td>
                    </tr>
                `;
            });
            
            // Mostrar alerta roja arriba si debe dinero
            alertaContainer.innerHTML = `
                <div class="alerta-deuda">
                    <i class="fa-solid fa-triangle-exclamation"></i> 
                    <strong>Aviso importante:</strong> Tienes un saldo pendiente total de <strong>$${totalDeuda.toFixed(2)}</strong>. Recuerda que los adeudos pueden bloquear tu reinscripción.
                </div>
            `;
        }
        tbodyAdeudos.innerHTML = htmlAdeudos;

        // 2. Cargar Historial de Pagos
        const pagosRef = collection(db, "finanzas", usuarioActual.uid, "pagos_realizados");
        const snapPagos = await getDocs(pagosRef);
        
        let htmlPagos = "";
        
        if (snapPagos.empty) {
            htmlPagos = "<tr><td colspan='4' class='text-center'>No hay pagos registrados en este cuatrimestre.</td></tr>";
        } else {
            snapPagos.forEach((docSnap) => {
                const pago = docSnap.data();
                
                htmlPagos += `
                    <tr>
                        <td><small>${docSnap.id}</small></td>
                        <td>${pago.concepto}</td>
                        <td>${pago.fecha_pago}</td>
                        <td class="monto-pagado">$${pago.monto.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        tbodyPagos.innerHTML = htmlPagos;

    } catch (error) {
        console.error("Error al cargar finanzas:", error);
        tbodyAdeudos.innerHTML = "<tr><td colspan='4' style='color:red;' class='text-center'>Error al conectar con el servidor financiero.</td></tr>";
        tbodyPagos.innerHTML = "<tr><td colspan='4' style='color:red;' class='text-center'>Error al conectar con el servidor financiero.</td></tr>";
    }
}