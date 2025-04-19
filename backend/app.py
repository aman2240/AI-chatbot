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
    allow_origins=["*"],
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



@app.post("/upload-pdf/")
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    conversation_id: str = Form(...),
    prompt: str = Form(...),
):
    try:
        # Save PDF temporarily in a cross-platform way
        contents = await file.read()
        temp_dir = tempfile.gettempdir()
        pdf_filename = os.path.join(temp_dir, f"{uuid.uuid4()}.pdf")
        with open(pdf_filename, "wb") as f:
            f.write(contents)

        # Debugging: Check if the file exists and path
        print(f"PDF saved to: {pdf_filename}")
        if not os.path.exists(pdf_filename):
            raise HTTPException(status_code=400, detail="Failed to save PDF file.")

        # Extract text from PDF
        pdf_text = extract_text_from_pdf(pdf_filename)

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF.")

        # For simplicity, we'll return the extracted text
        return {"extracted_text": pdf_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")

# Extract text from PDF using PyMuPDF
def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        doc = fitz.open(pdf_path)  # Open the PDF
        full_text = ""
        for i, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                full_text += f"\n--- Page {i + 1} (Text) ---\n{text}"
        return full_text
    except Exception as e:
        print(f"Error: {str(e)}")
        return ""

# Run the FastAPI server using `uvicorn` in the terminal
# uvicorn main:app --reload


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
            "en": "en-US-AriaNeural",
            "hi": "hi-IN-SwaraNeural",
            "fr": "fr-FR-DeniseNeural",
            "es": "es-ES-ElviraNeural"
        }
        voice = voice_map.get(language, "en-US-AriaNeural")

        filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(AUDIO_DIR, filename)

        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(output_path)

        return f"/audio/{filename}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

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

# Image Search
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
@app.post("/text-to-speech/")
async def text_to_speech(text: str, language: Optional[str] = "en"):
    audio_url = await generate_tts_audio(text, language)
    return {"audio_url": audio_url}


@app.get("/")
async def root():
    return {"message": "HackHazards AI API is running 🚀"}
