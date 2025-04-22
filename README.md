# 🚀 Voxmate: Multilingual AI Assistant

Voxmate is a cutting-edge multilingual AI assistant designed to process and respond to user queries in text, audio, and images. Powered by advanced AI models and a robust backend architecture, it ensures seamless user interaction and accessibility.

## 🌟 Project Highlights

- **Conversational AI**: Context-aware conversations using Groq's LLaMA models.
- **PDF Processing**: Extract text from PDF files with PyMuPDF.
- **Image Queries**: Interpret and respond to image-based prompts.
- **Multilingual TTS**: Generate natural-sounding audio responses in multiple languages.
- **Session Management**: Multi-user, multi-session support for enhanced user experience.

---

## 🛠️ Tech Stack

- **FastAPI**: Backend API development.
- **Groq LLaMA 4**: Conversational AI.
- **PyMuPDF**: PDF text extraction.
- **Edge TTS**: Text-to-speech conversion.
- **Tesseract OCR**: Image text recognition.
- **Base64 Encoding**: Secure image embedding.

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/aman2240/AI-chatbot.git
cd AI-chatbot
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

Ensure `poppler` and `Tesseract OCR` are installed:
- **macOS**: `brew install poppler tesseract`
- **Ubuntu**: `sudo apt-get install poppler-utils tesseract-ocr`
- **Windows**: [Poppler for Windows](http://blog.alivate.com.au/poppler-windows/) | [Tesseract for Windows](https://github.com/tesseract-ocr/tesseract/wiki)

### Set Environment Variables

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
```

---

## ▶️ Running the Application

Start the server:

```bash
uvicorn app:app --reload
```

Access at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🔌 API Endpoints

### `/chat/`
- **POST**: AI chat with session tracking.
- **Input**: User message, role, conversation ID, user ID.
- **Output**: AI response, detected language, audio URL.

### `/upload-pdf/`
- **POST**: Upload PDF and extract text.
- **Input**: PDF file, user ID, conversation ID, optional prompt.
- **Output**: Extracted text.

### `/image-search/`
- **POST**: Query with an image and text.
- **Input**: Image file, prompt, user ID, conversation ID.
- **Output**: AI-generated response.

### `/text-to-speech/`
- **POST**: Convert text to speech.
- **Input**: Text, language.
- **Output**: TTS audio URL.

---

## 🎥 Demo

Visit the live demo: [Voxmate Demo](https://startling-bavarois-edfb33.netlify.app/)

---

## 🔍 Challenges Faced

- **Model Integration**: Efficiently integrating Groq's LLaMA model for real-time interaction.
- **Multilingual TTS**: Achieving natural and accurate audio outputs.
- **Session Management**: Maintaining context across user sessions.
- **Voice Input**: Implementing seamless voice-to-text conversion for user input.
- **OCR Processing**: Handling input from PDFs and JPGs using OCR for accurate text extraction.

---

## 📄 Future Enhancements

- Persistent database for session management.
- User authentication and authorization.
- Advanced image understanding and PDF summarization.
- Multinlingual Home Page

---

## 📜 License

MIT License © Nested Minds Team