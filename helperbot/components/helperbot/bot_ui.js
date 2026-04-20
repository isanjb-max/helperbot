// components/helperbot/bot_ui.js
import { procesarMensajeIA } from './bot_logic.js';

// 1. Inyectar el CSS
const linkCss = document.createElement('link');
linkCss.rel = 'stylesheet';
linkCss.href = '../components/helperbot/bot_style.css';
document.head.appendChild(linkCss);

// 2. Crear estructura Fija
const botHTML = `
    <div class="helperbot-fixed-container" id="botContainer">
        <div class="helperbot-header" id="botHeader" title="Clic para Minimizar/Maximizar">
            <i class="fa-solid fa-robot" style="color: #8cc63f;"></i>
            <span style="flex: 1;">Asistente SIEST</span>
            <button id="btnToggleBot" class="btn-limpiar"><i class="fa-solid fa-window-minimize"></i></button>
            <button id="btnClearChat" class="btn-limpiar" title="Borrar historial"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="helperbot-messages" id="botMessages"></div>
        <div class="helperbot-input-area">
            <input type="text" id="botInput" placeholder="Escribe tu duda aquí...">
            <button id="btnSendBot">Enviar</button>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', botHTML);

// 3. Referencias
const botContainer = document.getElementById('botContainer');
const botHeader = document.getElementById('botHeader');
const btnToggleBot = document.getElementById('btnToggleBot');
const botMessages = document.getElementById('botMessages');
const btnSend = document.getElementById('btnSendBot');
const botInput = document.getElementById('botInput');
const btnClear = document.getElementById('btnClearChat');

// 4. LÓGICA DE MINIMIZAR / MAXIMIZAR
let isMinimized = sessionStorage.getItem('siest_bot_minimized') === 'true';

function aplicarEstadoMinimizado() {
    if (isMinimized) {
        botContainer.classList.add('minimized');
        btnToggleBot.innerHTML = '<i class="fa-solid fa-window-maximize"></i>';
    } else {
        botContainer.classList.remove('minimized');
        btnToggleBot.innerHTML = '<i class="fa-solid fa-window-minimize"></i>';
        botMessages.scrollTop = botMessages.scrollHeight;
    }
}

botHeader.onclick = (e) => {
    // Si hacen clic en el botón de basura, no minimizar
    if(e.target.closest('#btnClearChat')) return; 
    
    isMinimized = !isMinimized;
    sessionStorage.setItem('siest_bot_minimized', isMinimized);
    aplicarEstadoMinimizado();
};

// 5. LÓGICA DE MEMORIA (Historial de mensajes)
let chatHistory = JSON.parse(sessionStorage.getItem('siest_chat_history')) || [
    { role: 'bot', text: '¡Hola! Soy tu asistente de la UT Costa. ¿En qué te puedo ayudar hoy?' }
];

function renderizarHistorial() {
    botMessages.innerHTML = '';
    chatHistory.forEach(msg => {
        const div = document.createElement('div');
        div.className = `msg ${msg.role}`;
        div.innerText = msg.text;
        botMessages.appendChild(div);
    });
    botMessages.scrollTop = botMessages.scrollHeight;
}

// Iniciar estado visual
aplicarEstadoMinimizado();
renderizarHistorial();

// 6. Lógica de envío y respuesta
async function enviarMensaje() {
    const texto = botInput.value.trim();
    if (!texto) return;

    chatHistory.push({ role: 'user', text: texto });
    sessionStorage.setItem('siest_chat_history', JSON.stringify(chatHistory));
    renderizarHistorial();
    botInput.value = '';

    const idTemp = "typing-" + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg bot';
    typingDiv.id = idTemp;
    typingDiv.innerText = 'Analizando sistema...';
    botMessages.appendChild(typingDiv);
    botMessages.scrollTop = botMessages.scrollHeight;

    const respuesta = await procesarMensajeIA(texto);

    document.getElementById(idTemp).remove();
    chatHistory.push({ role: 'bot', text: respuesta });
    sessionStorage.setItem('siest_chat_history', JSON.stringify(chatHistory));
    renderizarHistorial();
}

btnSend.onclick = enviarMensaje;
botInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });

// Limpiar historial al tocar la papelera
btnClear.onclick = () => {
    if(confirm("¿Seguro que deseas borrar el historial de este chat?")) {
        chatHistory = [{ role: 'bot', text: '¡Hola! Soy tu asistente de la UT Costa. ¿En qué te puedo ayudar hoy?' }];
        sessionStorage.setItem('siest_chat_history', JSON.stringify(chatHistory));
        renderizarHistorial();
    }
};