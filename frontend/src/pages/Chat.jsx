import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL } from "../constants/constants";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-4">Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

// MessageBubble Component
const MessageBubble = ({ role, content, isTyping, audioUrl, messageId, isPlaying, onToggleAudio }) => {
  const isUser = role === "user";
  console.debug(`MessageBubble: messageId=${messageId}, role=${role}, audioUrl=${audioUrl}, isPlaying=${isPlaying}`);

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 items-start`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 120 }}
    >
      {!isUser && audioUrl && (
        <motion.button
          onClick={() => onToggleAudio(messageId, audioUrl)}
          className={`p-2 rounded-full mr-2 mt-3 ${
            isPlaying
              ? "bg-gradient-to-r from-red-600 to-pink-600"
              : "bg-gray-800/50 border border-indigo-500/30"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label={isPlaying ? "Stop audio" : "Play audio"}
        >
          <motion.span
            className="text-lg"
            animate={isPlaying ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ repeat: isPlaying ? Infinity : 0, duration: 1, ease: "easeInOut" }}
          >
            {isPlaying ? "⏸️" : "🎙️"}
          </motion.span>
        </motion.button>
      )}
      <div
        className={`max-w-[80%] sm:max-w-[60%] p-3 sm:p-4 rounded-xl shadow-md ${
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
            : "bg-white/10 backdrop-blur-lg border border-indigo-600/30 text-gray-100"
        }`}
      >
        {isTyping ? (
          <motion.div
            className="flex space-x-2"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </motion.div>
        ) : (
          <ErrorBoundary>
            <div className="text-sm sm:text-base markdown prose prose-invert">
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    return inline ? (
                      <code className="bg-gray-700/50 px-1 rounded" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-700/50 p-3 rounded-lg overflow-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </ErrorBoundary>
        )}
      </div>
    </motion.div>
  );
};

// ChatInput Component
const ChatInput = ({ onSend, transcript, resetTranscript, isListening, toggleListening, browserSupportsSpeechRecognition }) => {
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [micHovered, setMicHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() || image) {
      await onSend(input, image);
      setInput("");
      setImage(null);
      resetTranscript();
    }
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage && selectedImage.type.startsWith("image/") && selectedImage instanceof File) {
      setImage(selectedImage);
      console.log("Selected image:", { name: selectedImage.name, size: selectedImage.size, type: selectedImage.type });
    } else {
      console.warn("Invalid image selected:", selectedImage);
      setImage(null);
    }
  };

  return (
    <motion.div
      className="relative bg-white/10 backdrop-blur-lg border-t border-indigo-600/30 p-4 sm:p-6 z-10"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1, scale: focused ? 1.02 : 1 }}
      transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
    >
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <motion.label
          htmlFor="image-upload"
          className="p-3 bg-gray-800/50 rounded-lg border border-indigo-500/30 cursor-pointer"
          whileHover={{ scale: 1.05, backgroundColor: "rgba(139, 92, 246, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label="Upload image"
        >
          📷
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </motion.label>
        {image && (
          <motion.span
            className="text-gray-300 text-sm truncate max-w-[150px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {image.name}
          </motion.span>
        )}
        <motion.input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={image ? "Describe this image..." : "Type or speak your message..."}
          className="flex-1 p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
          aria-label="Chat input"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
          whileFocus={{ boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }}
          transition={{ duration: 0.3 }}
        />
        <motion.button
          onClick={toggleListening}
          onHoverStart={() => setMicHovered(true)}
          onHoverEnd={() => setMicHovered(false)}
          className={`p-3 rounded-lg border border-indigo-500/30 ${
            isListening
              ? "bg-gradient-to-r from-red-600 to-pink-600"
              : "bg-gray-800/50"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          disabled={!browserSupportsSpeechRecognition}
        >
          <motion.div
            className="relative flex items-center justify-center"
            animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ repeat: isListening ? Infinity : 0, duration: 1, ease: "easeInOut" }}
          >
            <span className="text-xl">{isListening ? "🎙️" : "🎤"}</span>
            {isListening && (
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            )}
          </motion.div>
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          className="relative px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg text-white font-semibold text-sm sm:text-base shadow-lg overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label="Send message"
          disabled={!input.trim() && !image}
        >
          <span className="relative z-10">Send</span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </div>
      {!browserSupportsSpeechRecognition && (
        <motion.div
          className="mt-2 text-red-400 text-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          Speech recognition is not supported in this browser.
        </motion.div>
      )}
    </motion.div>
  );
};

// Chat Component
export default function Chat() {
  // Initialize conversationId from localStorage or generate new
  const storedConversationId = localStorage.getItem("conversationId");
  const [conversationId, setConversationId] = useState(storedConversationId || uuidv4());
  
  // Initialize messages from localStorage or empty array
  const storedMessages = localStorage.getItem(`messages_${conversationId}`);
  const [messages, setMessages] = useState(storedMessages ? JSON.parse(storedMessages) : []);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const userId = "user_123"; // Static for demo; replace with auth

  // Speech recognition
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);

  // Toggle mic for speech recognition
  const toggleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      console.log("Stopped listening");
    } else {
      if (!isMicrophoneAvailable) {
        console.error("Microphone not available");
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: "Error: Microphone not available. Please check permissions.",
          },
        ]);
        return;
      }
      SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
      setIsListening(true);
      console.log("Started listening");
    }
  };

  // Handle audio playback
  const handleToggleAudio = (messageId, audioUrl) => {
    console.log(`Toggling audio: messageId=${messageId}, audioUrl=${audioUrl}`);
    if (playingMessageId === messageId && playingAudio) {
      // Stop current audio
      playingAudio.pause();
      playingAudio.currentTime = 0;
      setPlayingAudio(null);
      setPlayingMessageId(null);
      console.log("Stopped audio for message:", messageId);
    } else {
      // Stop any existing audio
      if (playingAudio) {
        playingAudio.pause();
        playingAudio.currentTime = 0;
      }
      // Play new audio
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: `Error: Failed to play audio. ${err.message}`,
          },
        ]);
      });
      setPlayingAudio(audio);
      setPlayingMessageId(messageId);
      console.log("Playing audio for message:", messageId);

      // Reset when audio ends
      audio.onended = () => {
        setPlayingAudio(null);
        setPlayingMessageId(null);
        console.log("Audio ended for message:", messageId);
      };
    }
  };

  // Save conversationId and messages to localStorage
  useEffect(() => {
    localStorage.setItem("conversationId", conversationId);
    localStorage.setItem(`messages_${conversationId}`, JSON.stringify(messages));
    console.log("Saved to localStorage:", { conversationId, messages });
  }, [messages, conversationId]);

  // Memoize particle data
  const particles = useMemo(() => [...Array(10)].map(() => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.2})`,
    duration: Math.random() * 10 + 6,
  })), []);

  // Handle clearing chat
  const handleClearChat = () => {
    console.log("Clearing chat:", { conversationId });
    localStorage.removeItem(`messages_${conversationId}`);
    localStorage.removeItem("conversationId");
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setMessages([]);
    resetTranscript();
    setIsListening(false);
    SpeechRecognition.stopListening();
    if (playingAudio) {
      playingAudio.pause();
      playingAudio.currentTime = 0;
      setPlayingAudio(null);
      setPlayingMessageId(null);
    }
    console.log("Started new chat with conversationId:", newConversationId);
  };

  // Handle sending messages to backend
  const handleSendMessage = async (message, image = null) => {
    const userMessageContent = image ? `${message} (Image: ${image.name})` : message;
    const userMessage = { id: uuidv4(), role: "user", content: userMessageContent };
    console.log("Sending to backend:", { message, image: image?.name, conversationId, userId });

    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];
      console.log("Added user message:", updatedMessages);
      return updatedMessages;
    });
    setIsLoading(true);

    try {
      let response;
      if (image) {
        if (!(image instanceof File)) {
          throw new Error("Invalid image file. Please select a valid image.");
        }
        const formData = new FormData();
        formData.append("file", image);
        formData.append("message", message);
        formData.append("user_id", userId);
        formData.append("conversation_id", conversationId);

        console.log("FormData contents:", { file: image.name, message, user_id: userId, conversation_id: conversationId });

        response = await axios.post(`${BASE_URL}/image-search`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });
      } else {
        response = await axios.post(`${BASE_URL}/chat`, {
          message,
          role: "user",
          conversation_id: conversationId,
          user_id: userId,
        }, {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        });
      }

      console.log("Backend response:", response.data);

      setMessages((prev) => {
        const updatedMessages = [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: response.data.response || "No response content received.",
            audioUrl: image ? null : response.data.audio_url,
          },
        ];
        console.log("Added assistant message:", updatedMessages);
        return updatedMessages;
      });
    } catch (error) {
      console.error("API error:", error.message, error.response?.data);
      let errorMessage = "Failed to process request.";
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail, null, 2);
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("Messages state updated:", messages);
  }, [messages, isLoading]);

  // Cursor trail effect
  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 via-indigo-900 to-gray-900 text-white relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      onMouseMove={handleMouseMove}
    >
      {/* Cursor Trail Effect */}
      <motion.div
        className="absolute w-4 h-4 rounded-full bg-indigo-400/30 pointer-events-none"
        style={{ x: cursorPos.x - 8, y: cursorPos.y - 8 }}
        animate={{ scale: [1, 1.5, 0], opacity: [0.5, 0.2, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />

      {/* Particle Background */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.left,
            top: particle.top,
            background: particle.color,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [0, -100, -200],
            opacity: [0, 0.6, 0],
            x: Math.random() > 0.5 ? [0, 20, 40] : [0, -20, -40],
            scale: [1, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Chat Area */}
      <motion.div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-transparent relative z-10 pb-20 sm:pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Clear Chat Button */}
        <motion.div
          className="flex justify-end mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
        >
          <motion.button
            onClick={handleClearChat}
            className="relative px-4 py-2 bg-white/10 backdrop-blur-lg border border-indigo-500/30 rounded-lg text-gray-100 font-semibold text-sm sm:text-base shadow-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
            aria-label="Clear chat"
          >
            <span className="relative z-10">Clear Chat</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0"
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>

        {messages.length === 0 && !isLoading ? (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-gray-400"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 120 }}
          >
            <motion.div
              className="text-4xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              💬
            </motion.div>
            <p className="text-sm sm:text-base">Start a conversation with VoxMate!</p>
          </motion.div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                audioUrl={msg.audioUrl}
                messageId={msg.id}
                isPlaying={playingMessageId === msg.id}
                onToggleAudio={handleToggleAudio}
              />
            ))}
            {isLoading && (
              <MessageBubble role="assistant" content="" isTyping={true} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        transcript={transcript}
        resetTranscript={resetTranscript}
        isListening={isListening}
        toggleListening={toggleListening}
        browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
      />

      {/* Inline CSS for Markdown */}
      <style>{`
        .markdown h1, .markdown h2, .markdown h3 {
          color: #e0e7ff;
          margin-bottom: 0.5rem;
        }
        .markdown p {
          margin-bottom: 0.5rem;
        }
        .markdown code {
          font-family: 'Courier New', Courier, monospace;
        }
        .markdown pre {
          margin-bottom: 0.5rem;
        }
        .markdown ul, .markdown ol {
          margin-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </motion.div>
  );
}