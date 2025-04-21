import React from "react";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL } from "../constants/constants";

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
      return <div className="text-red-400 p-4 text-center">Failed to render summary. Please try again.</div>;
    }
    return this.props.children;
  }
}

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("Summarize the document in a few sentences.");
  const [summaryText, setSummaryText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [uploadId, setUploadId] = useState(null);
  const [conversationId, setConversationId] = useState(localStorage.getItem("conversationId") || uuidv4());
  const userId = "user_123";

  // Initialize from localStorage
  useEffect(() => {
    const storedUploadId = localStorage.getItem("uploadId");
    const storedSummaryText = localStorage.getItem(`summaryText_${storedUploadId}`);
    const storedFilename = localStorage.getItem(`filename_${storedUploadId}`);
    const storedPrompt = localStorage.getItem(`prompt_${storedUploadId}`);
    
    if (storedUploadId && storedSummaryText && storedFilename && storedPrompt) {
      setUploadId(storedUploadId);
      setSummaryText(storedSummaryText);
      setPrompt(storedPrompt);
      console.log("Loaded from localStorage:", { uploadId: storedUploadId, summaryText: storedSummaryText, filename: storedFilename, prompt: storedPrompt });
    }
    localStorage.setItem("conversationId", conversationId);
    setIsPageLoaded(true);
  }, [conversationId]);

  // Save to localStorage
  useEffect(() => {
    if (uploadId && summaryText && file && prompt) {
      localStorage.setItem("uploadId", uploadId);
      localStorage.setItem(`summaryText_${uploadId}`, summaryText);
      localStorage.setItem(`filename_${uploadId}`, file.name);
      localStorage.setItem(`prompt_${uploadId}`, prompt);
      console.log("Saved to localStorage:", { uploadId, summaryText, filename: file.name, prompt });
    }
  }, [uploadId, summaryText, file, prompt]);

  // Memoize particle data
  const particles = useMemo(() => [...Array(15)].map(() => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.2})`,
    duration: Math.random() * 10 + 6,
  })), []);

  // Handle clear chat
  const handleClearChat = () => {
    console.log("Clearing chat:", { conversationId, uploadId });
    // Clear localStorage
    if (uploadId) {
      localStorage.removeItem(`summaryText_${uploadId}`);
      localStorage.removeItem(`filename_${uploadId}`);
      localStorage.removeItem(`prompt_${uploadId}`);
      localStorage.removeItem("uploadId");
    }
    localStorage.removeItem(`messages_${conversationId}`);
    localStorage.removeItem("conversationId");
    // Reset states
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setFile(null);
    setPrompt("Summarize the document in a few sentences.");
    setSummaryText("");
    setUploadId(null);
    setError("");
    console.log("Started new chat with conversationId:", newConversationId);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf" && selectedFile instanceof File) {
      setFile(selectedFile);
      setError("");
      console.log("Selected file:", { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type });
    } else {
      setError("Please upload a valid PDF file.");
      setFile(null);
      console.warn("Invalid file selected:", selectedFile);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf" && droppedFile instanceof File) {
      setFile(droppedFile);
      setError("");
      console.log("Dropped file:", { name: droppedFile.name, size: droppedFile.size, type: droppedFile.type });
    } else {
      setError("Please drop a valid PDF file.");
      setFile(null);
      console.warn("Invalid file dropped:", droppedFile);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }
    if (!(file instanceof File)) {
      setError("Invalid file object. Please select a valid PDF file.");
      return;
    }
    if (!prompt.trim() || prompt.length < 5) {
      setError("Please enter a valid summarization prompt (at least 5 characters).");
      return;
    }
    setIsLoading(true);
    setError("");
    const newUploadId = uuidv4();
    setUploadId(newUploadId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("conversation_id", conversationId);
    formData.append("prompt", prompt);

    console.log("Sending to backend:", { user_id: userId, conversation_id: conversationId, prompt, filename: file.name });

    try {
      const response = await axios.post(`${BASE_URL}/upload-pdf/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      console.log("Backend response:", response.data);
      setSummaryText(response.data.response || "No summary generated.");
    } catch (err) {
      console.error("Full error object:", err);
      let errorMessage = "Failed to process PDF.";
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail, null, 2);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(`Error: ${errorMessage}`);
      setSummaryText("");
    } finally {
      setIsLoading(false);
    }
  };

  // Cursor trail effect
  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-900 to-gray-900 text-white flex flex-col items-center p-4 sm:p-6 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Loading Screen */}
      {!isPageLoaded && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400"
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            Team Nested Minds
          </motion.h1>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        className="w-full max-w-4xl flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPageLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        {/* Cursor Trail Effect */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-indigo-400/30 pointer-events-none"
          style={{ x: cursorPos.x - 8, y: cursorPos.y - 8 }}
          animate={{ scale: [1, 1.5, 0], opacity: [0.5, 0.2, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeOut" }}
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
              y: [0, -150, -300],
              opacity: [0, 0.7, 0],
              x: Math.random() > 0.5 ? [0, 30, 60] : [0, -30, -60],
              scale: [1, 1.3, 0.7],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 4,
            }}
          />
        ))}

        {/* Header */}
        <motion.h2
          className="text-4xl sm:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 120 }}
        >
          Upload & Summarize PDF
        </motion.h2>

        {/* Clear Chat Button */}
        <motion.div
          className="w-full flex justify-end mb-4"
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

        {/* Upload Area */}
        <motion.div
          className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-600/30 shadow-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)" }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              className="text-3xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              📄
            </motion.div>
            <p className="text-gray-300 mb-4">
              Drag and drop a PDF file here or click to select
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <motion.label
              htmlFor="pdf-upload"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg text-white font-semibold cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              Choose File
            </motion.label>
            {file && (
              <motion.p
                className="mt-4 text-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                Selected: {file.name}
              </motion.p>
            )}
            <motion.input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Summarize the document in a few sentences"
              className="mt-4 w-full max-w-md p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
              whileFocus={{ boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }}
              transition={{ duration: 0.3 }}
              title="Enter a clear summarization instruction"
            />
            {error && (
              <motion.p
                className="mt-4 text-red-400 max-w-md text-sm break-words"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {error}
              </motion.p>
            )}
            <motion.button
              onClick={handleUpload}
              disabled={!file || isLoading || !prompt.trim() || prompt.length < 5}
              className={`mt-6 px-6 py-3 rounded-lg text-white font-semibold ${
                file && !isLoading && prompt.trim() && prompt.length >= 5
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500"
                  : "bg-gray-600/50 cursor-not-allowed"
              }`}
              whileHover={{ scale: file && !isLoading && prompt.trim() && prompt.length >= 5 ? 1.05 : 1 }}
              whileTap={{ scale: file && !isLoading && prompt.trim() && prompt.length >= 5 ? 0.95 : 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {isLoading ? (
                <motion.div
                  className="flex space-x-2"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </motion.div>
              ) : (
                "Upload & Summarize"
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Display */}
        {summaryText && (
          <motion.div
            className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-600/30 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Summary</h3>
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
                  {summaryText}
                </ReactMarkdown>
              </div>
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Floating AI Assistant */}
        <motion.div
          className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 backdrop-blur-md border border-indigo-400/40 shadow-xl flex items-center justify-center"
            animate={{
              y: [0, -6, 0],
              rotate: [0, 3, -3, 0],
              scale: summaryText ? [1, 1.1, 1] : 1,
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
    </motion.div>
  );
}