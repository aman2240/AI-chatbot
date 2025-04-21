import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from PIL import Image
import base64
import io
from langdetect import detect
from datetime import datetime
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import edge_tts
import asyncio
import uuid
import fitz
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import tempfile

load_dotenv()

# Load env vars
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY in .env")

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-chatbot-002.onrender.com/,https://classy-licorice-ca3a0e.netlify.app/ "],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static audio directory
AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# Initialize Groq
client = Groq(api_key=GROQ_API_KEY)

# In-memory session storage for development/testing
in_memory_sessions: Dict[str, Dict[str, Dict]] = {}

# Models
class UserInput(BaseModel):
    message: str
    role: str = "user"
    conversation_id: str
    user_id: str

class TextToSpeechRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

# Utils
async def get_session(user_id: str, conversation_id: str):
    return in_memory_sessions.get(user_id, {}).get(conversation_id)

async def save_session(user_id: str, conversation_id: str, messages: List[Dict[str, str]], language: Optional[str]):
    if user_id not in in_memory_sessions:
        in_memory_sessions[user_id] = {}
    in_memory_sessions[user_id][conversation_id] = {
        "messages": messages,
        "language": language,
        "updated_at": datetime.utcnow()
    }

# Extract text from PDF using PyMuPDF
def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for i, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                full_text += f"\n--- Page {i + 1} (Text) ---\n{text}"
        return full_text
    except Exception as e:
        print(f"Error: {str(e)}")
        return ""

# Groq Query
def query_groq(messages: List[Dict[str, str]]) -> str:
    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            temperature=0.8,
            max_tokens=1024,
            top_p=1,
            stream=True,
        )
        response = ""
        for chunk in completion:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                response += delta.content
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

# Generate TTS and return audio URL
async def generate_tts_audio(text: str, language: Optional[str] = "en") -> str:
    try:
        voice_map = {
    "en": "en-US-AriaNeural",               # English (US) - Aria
    "en-us": "en-US-AriaNeural",            # English (US) - Aria
    "en-gb": "en-GB-LibbyNeural",           # English (UK) - Libby
    "hi": "hi-IN-SwaraNeural",              # Hindi - Swara
    "fr": "fr-FR-DeniseNeural",             # French - Denise
    "de": "de-DE-KatjaNeural",              # German - Katja
    "es": "es-ES-ElviraNeural",             # Spanish (Spain) - Elvira
    "es-mx": "es-MX-DaliaNeural",           # Spanish (Mexico) - Dalia
    "it": "it-IT-ElsaNeural",               # Italian - Elsa
    "ja": "ja-JP-NanamiNeural",             # Japanese - Nanami
    "ko": "ko-KR-SunHiNeural",              # Korean - SunHi
    "zh": "zh-CN-XiaoxiaoNeural",           # Chinese (Simplified) - Xiaoxiao
    "zh-cn": "zh-CN-XiaoxiaoNeural",        # Chinese (Simplified) - Xiaoxiao
    "zh-hk": "zh-HK-HiuMaanNeural",         # Chinese (Cantonese) - HiuMaan
    "zh-tw": "zh-TW-HsiaoChenNeural",       # Chinese (Taiwan) - HsiaoChen
    "pt": "pt-BR-FranciscaNeural",          # Portuguese (Brazil) - Francisca
    "pt-pt": "pt-PT-RaquelNeural",          # Portuguese (Portugal) - Raquel
    "ru": "ru-RU-SvetlanaNeural",           # Russian - Svetlana
    "tr": "tr-TR-EmelNeural",               # Turkish - Emel
    "ar": "ar-EG-SalmaNeural",              # Arabic (Egypt) - Salma
    "id": "id-ID-GadisNeural",              # Indonesian - Gadis
    "th": "th-TH-PremwadeeNeural",          # Thai - Premwadee
    "vi": "vi-VN-HoaiMyNeural",             # Vietnamese - HoaiMy
    "nl": "nl-NL-FennaNeural",              # Dutch - Fenna
    "pl": "pl-PL-ZofiaNeural",              # Polish - Zofia
    "sv": "sv-SE-SofieNeural",              # Swedish - Sofie
    "no": "nb-NO-IselinNeural",             # Norwegian - Iselin
    "fi": "fi-FI-SelmaNeural",              # Finnish - Selma
    "da": "da-DK-ChristelNeural",           # Danish - Christel
    "he": "he-IL-HilaNeural",               # Hebrew - Hila
    "cs": "cs-CZ-VlastaNeural",             # Czech - Vlasta
    "el": "el-GR-AthinaNeural",             # Greek - Athina
    "ro": "ro-RO-AlinaNeural",              # Romanian - Alina
    "hu": "hu-HU-NoemiNeural",              # Hungarian - Noemi
    "sk": "sk-SK-ViktoriaNeural",           # Slovak - Viktoria
    "uk": "uk-UA-PolinaNeural",             # Ukrainian - Polina
}

        voice = voice_map.get(language, "en-US-AriaNeural")

        filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(AUDIO_DIR, filename)

        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(output_path)

        return f"/audio/{filename}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

