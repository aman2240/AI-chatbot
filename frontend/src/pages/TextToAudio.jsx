import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BASE_URL } from '../constants/constants';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function TextToAudio() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [audioUrl, setAudioUrl] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [conversationId, setConversationId] = useState(localStorage.getItem('conversationId') || uuidv4());

  // Debounce text input for 2 seconds
  const debouncedText = useDebounce(text, 2000);

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English (US, Aria)' },
    { value: 'en-gb', label: 'English (UK, Libby)' },
    { value: 'hi', label: 'Hindi (Swara)' },
    { value: 'fr', label: 'French (Denise)' },
    { value: 'de', label: 'German (Katja)' },
    { value: 'es', label: 'Spanish (Spain, Elvira)' },
    { value: 'es-mx', label: 'Spanish (Mexico, Dalia)' },
    { value: 'it', label: 'Italian (Elsa)' },
    { value: 'ja', label: 'Japanese (Nanami)' },
    { value: 'ko', label: 'Korean (SunHi)' },
    { value: 'zh', label: 'Chinese (Simplified, Xiaoxiao)' },
    { value: 'zh-hk', label: 'Chinese (Cantonese, HiuMaan)' },
    { value: 'zh-tw', label: 'Chinese (Taiwan, HsiaoChen)' },
    { value: 'pt', label: 'Portuguese (Brazil, Francisca)' },
    { value: 'pt-pt', label: 'Portuguese (Portugal, Raquel)' },
    { value: 'ru', label: 'Russian (Svetlana)' },
    { value: 'tr', label: 'Turkish (Emel)' },
    { value: 'ar', label: 'Arabic (Egypt, Salma)' },
    { value: 'id', label: 'Indonesian (Gadis)' },
    { value: 'th', label: 'Thai (Premwadee)' },
    { value: 'vi', label: 'Vietnamese (HoaiMy)' },
    { value: 'nl', label: 'Dutch (Fenna)' },
    { value: 'pl', label: 'Polish (Zofia)' },
    { value: 'sv', label: 'Swedish (Sofie)' },
    { value: 'no', label: 'Norwegian (Iselin)' },
    { value: 'fi', label: 'Finnish (Selma)' },
    { value: 'da', label: 'Danish (Christel)' },
    { value: 'he', label: 'Hebrew (Hila)' },
    { value: 'cs', label: 'Czech (Vlasta)' },
    { value: 'el', label: 'Greek (Athina)' },
    { value: 'ro', label: 'Romanian (Alina)' },
    { value: 'hu', label: 'Hungarian (Noemi)' },
    { value: 'sk', label: 'Slovak (Viktoria)' },
    { value: 'uk', label: 'Ukrainian (Polina)' },
  ];

  // Initialize from localStorage
  useEffect(() => {
    const storedText = localStorage.getItem(`text_${conversationId}`);
    const storedAudioUrl = localStorage.getItem(`audioUrl_${conversationId}`);
    const storedLanguage = localStorage.getItem(`language_${conversationId}`);
    const storedTranslatedText = localStorage.getItem(`translatedText_${conversationId}`);
    if (storedText && storedAudioUrl) {
      setText(storedText);
      setAudioUrl(storedAudioUrl);
      setLanguage(storedLanguage || 'en');
      setTranslatedText(storedTranslatedText || '');
      console.log('Loaded from localStorage:', { conversationId, text: storedText, audioUrl: storedAudioUrl, language: storedLanguage, translatedText: storedTranslatedText });
    }
    localStorage.setItem('conversationId', conversationId);
    setIsPageLoaded(true);
  }, [conversationId]);

  // Save to localStorage
  useEffect(() => {
    if (text || translatedText || audioUrl || language) {
      localStorage.setItem(`text_${conversationId}`, text);
      localStorage.setItem(`audioUrl_${conversationId}`, audioUrl || '');
      localStorage.setItem(`language_${conversationId}`, language);
      localStorage.setItem(`translatedText_${conversationId}`, translatedText);
      console.log('Saved to localStorage:', { conversationId, text, audioUrl, language, translatedText });
    }
  }, [text, audioUrl, language, translatedText, conversationId]);

  // Memoize particle data
  const particles = useMemo(() => [...Array(15)].map(() => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.2})`,
    duration: Math.random() * 10 + 6,
  })), []);

  // Handle translation
  const handleTranslate = async (inputText) => {
    if (!inputText.trim() || inputText.length < 5) {
      setError('Please enter at least 5 characters of text.');
      setTranslatedText('');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const payload = { text: inputText, target_language: language };
      const endpoint = `${BASE_URL}/speak-translated/`;
      console.log('Sending translation payload to', endpoint, ':', payload);
      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      console.log('Translation response:', response.data);
      setTranslatedText(response.data.translated_text || '');
    } catch (err) {
      console.error('Translation error:', err);
      let errorMessage = 'Failed to translate text.';
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail, null, 2);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(`Error: ${errorMessage}`);
      setTranslatedText('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle audio conversion
  const handleConvert = async () => {
    if (!translatedText.trim() || translatedText.length < 5) {
      setError('Translated text must be at least 5 characters.');
      setAudioUrl(null);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const payload = { text: translatedText, language };
      const endpoint = `${BASE_URL}/speak-translated/`;
      console.log('Sending audio conversion payload to', endpoint, ':', payload);
      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      console.log('Audio conversion response:', response.data);
      setAudioUrl(response.data.audio_url);
    } catch (err) {
      console.error('Audio conversion error:', err);
      let errorMessage = 'Failed to convert translated text to audio.';
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail, null, 2);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(`Error: ${errorMessage}`);
      setAudioUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-translate on debounced text or language change
  useEffect(() => {
    if (debouncedText) {
      handleTranslate(debouncedText);
    } else {
      setTranslatedText('');
      setError('');
    }
  }, [debouncedText, language]);

  // Handle clear chat
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat and audio data?')) {
      console.log('Clearing chat:', { conversationId });
      localStorage.removeItem(`text_${conversationId}`);
      localStorage.removeItem(`audioUrl_${conversationId}`);
      localStorage.removeItem(`language_${conversationId}`);
      localStorage.removeItem(`translatedText_${conversationId}`);
      localStorage.removeItem(`messages_${conversationId}`);
      localStorage.removeItem('conversationId');
      const newConversationId = uuidv4();
      setConversationId(newConversationId);
      setText('');
      setLanguage('en');
      setAudioUrl(null);
      setTranslatedText('');
      setError('');
      console.log('Started new chat with conversationId:', newConversationId);
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
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
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
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeOut' }}
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
              ease: 'linear',
              delay: Math.random() * 4,
            }}
          />
        ))}

        {/* Header */}
        <motion.h2
          className="text-4xl sm:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 120 }}
        >
          Text to Audio
        </motion.h2>

        {/* Clear Chat Button */}
        <motion.div
          className="w-full flex justify-end mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 100 }}
        >
          <motion.button
            onClick={handleClearChat}
            className="relative px-4 py-2 bg-white/10 backdrop-blur-lg border border-indigo-500/30 rounded-lg text-gray-100 font-semibold text-sm sm:text-base shadow-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400 }}
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

        {/* Input Area */}
        <motion.div
          className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-600/30 shadow-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)' }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              className="text-3xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              🎙️
            </motion.div>
            <p className="text-gray-300 mb-4">
              Enter text to translate and convert to audio
            </p>
            <motion.textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Enter text to translate and hear as audio"
              className="w-full max-w-md p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base resize-y"
              rows="5"
              whileFocus={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
              transition={{ duration: 0.3 }}
              title="Enter text for translation and audio conversion"
              disabled={isLoading}
            />
            <div className="relative w-full max-w-md mt-4">
              <motion.select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-800/50 text-gray-100 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base appearance-none"
                disabled={isLoading}
                whileFocus={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
                transition={{ duration: 0.3 }}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
              {isLoading && (
                <motion.div
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                </motion.div>
              )}
            </div>
            {translatedText && (
              <motion.div
                className="w-full max-w-md mt-4 p-3 rounded-lg bg-white/10 backdrop-blur-lg border border-indigo-600/30 text-gray-100 text-sm sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p className="font-semibold text-indigo-300 mb-2">
                  Translated Text{isLoading ? ' (Translating...)' : ''}
                </p>
                <p>{translatedText}</p>
              </motion.div>
            )}
            {error && (
              <motion.div
                className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 max-w-md text-sm break-words"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {error}
                <button
                  onClick={() => setError('')}
                  className="ml-2 text-red-300 hover:text-red-100"
                >
                  ✕
                </button>
              </motion.div>
            )}
            <motion.button
              onClick={handleConvert}
              disabled={!translatedText.trim() || isLoading || translatedText.length < 5}
              className={`mt-6 px-6 py-3 rounded-lg text-white font-semibold ${
                translatedText.trim() && !isLoading && translatedText.length >= 5
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                  : 'bg-gray-600/50 cursor-not-allowed'
              }`}
              whileHover={{ scale: translatedText.trim() && !isLoading && translatedText.length >= 5 ? 1.05 : 1 }}
              whileTap={{ scale: translatedText.trim() && !isLoading && translatedText.length >= 5 ? 0.95 : 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
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
                'Convert to Audio'
              )}
            </motion.button>
            {audioUrl && (
              <motion.audio
                controls
                src={audioUrl}
                className="mt-6 w-full max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </div>
        </motion.div>

        {/* Floating AI Assistant */}
        <motion.div
          className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6, type: 'spring', stiffness: 100 }}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 backdrop-blur-md border border-indigo-400/40 shadow-xl flex items-center justify-center"
            animate={{
              y: [0, -6, 0],
              rotate: [0, 3, -3, 0],
              scale: audioUrl ? [1, 1.1, 1] : 1,
            }}
            whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)' }}
            transition={{
              y: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
              scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1], rotate: [0, 360] }}
              transition={{ scale: { repeat: Infinity, duration: 2 }, rotate: { repeat: Infinity, duration: 12, ease: 'linear' } }}
            >
              <motion.div
                className="text-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                🤖
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}