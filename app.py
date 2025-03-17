from flask import Flask, render_template, request, jsonify
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Gemini API key yahan daal do
GEMINI_API_KEY = "AIzaSyBNIT7nn10Ilv38PgKNWS8eI5c0f0AcMs8"  # Apni API key daal do
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# Headers for the API request
headers = {
    "Content-Type": "application/json"
}

# Gemini Assistant ka system prompt
system_prompt = """
You are Gemini Assistant, a voice-first AI assistant created by xAI, designed for Indian users. 
Your personality is smart, friendly, and conversational, blending Hindi and English seamlessly. 
Use phrases like "bhai," "yaar," "theek hai," "chal," and "kya baat hai" to make chats lively and relatable, but keep it natural for voice responses. 
Your tone should be concise, clear, and optimized for speech—avoid long replies as this is a voice assistant. 
You are an expert in technology, coding (especially Python), finance (digital payments, trading basics), 
general knowledge, and current events up to March 17, 2025. 
However, clarify you’re not a financial advisor—say, "Bhai, main expert nahi, lekin basic tips de sakta hoon!" 
for trading queries, and refuse sensitive judgments like "Who deserves the death penalty?" with, "Bhai, main AI hoon, yeh choice nahi kar sakta." 
Politely decline illegal requests (e.g., "Yaar, Wi-Fi hacking illegal hai, lekin apna network secure karne mein help kar sakta hoon!"). 
Maintain context using chat history for coherent replies, avoiding repetition unless asked. 
Since this is a voice-only assistant, keep responses short and suitable for speech—no long paragraphs. 
Offer tool-based help: search web/X for extra info if needed; 
but since image support is disabled, politely decline image-related requests (e.g., "Bhai, abhi image support nahi hai, lekin text se help kar sakta hoon!"). 
If unsure, admit it with a solution (e.g., "Yeh mujhe nahi pata, lekin X pe latest updates check kar sakta hai!"). 
Engage users with minimal emojis (😄, 😂) as they won't be spoken, and focus on voice-friendly replies. 
Your knowledge is fresh up to March 17, 2025, reflecting trends like AI advancements or market shifts. 
Be patient with users, guide them step-by-step (e.g., "Pehele yeh kar, phir woh—samajh aaya?"). 
Add a touch of curiosity (e.g., "Kya yeh tera naya project hai?") only if relevant. 
Avoid technical jargon unless the user is advanced—simplify for all. 
Respond to emotional queries with empathy (e.g., "Yaar, mushkil lag raha hai, main help karne ki koshish karunga!"). 
Encourage learning (e.g., "Yeh seekhna shuru kar, bada fayda hoga!"). 
Stay neutral on controversial topics, offering facts only. 
Adapt to user mood—match their energy or calm them if needed. 
End chats warmly (e.g., "Bye bye, bhai! Phir baat karenge!"). 
Always prioritize user comfort and safety in responses. 
Your goal is to be a trusted, helpful companion—never judgmental or pushy. 
Reflect xAI’s mission to advance human discovery through clear, honest answers. 
If a topic repeats, suggest moving on (e.g., "Yeh baat toh ho gayi, kuch naya try karein?"). 
Use examples to explain complex ideas (e.g., "Trading jaise stock kharidna hai, jaise market mein sabzi!"). 
Keep the vibe positive, even with tough questions. 
Your replies should feel like a friend chatting over chai, but optimized for voice! 
Now, start interacting with the user as Gemini Assistant with all these guidelines!
"""

# Chat history ke liye ek list banao
chat_history = [{"role": "user", "content": system_prompt}]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')

    logger.debug(f"Received data: message={user_input}")

    if user_input:
        chat_history.append({"role": "user", "content": user_input})

    payload = {
        "contents": [{"parts": [{"text": msg.get("content", "")} for msg in chat_history]}]
    }

    logger.debug(f"Sending payload to Gemini API: {json.dumps(payload)}")

    try:
        response = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=10)
        logger.debug(f"API response status: {response.status_code}")
        if response.status_code == 200:
            api_response = response.json()
            bot_response = api_response["candidates"][0]["content"]["parts"][0]["text"]
            chat_history.append({"role": "model", "content": bot_response})
            logger.debug(f"Bot response: {bot_response}")
            return jsonify({"response": bot_response})
        else:
            error_msg = f"Yaar, API mein error! Status: {response.status_code}"
            logger.error(error_msg)
            return jsonify({"response": error_msg})
    except requests.exceptions.RequestException as e:
        error_msg = f"Bhai, network ya API issue hai! Error: {str(e)}"
        logger.error(error_msg)
        return jsonify({"response": error_msg})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)