# Upload PDF Endpoint
@app.post("/upload-pdf/")
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    conversation_id: str = Form(...),
    prompt: str = Form(...),
):
    try:
        contents = await file.read()
        temp_dir = tempfile.gettempdir()
        pdf_filename = os.path.join(temp_dir, f"{uuid.uuid4()}.pdf")
        with open(pdf_filename, "wb") as f:
            f.write(contents)

        if not os.path.exists(pdf_filename):
            raise HTTPException(status_code=400, detail="Failed to save PDF file.")

        pdf_text = extract_text_from_pdf(pdf_filename)

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF.")

        # Query Groq using document + user prompt
        user_prompt = f"The user uploaded the following document.\n\nDocument content:\n{pdf_text}\n\nNow respond to this prompt:\n{prompt}"

        messages = [
            {"role": "system", "content": "You are a document analysis assistant."},
            {"role": "user", "content": user_prompt},
        ]

        response = query_groq(messages)

        return {
    "response": response
}


    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")

# Chat Endpoint
@app.post("/chat/")
async def chat(input: UserInput):
    session = await get_session(input.user_id, input.conversation_id)

    if session:
        messages = session["messages"]
    else:
        messages = [{"role": "system", "content": "You are a helpful assistant."}]

    messages.append({"role": input.role, "content": input.message})
    detected_language = detect(input.message)

    response = query_groq(messages)
    messages.append({"role": "assistant", "content": response})

    await save_session(input.user_id, input.conversation_id, messages, detected_language)

    audio_url = await generate_tts_audio(response, detected_language)

    return {
        "response": response,
        "language": detected_language,
        "audio_url": audio_url,
        "conversation_id": input.conversation_id
    }

# Image Search Endpoint
@app.post("/image-search/")
async def image_search(
    file: UploadFile = File(...),
    message: str = Form(...),
    conversation_id: str = Form(...),
    user_id: str = Form(...)
):
    try:
        image_bytes = await file.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = file.content_type
        image_data_url = f"data:{mime_type};base64,{encoded_image}"

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": message},
                    {"type": "image_url", "image_url": {"url": image_data_url}}
                ]
            }
        ]

        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            temperature=0.8,
            max_tokens=1024,
            top_p=1,
            stream=True,
        )

        response = ""
        for chunk in completion:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                response += delta.content

        audio_url = await generate_tts_audio(response)

        return {"response": response, "audio_url": audio_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing or API error: {str(e)}")

# Text-to-Speech (TTS) Endpoint
class SpeakTranslatedRequest(BaseModel):
    text: str
    target_language: str  # ISO code like "en", "fr", etc.

@app.post("/speak-translated/")
async def speak_translated(request: SpeakTranslatedRequest):
    try:
        original_text = request.text.strip()
        target_lang = request.target_language.lower()

        if not original_text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # 1. Translate input text to target language using Groq
        translation_prompt = [
            {"role": "system", "content": "You are a translation assistant. Respond only with the translated text, no extra commentary."},
            {"role": "user", "content": f"Translate the following text to {target_lang}:\n\n{original_text}"}
        ]
        translated_text = query_groq(translation_prompt).strip()

        # 2. Generate TTS audio from the translated text
        audio_path = await generate_tts_audio(translated_text, target_lang)
        audio_url = f"http://127.0.0.1:8000{audio_path}"

        # 3. Schedule cleanup of the audio file
        async def cleanup():
            await asyncio.sleep(300)
            output_path = os.path.join(AUDIO_DIR, audio_path.split('/')[-1])
            if os.path.exists(output_path):
                os.remove(output_path)

        asyncio.create_task(cleanup())

        return {
            "translated_text": translated_text,
            "audio_url": audio_url,
            "language": target_lang
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speak-translated error: {str(e)}")