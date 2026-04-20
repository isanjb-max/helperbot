document.addEventListener('DOMContentLoaded', async () => {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    if (!session || session.rol !== 'alumno') {
        window.location.href = "../index.html";
        return;
    }

    document.getElementById('nombreUsuario').innerText = session.nombre;
    await cargarFinanzasLocales(session.id);
});

async function cargarFinanzasLocales(idAlumno) {
    const tbodyAdeudos = document.getElementById('tablaAdeudos');
    const tbodyPagos = document.getElementById('tablaHistorialPagos');
    const alertaContainer = document.getElementById('alertaAdeudosContainer');

    try {
        const response = await fetch('../data/mock_db.json');
        const db = await response.json();
        
        const finanzasUsuario = db.finanzas ? db.finanzas[idAlumno] : null;

        let adeudos = finanzasUsuario ? finanzasUsuario.adeudos : [];
        let pagos = finanzasUsuario ? finanzasUsuario.pagos_realizados : [];

        // 1. Renderizar Adeudos
        let htmlAdeudos = "";
        let totalDeuda = 0;

        if (!adeudos || adeudos.length === 0) {
            htmlAdeudos = "<tr><td colspan='4' class='text-center' style='color: #27ae60; font-weight: bold;'>¡Excelente! No tienes adeudos pendientes.</td></tr>";
        } else {
            adeudos.forEach((adeudo) => {
                const montoStr = `$${adeudo.monto.toFixed(2)}`;
                totalDeuda += adeudo.monto;
                
                htmlAdeudos += `
                    <tr>
                        <td><strong>${adeudo.concepto}</strong></td>
                        <td>${adeudo.fecha_limite || "Inmediata"}</td>
                        <td class="monto-deuda">${montoStr}</td>
                        <td class="text-center"><button class="btn-pagar" onclick="alert('Redirigiendo a pasarela de pago para folio: ${adeudo.id}')">💳 Pagar en línea</button></td>
                    </tr>
                `;
            });
            
            alertaContainer.innerHTML = `
                <div class="alerta-deuda">
                    <i class="fa-solid fa-triangle-exclamation"></i> 
                    <strong>Aviso importante:</strong> Tienes un saldo pendiente total de <strong>$${totalDeuda.toFixed(2)}</strong>. Recuerda que los adeudos pueden bloquear tu reinscripción.
                </div>
            `;
        }
        tbodyAdeudos.innerHTML = htmlAdeudos;

        // 2. Renderizar Historial de Pagos
        let htmlPagos = "";
        
        if (!pagos || pagos.length === 0) {
            htmlPagos = "<tr><td colspan='4' class='text-center'>No hay pagos registrados en este cuatrimestre.</td></tr>";
        } else {
            pagos.forEach((pago) => {
                htmlPagos += `
                    <tr>
                        <td><small>${pago.folio}</small></td>
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
        tbodyAdeudos.innerHTML = "<tr><td colspan='4' style='color:red;' class='text-center'>Error al leer la base de datos local.</td></tr>";
    }
}