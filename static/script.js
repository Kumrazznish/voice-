const chatContainer = document.getElementById('chat-container');
const voiceBtn = document.getElementById('voice-btn');
const textModeBtn = document.getElementById('text-mode-btn');
const waveAnimation = document.getElementById('wave-animation');
let speechMode = true; // Default to speech mode

// Speech recognition setup with fallback
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let speechSupported = true;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Hindi-English mix support
    recognition.interimResults = false;
} else {
    speechSupported = false;
    voiceBtn.disabled = true;
    voiceBtn.style.background = '#ccc';
    voiceBtn.title = 'Speech recognition not supported in this browser';
    addMessage('Gemini: Yaar, speech recognition is browser mein kaam nahi karta!', 'Gemini');
}

// Speech synthesis setup
const synth = window.speechSynthesis;

// Add message to chat
function addMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'animate__animated', 'animate__fadeIn');
    const textSpan = document.createElement('span');
    textSpan.textContent = `${sender}: ${message}`;
    messageDiv.appendChild(textSpan);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to latest
    console.log(`Message added: ${sender}: ${message}`); // Debugging
}

// Send message to Flask backend
async function sendMessage(message) {
    if (message) {
        addMessage(message, 'Tum');
        if (speechMode && synth) {
            speak(message);
        }
    }
    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message || '' })
    }).catch(err => {
        addMessage(`Gemini: Bhai, network error! ${err.message}`, 'Gemini');
        console.error('Fetch error:', err);
    });
    if (response && response.ok) {
        const data = await response.json();
        addMessage(data.response, 'Gemini');
        if (speechMode && synth) {
            speak(data.response);
        }
    } else if (response) {
        const error = await response.text();
        addMessage(`Gemini: Yaar, server error! ${error}`, 'Gemini');
    }
}

// Remove emojis from text for speech
function removeEmojis(text) {
    return text.replace(/[\p{Emoji}]/gu, '');
}

// Speak function
function speak(text) {
    const cleanText = removeEmojis(text); // Remove emojis before speaking
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.2;
    synth.speak(utterance);
}

// Handle voice input
voiceBtn.addEventListener('click', () => {
    if (!speechSupported) {
        addMessage('Gemini: Yaar, speech recognition is browser mein kaam nahi karega!', 'Gemini');
        return;
    }
    recognition.start();
    waveAnimation.classList.remove('hidden');
    voiceBtn.style.background = '#34a853';
    addMessage('Gemini: Bol do, bhai! Main sun raha hoon...', 'Gemini');
});

if (speechSupported) {
    recognition.onresult = (event) => {
        const message = event.results[0][0].transcript;
        waveAnimation.classList.add('hidden');
        voiceBtn.style.background = '#4285f4';
        addMessage(message, 'Tum');
        if (speechMode && synth) {
            speak(message);
        }
        if (message.toLowerCase() === 'exit') {
            addMessage('Gemini: Bye bye, bhai! Phir baat karenge!', 'Gemini');
            if (speechMode && synth) {
                speak('Bye bye, bhai! Phir baat karenge!');
            }
            setTimeout(() => window.close(), 2000);
        } else {
            sendMessage(message);
        }
    };

    recognition.onerror = (event) => {
        waveAnimation.classList.add('hidden');
        voiceBtn.style.background = '#4285f4';
        addMessage(`Gemini: Yaar, kuch samajh nahi aaya! Error: ${event.error}`, 'Gemini');
    };

    recognition.onend = () => {
        waveAnimation.classList.add('hidden');
        voiceBtn.style.background = '#4285f4';
    };
}

// Toggle speech mode
textModeBtn.addEventListener('click', () => {
    speechMode = !speechMode;
    textModeBtn.innerHTML = speechMode ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    addMessage(`Gemini: Ab ${speechMode ? 'Speech' : 'Silent'} mode mein ho, bhai!`, 'Gemini');
    if (!speechMode) {
        addMessage('Gemini: Ab main reply nahi bolunga, sirf screen pe dikhayunga!', 'Gemini');
    } else {
        addMessage('Gemini: Chalo, ab phir se bol ke baat karte hain!', 'Gemini');
        if (synth) {
            speak('Chalo, ab phir se bol ke baat karte hain!');
        }
    }
});

// Initial welcome with speech if supported
if (synth) {
    speak('Welcome to Gemini Assistant! Bol do, bhai!');
}