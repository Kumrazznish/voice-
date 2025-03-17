const chatContainer = document.getElementById('chat-container');
const voiceBtn = document.getElementById('voice-btn');
const modeToggleBtn = document.getElementById('mode-toggle-btn');
const textInput = document.getElementById('text-input');
const sendBtn = document.getElementById('send-btn');
const waveAnimation = document.getElementById('wave-animation');
let isVoiceMode = true; // Default to voice mode
let detectedLanguage = 'en-US'; // Default language

// Speech recognition setup with fallback
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let speechSupported = true;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Default to English, will adjust dynamically
    recognition.interimResults = false;
} else {
    speechSupported = false;
    voiceBtn.disabled = true;
    voiceBtn.style.background = '#ccc';
    voiceBtn.title = 'Speech recognition not supported in this browser';
    addMessage('Next-Zen-AI: Yaar, speech recognition is browser mein kaam nahi karta!', 'Next-Zen-AI');
}

// Speech synthesis setup
const synth = window.speechSynthesis;

// Add message to chat
function addMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'animate__animated');
    const textSpan = document.createElement('span');
    textSpan.textContent = `${sender}: ${message}`;
    messageDiv.appendChild(textSpan);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to latest
    console.log(`Message added: ${sender}: ${message}`); // Debugging
}

// Send message to Flask backend
async function sendMessage(message) {
    addMessage(message, 'Tum');
    if (isVoiceMode && synth) {
        speak(message, detectedLanguage);
    }

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message || '' })
    }).catch(err => {
        addMessage(`Next-Zen-AI: Bhai, network error! ${err.message}`, 'Next-Zen-AI');
        console.error('Fetch error:', err);
    });

    if (response && response.ok) {
        const data = await response.json();
        addMessage(data.response, 'Next-Zen-AI');
        if (isVoiceMode && synth) {
            speak(data.response, detectedLanguage);
        }
    } else if (response) {
        const error = await response.text();
        addMessage(`Next-Zen-AI: Yaar, server error! ${error}`, 'Next-Zen-AI');
    }
}

// Language detection and speak function
function detectLanguage(text) {
    // Simple heuristic: Check for Hindi characters or common words
    if (/[\u0900-\u097F]/.test(text) || text.match(/^(नमस्ते|हिंदी|भाई)/i)) {
        return 'hi-IN';
    } else {
        return 'en-US';
    }
}

function speak(text, lang) {
    const cleanText = text.replace(/[\p{Emoji}]/gu, ''); // Remove emojis
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.2;
    synth.speak(utterance);
}

// Handle voice input
voiceBtn.addEventListener('click', () => {
    if (!speechSupported) {
        addMessage('Next-Zen-AI: Yaar, speech recognition is browser mein kaam nahi karta!', 'Next-Zen-AI');
        return;
    }
    if (isVoiceMode) {
        recognition.start();
        waveAnimation.classList.remove('hidden');
        voiceBtn.classList.add('listening');
        addMessage('Next-Zen-AI: Bol do, bhai! Main sun raha hoon...', 'Next-Zen-AI');
    }
});

if (speechSupported) {
    recognition.onresult = (event) => {
        const message = event.results[0][0].transcript;
        detectedLanguage = detectLanguage(message); // Detect language
        recognition.lang = detectedLanguage; // Update recognition language
        waveAnimation.classList.add('hidden');
        voiceBtn.classList.remove('listening');
        sendMessage(message); // Send directly, no repetition

        if (message.toLowerCase() === 'exit') {
            addMessage('Next-Zen-AI: Bye bye, bhai! Phir baat karenge!', 'Next-Zen-AI');
            if (isVoiceMode && synth) {
                speak('Bye bye, bhai! Phir baat karenge!', detectedLanguage);
            }
            setTimeout(() => window.close(), 2000);
        }
    };

    recognition.onerror = (event) => {
        waveAnimation.classList.add('hidden');
        voiceBtn.classList.remove('listening');
        addMessage(`Next-Zen-AI: Yaar, kuch samajh nahi aaya! Error: ${event.error}`, 'Next-Zen-AI');
    };

    recognition.onend = () => {
        waveAnimation.classList.add('hidden');
        voiceBtn.classList.remove('listening');
    };
}

// Handle text input
sendBtn.addEventListener('click', () => {
    const message = textInput.value.trim();
    if (message) {
        textInput.value = '';
        detectedLanguage = detectLanguage(message); // Detect language from text
        sendMessage(message);

        if (message.toLowerCase() === 'exit') {
            addMessage('Next-Zen-AI: Bye bye, bhai! Phir baat karenge!', 'Next-Zen-AI');
            if (isVoiceMode && synth) {
                speak('Bye bye, bhai! Phir baat karenge!', detectedLanguage);
            }
            setTimeout(() => window.close(), 2000);
        }
    }
});

// Handle Enter key for text input
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Toggle between voice and text mode
modeToggleBtn.addEventListener('click', () => {
    isVoiceMode = !isVoiceMode;
    if (isVoiceMode) {
        modeToggleBtn.innerHTML = '<i class="fas fa-toggle-on"></i>';
        modeToggleBtn.style.background = '#4285f4';
        addMessage('Next-Zen-AI: Ab voice mode mein ho, bhai! Bol do!', 'Next-Zen-AI');
        if (synth) {
            speak('Ab voice mode mein ho, bhai! Bol do!', detectedLanguage);
        }
    } else {
        modeToggleBtn.innerHTML = '<i class="fas fa-toggle-off"></i>';
        modeToggleBtn.style.background = '#34a853';
        addMessage('Next-Zen-AI: Ab text mode mein ho, bhai! Type karo!', 'Next-Zen-AI');
    }
});

// Initial welcome with speech if supported
if (synth) {
    speak('Welcome to Next-Zen-AI Assistant! Bol do ya type karo, bhai!', 'en-US');
}
