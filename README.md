# 🚀 Voxmate: Multilingual AI Assistant

> A cutting-edge multilingual AI assistant designed to process and respond to user queries in text, audio, and images.

---

## 📌 Problem Statement

**Problem Statement 1 – Weave AI magic with Groq**

---

## 🎯 Objective

Voxmate addresses the challenge of providing real-time multilingual AI assistance, ensuring accessibility and seamless interaction for diverse users. This project serves individuals and organizations needing versatile communication tools for text, audio, and image-based queries.

---

## 🧠 Team & Approach

### Team Name:

`Nested Minds`

### Team Members:

- **Kavi Sharma** ([GitHub](https://github.com/Kavi-Sharma08) / [LinkedIn](https://www.linkedin.com/in/kavi-sharma-29b487294)) – Contributed in making the frontend of VoxMate.
- **Aryan Shrivastav** ([GitHub](https://github.com/aryanSE7374/) / [LinkedIn](https://www.linkedin.com/in/aryanshri0611/)) – Contributed in making the frontend of VoxMate and miscellaneous tasks.
- **Aman Kumar** ([GitHub](https://github.com/aman2240) / [LinkedIn](https://www.linkedin.com/in/aman-kumar-1417b7291)) – Contributed in making the backend of VoxMate.

- **Krishna Tyagi** ([GitHub](https://github.com/knight22-21) / [LinkedIn](https://www.linkedin.com/in/krishna-tyagi-/)) – Helped in the making of backend of AI chatbot.

### Your Approach:

- Chose this problem to enhance rural accessibility and multilingual communication.
- Key challenges addressed: real-time multilingual TTS, OCR, and session management.
- Iterated through multiple brainstorming sessions to integrate advanced features like PDF and image processing seamlessly.

---

## 🛠️ Tech Stack

### Core Technologies Used:

- **Frontend**: React.js
- **Backend**: FastAPI
- **Database**: MongoDB (future integration planned)
- **APIs**: Custom-built for multilingual processing
- **Hosting**: Netlify, Render

### Partner Technology Used:

- [☑️] **Groq**: Integrated Groq LLaMA 4 for conversational AI.

### Additional Tools & Libraries:

- **Tesseract OCR**: Implemented for accurate text extraction from images.
- **Edge TTS**: Used for multilingual text-to-speech conversion.
- **PyMuPDF**: For text extraction from PDF files.

---

## ✨ Key Features

- ☑️ Context-aware conversations with Groq’s LLaMA models.
- ☑️ Text extraction from PDF files using PyMuPDF.
- ☑️ Multilingual natural-sounding TTS responses.
- ☑️ Image-based query interpretation.

---

## 📷 Demo & Deliverables

- **Demo Video Link**: [Voxmate Demo](https://drive.google.com/file/d/1UEJA3tdg3nHgqFlfwOMC-9wBO88p2xyR/view?usp=sharing)
- **Pitch Deck / PPT Link**: [Pitch Deck](https://docs.google.com/presentation/d/1yZWnl0_x0H5FdOWA9lVA-DT2gaAtWCLZ/edit?usp=sharing\&ouid=104654778268801210397\&rtpof=true\&sd=true)

---

## ✅ Tasks & Bonus Checklist

- [☑️] All members of the team completed the mandatory task – Followed at least 2 of our social channels and filled the form.
- [☑️] Completed Bonus Task 1 – Sharing of Badges (2 points).
- [☑️] Completed Bonus Task 2 – Signing up for Sprint.dev (3 points).

---

## 🧪 How to Run the Project

### Requirements:

- Python 3.8+
- `poppler` and `Tesseract OCR`
- `.env` file with API keys

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

## 🚒 Challenges Faced

- **Integration Issues**: Synchronizing Groq’s LLaMA with our FastAPI backend was complex, requiring multiple iterations to optimize performance.
- **Multilingual TTS**: Ensuring accurate and natural-sounding text-to-speech for diverse languages posed significant challenges.
- **OCR and PDF Processing**: Implementing robust OCR for diverse document formats required extensive testing and adjustments.
- **Team Collaboration**: Coordinating tasks across team members with different roles and expertise demanded effective communication and task management.

---

## 🧬 Future Scope

- Persistent database for session management.
- User authentication and authorization.
- Advanced image understanding and PDF summarization.
- Multilingual homepage for broader accessibility.

---

## 📎 Resources / Credits

- **APIs**: Groq, Edge TTS, Tesseract OCR
- **Libraries**: FastAPI, PyMuPDF
- **Acknowledgements**: Hackathon organizers and mentors for guidance.

---

## 🏁 Final Words

Participating in this hackathon was an enriching experience. Overcoming challenges like model integration and session management was rewarding, and the teamwork made it all worthwhile. Special thanks to the mentors and organizers for their support!

---

## 💎 License

MIT License © Nested Minds Team

