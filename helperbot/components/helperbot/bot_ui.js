// components/helperbot/bot_ui.js
import { procesarMensajeIA } from './bot_logic.js';

// 1. Inyectar el CSS dinámicamente
const linkCss = document.createElement('link');
linkCss.rel = 'stylesheet';
linkCss.href = '../components/helperbot/bot_styles.css';
document.head.appendChild(linkCss);

// 2. Crear la estructura HTML del bot
const botHTML = `
    <div class="helperbot-wrapper">
        <button class="helperbot-btn" id="btnOpenBot"><i class="fa-solid fa-robot"></i></button>
        <div class="helperbot-window" id="botWindow">
            <div class="helperbot-header">
                <span>🤖 Helperbot SIEST</span>
                <span class="close-bot" id="btnCloseBot"><i class="fa-solid fa-xmark"></i></span>
            </div>
            <div class="helperbot-messages" id="botMessages">
                <div class="msg bot">¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar hoy?</div>
            </div>
            <div class="helperbot-input-area">
                <input type="text" id="botInput" placeholder="Escribe tu duda aquí...">
                <button id="btnSendBot"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    </div>
`;

// Insertar en el body
document.body.insertAdjacentHTML('beforeend', botHTML);

// 3. Lógica visual (Abrir/Cerrar y enviar mensajes)
const btnOpen = document.getElementById('btnOpenBot');
const btnClose = document.getElementById('btnCloseBot');
const botWindow = document.getElementById('botWindow');
const btnSend = document.getElementById('btnSendBot');
const botInput = document.getElementById('botInput');
const botMessages = document.getElementById('botMessages');

btnOpen.onclick = () => botWindow.style.display = 'flex';
btnClose.onclick = () => botWindow.style.display = 'none';

async function enviarMensaje() {
    const texto = botInput.value.trim();
    if (!texto) return;

    // Pintar mensaje del usuario
    botMessages.innerHTML += `<div class="msg user">${texto}</div>`;
    botInput.value = '';
    botMessages.scrollTop = botMessages.scrollHeight;

    // Pintar "escribiendo..."
    const idTemp = "typing-" + Date.now();
    botMessages.innerHTML += `<div class="msg bot" id="${idTemp}">Escribiendo...</div>`;
    botMessages.scrollTop = botMessages.scrollHeight;

    // Llamar a la IA / Lógica
    const respuesta = await procesarMensajeIA(texto);

    // Reemplazar "escribiendo..." con la respuesta real
    document.getElementById(idTemp).innerText = respuesta;
    botMessages.scrollTop = botMessages.scrollHeight;
}

btnSend.onclick = enviarMensaje;
botInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });