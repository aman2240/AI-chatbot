import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

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
const MessageBubble = ({ role, content, isTyping, audioUrl }) => {
  const isUser = role === "user";
  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}
    >
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
          <>
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
            {audioUrl && !isUser && (
              <motion.audio
                controls
                src={`http://127.0.0.1:8000${audioUrl}`}
                className="mt-2 w-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

// ChatInput Component
const ChatInput = ({ onSend }) => {
  const [input, setInput] = useState("");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      await onSend(input);
      setInput("");
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
        <motion.input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
          aria-label="Chat input"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
          whileFocus={{ boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }}
          transition={{ duration: 0.3 }}
        />
        <motion.button
          onClick={handleSubmit}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          className="relative px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg text-white font-semibold text-sm sm:text-base shadow-lg overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label="Send message"
        >
          <span className="relative z-10">Send</span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Chat Component
export default function Chat() {
  // Initialize conversationId from localStorage or generate new
  const storedConversationId = localStorage.getItem("conversationId");
  const initialConversationId = storedConversationId || uuidv4();
  
  // Initialize messages from localStorage or empty array
  const storedMessages = localStorage.getItem(`messages_${initialConversationId}`);
  const initialMessages = storedMessages ? JSON.parse(storedMessages) : [];

  const [messages, setMessages] = useState(initialMessages);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const conversationId = useMemo(() => initialConversationId, []);
  const userId = "user_123"; // Static for demo; replace with auth

  // Save conversationId and messages to localStorage on update
  useEffect(() => {
    localStorage.setItem("conversationId", conversationId);
    localStorage.setItem(`messages_${conversationId}`, JSON.stringify(messages));
    console.log("Saved to localStorage:", { conversationId, messages }); // Debug
  }, [messages, conversationId]);

  // Memoize particle data
  const particles = useMemo(() => [...Array(10)].map(() => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.2})`,
    duration: Math.random() * 10 + 6,
  })), []);

  // Handle sending messages to backend
  const handleSendMessage = async (message) => {
    const userMessage = { id: uuidv4(), role: "user", content: message };
    console.log("Sending message to backend:", { message, conversationId, userId }); // Debug

    // Add user message and set loading state
    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];
      console.log("Added user message:", updatedMessages); // Debug
      return updatedMessages;
    });
    setIsLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/chat", {
        message,
        role: "user",
        conversation_id: conversationId,
        user_id: userId,
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000, // 10s timeout
      });
      console.log("Backend response:", response.data); // Debug

      // Add assistant message
      setMessages((prev) => {
        const updatedMessages = [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: response.data.response || "No response content received.",
            audioUrl: response.data.audio_url,
          },
        ];
        console.log("Added assistant message:", updatedMessages); // Debug
        return updatedMessages;
      });
    } catch (error) {
      console.error("API error:", error.message, error.response?.data); // Debug
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: `Error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("Messages state updated:", messages); // Debug
  }, [messages, isLoading]);

  // Cursor trail effect
  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      className="flex flex-col min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-950 via-indigo-900 to-gray-900 text-white relative overflow-hidden"
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

      {/* Floating AI Assistant */}
      <motion.div
        className="absolute bottom-32 right-4 sm:bottom-36 sm:right-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 backdrop-blur-md border border-indigo-400/40 shadow-xl flex items-center justify-center"
          animate={{
            y: [0, -6, 0],
            rotate: [0, 3, -3, 0],
            scale: messages.length > 0 ? [1, 1.1, 1] : 1,
          }}
          whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(139, 92, 246, 0.6)" }}
          transition={{
            y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1], rotate: [0, 360] }}
            transition={{ scale: { repeat: Infinity, duration: 2 }, rotate: { repeat: Infinity, duration: 12, ease: "linear" } }}
          >
            <motion.div
              className="text-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              🤖
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Chat Area */}
      <motion.div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-transparent relative z-10 pb-20 sm:pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
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
            <p className="text-sm sm:text-base">Start a conversation with Nested Minds!</p>
          </motion.div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                audioUrl={msg.audioUrl}
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
      <ChatInput onSend={handleSendMessage} />

      {/* Footer */}
      <motion.div
        className="fixed bottom-0 w-full py-3 text-center bg-gradient-to-t from-gray-950/80 to-transparent z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1, type: "spring", stiffness: 100 }}
      >
        <div className="flex flex-col items-center">
          <motion.p
            className="text-gray-300 text-xs sm:text-sm"
            animate={{ textShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 8px rgba(255,255,255,0.1)", "0 0 0 rgba(255,255,255,0)"] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            Powered by Nested Minds AI
          </motion.p>
        </div>
      </motion.div>

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