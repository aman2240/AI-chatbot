# 🚀 HackHazards AI API

An advanced FastAPI backend that integrates:
- 💬 **Conversational AI** using Groq's LLaMA models  
- 🧾 **PDF text extraction** via PyMuPDF  
- 🧠 **Image-based queries** with base64-encoded image prompts  
- 🗣️ **Text-to-Speech (TTS)** powered by Microsoft Edge TTS  
- 📁 **Session management** for multi-user, multi-conversation support

---

## 📦 Features

- 🧠 **Conversational AI** with context-aware chat sessions (`LLaMA 4 Scout 17B`)
- 📄 **Upload PDF** files and extract readable text content
- 🖼️ **Image Search**: Upload images with text prompts for visual question answering
- 🔊 **Text-to-Speech** with multilingual support (`en`, `hi`, `fr`, `es`)
- 🧪 In-memory **session storage** (great for testing and prototyping)

---

## 🚀 Getting Started

### 📁 Clone the repository

```bash
git clone https://github.com/your-username/hackhazards-ai-api.git
cd hackhazards-ai-api
```

### ⚙️ Install dependencies

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install fastapi uvicorn python-dotenv groq edge-tts langdetect python-multipart pdf2image pytesseract Pillow fitz
```

> Make sure `poppler` is installed for `pdf2image`:  
> - macOS: `brew install poppler`  
> - Ubuntu: `sudo apt-get install poppler-utils`  
> - Windows: [Download Poppler for Windows](http://blog.alivate.com.au/poppler-windows/)

Also, ensure **Tesseract** OCR is installed for image text recognition:
- macOS: `brew install tesseract`
- Ubuntu: `sudo apt install tesseract-ocr`
- Windows: [Tesseract for Windows](https://github.com/tesseract-ocr/tesseract/wiki)

---

## 🧪 Environment Variables

Create a `.env` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

---

## ▶️ Run the Server

```bash
uvicorn app:app --reload
```

Server will run at:  
📍 `http://127.0.0.1:8000`

---

## 🔌 API Endpoints

### `/`  
**GET** - Root route  
Returns a friendly API status message.

---

### `/chat/`  
**POST** - AI chat with session tracking

**Body** (`application/json`):

```json
{
  "message": "Hello, how are you?",
  "role": "user",
  "conversation_id": "abc123",
  "user_id": "user001"
}
```

**Returns**:
- `response`: AI response
- `language`: Detected language
- `audio_url`: TTS audio file
- `conversation_id`: Echo of provided ID

---

### `/upload-pdf/`  
**POST** - Upload a PDF and extract its text

**Form Data**:
- `file`: PDF file
- `user_id`: Unique user identifier
- `conversation_id`: Session ID
- `prompt`: Prompt (optional)

**Returns**:
- `extracted_text`: All readable text extracted from PDF

---

### `/image-search/`  
**POST** - Send image + message for image-based question answering

**Form Data**:
- `file`: Image file
- `message`: Prompt
- `user_id`: Your user ID
- `conversation_id`: Session ID

**Returns**:
- `response`: AI answer
- `audio_url`: TTS URL of the answer

---

### `/text-to-speech/`  
**POST** - Convert text to speech

**Params**:
- `text`: String to convert
- `language`: Optional (`en`, `hi`, `fr`, `es`)

**Returns**:
- `audio_url`: URL to the generated `.mp3` file

---

## 📁 Audio File Hosting

TTS output is saved in `/audio` and accessible via:

```
http://127.0.0.1:8000/audio/your_audio.mp3
```

---

## 🛠 Tech Stack

- **FastAPI** - Web API framework
- **Groq LLaMA 4** - Conversational AI
- **Edge TTS** - Natural-sounding speech synthesis
- **PyMuPDF / pdf2image** - PDF text/image parsing
- **Tesseract OCR** - Optical Character Recognition
- **Base64 image embedding** - For image-based queries

---

## 📌 To-Do

- [ ] Persistent DB for chat sessions
- [ ] User authentication
- [ ] Frontend interface (React or Next.js)
- [ ] PDF summarization
- [ ] OCR fallback for scanned PDFs

---

## 📄 License

MIT © HackHazards Team

---

Let me know if you want this turned into a real GitHub repo structure with files and folders!
