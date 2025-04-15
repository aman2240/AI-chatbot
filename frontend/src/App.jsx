import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faTimes } from '@fortawesome/free-solid-svg-icons';

const App = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!conversationId) {
      setConversationId(Date.now().toString());
    }
  }, [conversationId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!message.trim() && !selectedImage) return;
  
    setLoading(true);
  
    try {
      let response, data;
  
      // 👇 Only push the image message (with caption) if an image is selected
      if (selectedImage) {
        const imageURL = URL.createObjectURL(selectedImage);
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'user',
            image: imageURL,
            text: message.trim(),
          },
        ]);
  
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('message', message.trim());
        formData.append('conversation_id', conversationId);
  
        response = await fetch('http://localhost:8000/image-search/', {
          method: 'POST',
          body: formData,
        });
      } else if (message.trim()) {
        setChatHistory((prev) => [...prev, { sender: 'user', text: message.trim() }]);
  
        response = await fetch('http://localhost:8000/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            conversation_id: conversationId,
            role: 'user',
          }),
        });
      }
  
      if (!response?.ok) throw new Error('API request failed');
      data = await response.json();
  
      setChatHistory((prev) => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err) {
      const errorMsg = err?.message || 'Unknown error';
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: `⚠️ Error: ${errorMsg}` },
      ]);
    } finally {
      setMessage('');
      setSelectedImage(null);
      setLoading(false);
    }
  };
  

  const handleImageUpload = () => {
    // Trigger the file input click when the user clicks on the paperclip icon
    document.getElementById('image-upload-input').click();
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-zinc-950 fixed inset-0 flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl text-white font-semibold mb-4">AI Chatbot</h1>

        <div
          ref={chatContainerRef}
          className="overflow-y-auto h-96 space-y-4 mb-4 p-4 border border-zinc-800 rounded-lg"
        >
          {chatHistory.map((msg, index) => (
  <div
    key={index}
    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <div className="max-w-xs space-y-1">
      {/* Image block with caption BELOW like WhatsApp */}
      {msg.image && (
        <div
          className={`rounded-lg overflow-hidden ${
            msg.sender === 'user' ? 'bg-green-700' : 'bg-zinc-700'
          }`}
        >
          <img
            src={msg.image}
            alt="uploaded"
            className="rounded-t-lg max-h-48 w-full object-contain"
          />
        </div>
      )}

      {/* Caption BELOW image, styled like WhatsApp */}
      {msg.image && msg.text && (
        <div
          className={`px-2 pt-1 text-sm italic ${
            msg.sender === 'user' ? 'text-green-200 text-right' : 'text-gray-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* TEXT-ONLY message (no image) or AI response */}
      {!msg.image && msg.text && (
        <div
          className={`whitespace-pre-wrap break-words p-3 rounded-lg text-sm leading-relaxed ${
            msg.sender === 'user' ? 'bg-green-700 text-white' : 'bg-zinc-700 text-white'
          }`}
        >
          {msg.text.split('\n').map((line, idx) => {
            const trimmed = line.trim();

            if (!trimmed) return <br key={idx} />;

            // Bullet points: starts with "+" or "-"
            if (/^[-+]\s/.test(trimmed)) {
              return (
                <div key={idx} className="flex items-start space-x-2">
                  <span>•</span>
                  <span>{trimmed.slice(2)}</span>
                </div>
              );
            }

            // Numbered list
            if (/^\d+\.\s/.test(trimmed)) {
              return (
                <div key={idx} className="pl-4">
                  {trimmed}
                </div>
              );
            }

            // Bold headings
            if (trimmed.endsWith(':')) {
              return (
                <div key={idx} className="font-bold">
                  {trimmed}
                </div>
              );
            }

            return <div key={idx}>{trimmed}</div>;
          })}
        </div>
      )}
    </div>
  </div>
))}


          {loading && (
            <div className="flex justify-start">
              <div className="max-w-xs p-3 rounded-lg bg-gray-900 text-white animate-pulse">
                AI is typing...
              </div>
            </div>
          )}
        </div>

        {/* Unified Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-zinc-950 text-white"
            placeholder="Type your message..."
          />

          {/* Image Preview Section */}
          {selectedImage && (
  <div className="flex items-center space-x-3 bg-zinc-800 p-2 rounded-lg">
    {selectedImage instanceof File && (
      <img
        src={URL.createObjectURL(selectedImage)}
        alt="preview"
        className="w-12 h-12 object-cover rounded-lg"
      />
    )}
    <span className="text-white text-sm truncate">{selectedImage.name}</span>
    <button
      onClick={removeSelectedImage}
      type="button"
      className="text-red-400 hover:text-red-600"
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
)}


          <div className="flex flex-row items-center space-x-2">
            <div
              className="flex justify-center items-center bg-gray-800 p-3 rounded-full cursor-pointer"
              onClick={handleImageUpload}
            >
              <FontAwesomeIcon icon={faPaperclip} className="text-white text-xl" />
            </div>

            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files[0])}
              className="hidden"
            />

            <button
              type="submit"
              disabled={loading || (!message.trim() && !selectedImage)}
              className="bg-green-600 text-white py-2 px-4 rounded-lg flex-1"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;

