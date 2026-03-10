// components/helperbot/bot_logic.js
import { auth, db } from '../../js/firebase_config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function procesarMensajeIA(mensajeUsuario) {
    const msj = mensajeUsuario.toLowerCase();
    const user = auth.currentUser;

    if (!user) {
        return "⚠️ Necesitas iniciar sesión para que pueda buscar tus datos.";
    }

    // LÓGICA 1: Pregunta por calificaciones
    if (msj.includes("calificación") || msj.includes("calificacion") || msj.includes("calificaciones")) {
        
        // Extraemos palabras clave (ej. materia y cuatrimestre)
        // Para este ejemplo, asumiremos que busca "Proyecto Integrador II" en "cuatri_3"
        try {
            const kardexRef = doc(db, "kardex", user.uid);
            const kardexSnap = await getDoc(kardexRef);

            if (kardexSnap.exists()) {
                const datos = kardexSnap.data();
                
                // Aquí podrías hacer la búsqueda más dinámica leyendo el string del msj,
                // pero lo hardcodeamos para probar el flujo de las 3 unidades que pediste.
                const materia = datos.cuatri_3?.["Proyecto Integrador II"];

                if (materia) {
                    let respuesta = `Claro, de la materia **Proyecto Integrador II** tienes un promedio final de **${materia.calificacion_final}**. \n\nTus unidades son:\n`;
                    for (const [unidad, calif] of Object.entries(materia.unidades)) {
                        respuesta += `- ${unidad}: ${calif}\n`;
                    }
                    return respuesta;
                } else {
                    return "No encontré calificaciones para esa materia en tu cuatrimestre actual.";
                }
            } else {
                return "Aún no tienes un kardex registrado en el sistema.";
            }
        } catch (error) {
            console.error(error);
            return "❌ Hubo un error al consultar la base de datos de Control Escolar.";
        }
    }

    // LÓGICA 2: Preguntas de adeudos/pagos (se pueden agregar después)
    if (msj.includes("adeudo") || msj.includes("pagar")) {
        return "Todavía estoy aprendiendo a revisar el sistema financiero. ¡Pronto podré ayudarte con tus pagos!";
    }

    // Respuesta por defecto
    return "Soy tu Helperbot 🤖. Por ahora puedo ayudarte a consultar tus calificaciones. Prueba preguntando: '¿Cuál es mi calificación de Proyecto Integrador?'";
}