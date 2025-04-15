import os
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form
from PIL import Image
import base64
import io
from fastapi import HTTPException

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("API key for Groq is missing. Please set the GROQ_API_KEY in the .env file.")

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

client = Groq(api_key=GROQ_API_KEY)

# Pydantic model for user input
class UserInput(BaseModel):
    message: str
    role: str = "user"
    conversation_id: str

class Conversation:
    def __init__(self):
        self.messages: List[Dict[str, str]] = [
            {"role": "system", "content": "You are a helpful AI assistant."}
        ]
        self.active: bool = True

# In-memory conversation tracker
conversations: Dict[str, Conversation] = {}

def get_or_create_conversation(conversation_id: str) -> Conversation:
    if conversation_id not in conversations:
        conversations[conversation_id] = Conversation()
    return conversations[conversation_id]

def query_groq_api(conversation: Conversation) -> str:
    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=conversation.messages,
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
        raise HTTPException(status_code=500, detail=f"Error with Groq API: {str(e)}")

@app.post("/chat/")
async def chat(input: UserInput):
    conversation = get_or_create_conversation(input.conversation_id)

    if not conversation.active:
        raise HTTPException(
            status_code=400,
            detail="Chat session ended. Please start a new one."
        )

    conversation.messages.append({"role": input.role, "content": input.message})
    response = query_groq_api(conversation)
    conversation.messages.append({"role": "assistant", "content": response})

    return {"response": response, "conversation_id": input.conversation_id}

# Updated image search endpoint that accepts both image and caption
@app.post("/image-search/")
async def image_search(
    file: UploadFile = File(...),
    message: str = Form(...),
    conversation_id: str = Form(...)
):
    try:
        # Encode image
        image_bytes = await file.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = file.content_type
        image_data_url = f"data:{mime_type};base64,{encoded_image}"

        # Construct a single-turn message without system role
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

        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing or API error: {str(e)}")
