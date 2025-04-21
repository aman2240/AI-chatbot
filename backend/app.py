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
import logging

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env vars
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY in .env")

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://flourishing-profiterole-61e249.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://tranquil-douhua-be28ef.netlify.app"
    ],
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

class SpeakTranslatedRequest(BaseModel):
    text: str
    target_language: str  # ISO code like "en", "fr", etc.

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
        logger.error(f"PDF extraction error: {str(e)}")
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
        logger.error(f"Groq API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

# Generate TTS and return audio URL
async def generate_tts_audio(text: str, language: Optional[str] = "en") -> str:
    try:
        voice_map = {
            "en": "en-US-AriaNeural",
            "en-us": "en-US-AriaNeural",
            "en-gb": "en-GB-LibbyNeural",
            "hi": "hi-IN-SwaraNeural",
            "fr": "fr-FR-DeniseNeural",
            "de": "de-DE-KatjaNeural",
            "es": "es-ES-ElviraNeural",
            "es-mx": "es-MX-DaliaNeural",
            "it": "it-IT-ElsaNeural",
            "ja": "ja-JP-NanamiNeural",
            "ko": "ko-KR-SunHiNeural",
            "zh": "zh-CN-XiaoxiaoNeural",
            "zh-cn": "zh-CN-XiaoxiaoNeural",
            "zh-hk": "zh-HK-HiuMaanNeural",
            "zh-tw": "zh-TW-HsiaoChenNeural",
            "pt": "pt-BR-FranciscaNeural",
            "pt-pt": "pt-PT-RaquelNeural",
            "ru": "ru-RU-SvetlanaNeural",
            "tr": "tr-TR-EmelNeural",
            "ar": "ar-EG-SalmaNeural",
            "id": "id-ID-GadisNeural",
            "th": "th-TH-PremwadeeNeural",
            "vi": "vi-VN-HoaiMyNeural",
            "nl": "nl-NL-FennaNeural",
            "pl": "pl-PL-ZofiaNeural",
            "sv": "sv-SE-SofieNeural",
            "no": "nb-NO-IselinNeural",
            "fi": "fi-FI-SelmaNeural",
            "da": "da-DK-ChristelNeural",
            "he": "he-IL-HilaNeural",
            "cs": "cs-CZ-VlastaNeural",
            "el": "el-GR-AthinaNeural",
            "ro": "ro-RO-AlinaNeural",
            "hu": "hu-HU-NoemiNeural",
            "sk": "sk-SK-ViktoriaNeural",
            "uk": "uk-UA-PolinaNeural",
        }

        # Validate language
        if language not in voice_map:
            logger.warning(f"Unsupported language: {language}. Supported languages: {list(voice_map.keys())}")
            raise HTTPException(status_code=400, detail=f"Unsupported language: {language}. Supported languages: {list(voice_map.keys())}")

        voice = voice_map[language]
        logger.info(f"Generating TTS for text: '{text[:50]}...', language: {language}, voice: {voice}")

        filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(AUDIO_DIR, filename)

        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(output_path)

        # Verify file exists
        if not os.path.exists(output_path):
            logger.error(f"Audio file not created: {output_path}")
            raise HTTPException(status_code=500, detail="Failed to create audio file")

        logger.info(f"Audio file created: {output_path}, size: {os.path.getsize(output_path)} bytes")

        # Use the production Render URL for audio files
        base_url = "https://ai-chatbot-qg4j.onrender.com"
        audio_url = f"{base_url}/audio/{filename}"
        logger.info(f"Generated audio URL: {audio_url}")

        return audio_url
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
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
        logger.error(f"PDF processing error: {str(e)}")
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

    # Always use English for TTS audio
    await save_session(input.user_id, input.conversation_id, messages, detected_language)
    audio_url = await generate_tts_audio(response, language="en")

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
        logger.error(f"Image processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image processing or API error: {str(e)}")

# Text-to-Speech (TTS) Endpoint
@app.post("/speak-translated/")
async def speak_translated(request: SpeakTranslatedRequest):
    try:
        original_text = request.text.strip()
        target_lang = request.target_language.lower()

        if not original_text:
            logger.error("Received empty text input")
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # Define voice map for validation
        voice_map = {
            "en": "en-US-AriaNeural",
            "en-us": "en-US-AriaNeural",
            "en-gb": "en-GB-LibbyNeural",
            "hi": "hi-IN-SwaraNeural",
            "fr": "fr-FR-DeniseNeural",
            "de": "de-DE-KatjaNeural",
            "es": "es-ES-ElviraNeural",
            "es-mx": "es-MX-DaliaNeural",
            "it": "it-IT-ElsaNeural",
            "ja": "ja-JP-NanamiNeural",
            "ko": "ko-KR-SunHiNeural",
            "zh": "zh-CN-XiaoxiaoNeural",
            "zh-cn": "zh-CN-XiaoxiaoNeural",
            "zh-hk": "zh-HK-HiuMaanNeural",
            "zh-tw": "zh-TW-HsiaoChenNeural",
            "pt": "pt-BR-FranciscaNeural",
            "pt-pt": "pt-PT-RaquelNeural",
            "ru": "ru-RU-SvetlanaNeural",
            "tr": "tr-TR-EmelNeural",
            "ar": "ar-EG-SalmaNeural",
            "id": "id-ID-GadisNeural",
            "th": "th-TH-PremwadeeNeural",
            "vi": "vi-VN-HoaiMyNeural",
            "nl": "nl-NL-FennaNeural",
            "pl": "pl-PL-ZofiaNeural",
            "sv": "sv-SE-SofieNeural",
            "no": "nb-NO-IselinNeural",
            "fi": "fi-FI-SelmaNeural",
            "da": "da-DK-ChristelNeural",
            "he": "he-IL-HilaNeural",
            "cs": "cs-CZ-VlastaNeural",
            "el": "el-GR-AthinaNeural",
            "ro": "ro-RO-AlinaNeural",
            "hu": "hu-HU-NoemiNeural",
            "sk": "sk-SK-ViktoriaNeural",
            "uk": "uk-UA-PolinaNeural",
        }

        # Validate target_language early
        if target_lang not in voice_map:
            logger.warning(f"Invalid target_language: {target_lang}. Supported languages: {list(voice_map.keys())}")
            raise HTTPException(status_code=400, detail=f"Unsupported target_language: {target_lang}. Supported languages: {list(voice_map.keys())}")

        logger.info(f"Processing /speak-translated/ with text: '{original_text[:50]}...', target_language: '{target_lang}'")

        # Translate input text to target language using Groq
        translation_prompt = [
            {
                "role": "system",
                "content": "You are a translation assistant. Return ONLY the translated text in the target language, without any additional commentary, explanations, or extra text."
            },
            {
                "role": "user",
                "content": f"Translate the following text to {target_lang}:\n\n{original_text}"
            }
        ]
        translated_text = query_groq(translation_prompt).strip()

        if not translated_text:
            logger.error("Translation returned empty text")
            raise HTTPException(status_code=500, detail="Translation failed: No text returned")

        logger.info(f"Translated text: '{translated_text[:50]}...'")

        # Generate TTS audio from the translated text
        audio_url = await generate_tts_audio(translated_text, target_lang)

        # Verify audio file exists
        output_path = os.path.join(AUDIO_DIR, audio_url.split('/')[-1])
        if not os.path.exists(output_path):
            logger.error(f"Audio file not found after generation: {output_path}")
            raise HTTPException(status_code=500, detail="Failed to generate audio file")

        # Schedule cleanup of the audio file
        async def cleanup():
            try:
                await asyncio.sleep(600)  # Wait 10 minutes
                if os.path.exists(output_path):
                    os.remove(output_path)
                    logger.info(f"Cleaned up audio file: {output_path}")
                else:
                    logger.warning(f"Audio file not found for cleanup: {output_path}")
            except Exception as e:
                logger.error(f"Error during audio file cleanup: {str(e)}")

        asyncio.create_task(cleanup())

        logger.info(f"Returning response: translated_text='{translated_text[:50]}...', audio_url='{audio_url}', language='{target_lang}'")
        return {
            "translated_text": translated_text,
            "audio_url": audio_url,
            "language": target_lang
        }

    except Exception as e:
        logger.error(f"Speak-translated error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Speak-translated error: {str(e)}")
