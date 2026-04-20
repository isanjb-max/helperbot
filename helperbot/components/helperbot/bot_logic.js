// components/helperbot/bot_logic.js

const LM_STUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions";

async function recuperarContextoRAG(mensajeUsuario) {
    try {
        const response = await fetch('../data/knowledge_base.json');
        const knowledgeBase = await response.json();
        const mensajeLower = mensajeUsuario.toLowerCase();
        let contextoEncontrado = "";

        knowledgeBase.forEach(item => {
            if (item.keywords.some(kw => mensajeLower.includes(kw))) {
                contextoEncontrado += item.info + "\n";
            }
        });
        return contextoEncontrado;
    } catch (e) {
        console.error("Error cargando RAG:", e);
        return "";
    }
}

export async function procesarMensajeIA(mensajeUsuario) {
    const session = JSON.parse(localStorage.getItem('siest_session'));
    const calificaciones = JSON.parse(localStorage.getItem('siest_calificaciones')) || [];
    const horarios = JSON.parse(localStorage.getItem('siest_horarios')) || [];
    const finanzas = JSON.parse(localStorage.getItem('siest_finanzas')) || {adeudos: [], pagos_realizados: []};

    if (!session) return "⚠️ Necesitas iniciar sesión para que busque tus datos.";

    const contextoRAG = await recuperarContextoRAG(mensajeUsuario);
    let instruccionRAG = "";
    if (contextoRAG !== "") {
        instruccionRAG = `\nINFORMACIÓN INSTITUCIONAL RELEVANTE:\n${contextoRAG}`;
    }

    const systemPrompt = `
        Eres Helperbot, el asistente oficial de la Universidad Tecnológica de la Costa (UT Costa). 
        Hablas con el alumno: ${session.nombre} (${session.carrera}).
        
        Datos exactos del alumno en el sistema:
        - Calificaciones: ${JSON.stringify(calificaciones)}
        - Horario: ${JSON.stringify(horarios)}
        - Finanzas: ${JSON.stringify(finanzas)}
        ${instruccionRAG}

        REGLAS ESTRICTAS (OBLIGATORIAS):
        1. Responde basándote ÚNICAMENTE en los datos de arriba.
        2. Si te preguntan por pagos, diles que se hace en la sección "Pagos" o en Control Escolar. NUNCA inventes bancos.
        3. Si no sabes algo, responde: "Acude a Control Escolar para revisar esa información".
        4. MODERACIÓN Y RESPETO: Si el alumno usa groserías o insulta, TIENES PROHIBIDO ayudarle. Mándale un mensaje firme recordándole que debe usar un lenguaje respetuoso.
    `;

    // 🧠 MAGIA DE LA MEMORIA: Leemos el historial completo del chat
    const historialGuardado = JSON.parse(sessionStorage.getItem('siest_chat_history')) || [];
    
    // Ignoramos el saludo inicial para ahorrar tokens
    const historialFiltrado = historialGuardado.filter(msg => !msg.text.includes('Soy tu asistente de la UT Costa'));

    // Construimos el arreglo de mensajes como lo pide la API (system, luego el historial intercalado entre user y assistant)
    const mensajesParaIA = [
        { role: "system", content: systemPrompt }
    ];

    historialFiltrado.forEach(msg => {
        mensajesParaIA.push({
            // La IA entiende "assistant", no "bot"
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.text
        });
    });

    // Enviar TODO el historial a LM Studio
    try {
        const response = await fetch(LM_STUDIO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "local-model",
                messages: mensajesParaIA,
                temperature: 0.1, 
                max_tokens: 500
            })
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Error conectando a LM Studio:", error);
        return "❌ Error conectando a LM Studio. Asegúrate de encender el servidor local (puerto 1234) y activar CORS.";
    }
}