import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL } from "../constants/constants";

// Supported languages for translation
const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "en-us", name: "English (US)" },
  { code: "en-gb", name: "English (UK)" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "es-mx", name: "Spanish (Mexico)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "zh-cn", name: "Chinese (China)" },
  { code: "zh-hk", name: "Chinese (Hong Kong)" },
  { code: "zh-tw", name: "Chinese (Taiwan)" },
  { code: "pt", name: "Portuguese" },
  { code: "pt-pt", name: "Portuguese (Portugal)" },
  { code: "ru", name: "Russian" },
  { code: "tr", name: "Turkish" },
  { code: "ar", name: "Arabic" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "sk", name: "Slovak" },
  { code: "uk", name: "Ukrainian" },
];

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
const MessageBubble = ({ content, audioUrl, messageId, isPlaying, onToggleAudio }) => {
  console.debug(`MessageBubble: messageId=${messageId}, audioUrl=${audioUrl}, isPlaying=${isPlaying}`);

  return (
    <motion.div
      className="flex justify-start mb-4 items-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 120 }}
    >
      {audioUrl && (
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
        className="max-w-[80%] sm:max-w-[60%] p-3 sm:p-4 rounded-xl shadow-md bg-white/10 backdrop-blur-lg border border-indigo-600/30 text-gray-100"
      >
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
      </div>
    </motion.div>
  );
};

// TranslationInput Component
const TranslationInput = ({ onTranslate }) => {
  const [translateText, setTranslateText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (translateText.trim()) {
      await onTranslate(translateText, targetLanguage);
      setTranslateText("");
    }
  };

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-lg border border-indigo-600/30 p-4 sm:p-6 rounded-lg mb-4"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1, scale: focused ? 1.02 : 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      <div className="flex flex-col gap-3">
        <motion.input
          type="text"
          value={translateText}
          onChange={(e) => setTranslateText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Enter text to translate..."
          className="p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
          aria-label="Translation input"
          whileFocus={{ boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }}
          transition={{ duration: 0.3 }}
        />
        <div className="flex items-center gap-3">
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="p-3 rounded-lg bg-gray-800/50 text-gray-100 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
            aria-label="Select target language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <motion.button
            onClick={handleSubmit}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg text-white font-semibold text-sm sm:text-base shadow-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
            aria-label="Translate"
            disabled={!translateText.trim()}
          >
            <span className="relative z-10">Translate</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0"
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export default function Translator() {
  // Initialize translations from localStorage or empty array
  const storedTranslations = localStorage.getItem("translations");
  const [translations, setTranslations] = useState(() => {
    try {
      return storedTranslations ? JSON.parse(storedTranslations) : [];
    } catch (error) {
      console.error("Failed to parse translations from localStorage:", error);
      return [];
    }
  });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const translationsEndRef = useRef(null);

  // Save translations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("translations", JSON.stringify(translations));
      console.log("Saved translations to localStorage:", translations);
    } catch (error) {
      console.error("Failed to save translations to localStorage:", error);
    }
  }, [translations]);

  // Handle translation
  const handleTranslate = async (text, targetLanguage) => {
    console.log("Sending to /speak-translated/:", { text, target_language: targetLanguage });
    setIsLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/speak-translated/`, {
        text,
        target_language: targetLanguage,
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });

      console.log("Translation response:", response.data);

      const newTranslation = {
        id: uuidv4(),
        content: `Translated to ${SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage).name}: ${response.data.translated_text}`,
        audioUrl: response.data.audio_url,
      };

      setTranslations((prev) => [...prev, newTranslation]);

      // Auto-play the translation audio
      const audio = new Audio(response.data.audio_url);
      audio.play().catch((err) => {
        console.error("Translation audio playback error:", err);
        setTranslations((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: `Error: Failed to play translation audio. ${err.message}`,
          },
        ]);
      });
      setPlayingAudio(audio);
      setPlayingMessageId(newTranslation.id);
      audio.onended = () => {
        setPlayingAudio(null);
        setPlayingMessageId(null);
        console.log("Translation audio ended");
      };
    } catch (error) {
      console.error("Translation API error:", error.message, error.response?.data);
      let errorMessage = "Failed to translate text.";
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail, null, 2);
      } else if (error.message) {
        errorMessage = error.message;
      }
      setTranslations((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
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
        setTranslations((prev) => [
          ...prev,
          {
            id: uuidv4(),
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

  // Handle clearing translations
  const handleClearTranslations = () => {
    console.log("Clearing translations");
    localStorage.removeItem("translations");
    setTranslations([]);
    if (playingAudio) {
      playingAudio.pause();
      playingAudio.currentTime = 0;
      setPlayingAudio(null);
      setPlayingMessageId(null);
    }
    console.log("Cleared translations");
  };

  // Scroll to bottom on new translations
  useEffect(() => {
    translationsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("Translations state updated:", translations);
  }, [translations, isLoading]);

  // Memoize particle data
  const particles = useMemo(() => [...Array(10)].map(() => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.2})`,
    duration: Math.random() * 10 + 6,
  })), []);

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

      {/* Translation Area */}
      <motion.div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-transparent relative z-10 pb-20 sm:pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Clear Translations Button */}
        <motion.div
          className="flex justify-end mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
        >
          <motion.button
            onClick={handleClearTranslations}
            className="relative px-4 py-2 bg-white/10 backdrop-blur-lg border border-indigo-500/30 rounded-lg text-gray-100 font-semibold text-sm sm:text-base shadow-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
            aria-label="Clear translations"
          >
            <span className="relative z-10">Clear Translations</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0"
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>

        {/* Translation Input */}
        <TranslationInput onTranslate={handleTranslate} />

        {translations.length === 0 && !isLoading ? (
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
            <p className="text-sm sm:text-base">Translate text with VoxMate!</p>
          </motion.div>
        ) : (
          <>
            {translations.map((trans) => (
              <MessageBubble
                key={trans.id}
                content={trans.content}
                audioUrl={trans.audioUrl}
                messageId={trans.id}
                isPlaying={playingMessageId === trans.id}
                onToggleAudio={handleToggleAudio}
              />
            ))}
            {isLoading && (
              <motion.div
                className="flex justify-start mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 120 }}
              >
                <div
                  className="max-w-[80%] sm:max-w-[60%] p-3 sm:p-4 rounded-xl shadow-md bg-white/10 backdrop-blur-lg border border-indigo-600/30 text-gray-100"
                >
                  <motion.div
                    className="flex space-x-2"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  >
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={translationsEndRef} />
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