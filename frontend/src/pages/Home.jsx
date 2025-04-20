import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';

export default function Home() {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Set isLoaded to true after component mounts
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Memoize particle data to prevent re-renders
  const particles = useMemo(() => [...Array(20)].map(() => ({
    size: Math.random() * 6 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.4 + 0.2})`,
    duration: Math.random() * 12 + 8,
  })), []);

  // Handle cursor trail effect
  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-950 via-indigo-900 to-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Loading Screen */}
      {!isLoaded && (
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
        className="w-full flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
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

        {/* Floating Tech Logos */}
        <motion.div 
          className="absolute top-4 right-4 sm:top-8 sm:right-8 flex gap-3 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-indigo-400/40 shadow-lg"
            whileHover={{ scale: 1.2, rotate: 5, boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)' }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <span className="text-xs font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">GROQ</span>
          </motion.div>
          <motion.div
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-blue-400/40 shadow-lg"
            whileHover={{ scale: 1.2, rotate: -5, boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)' }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <span className="text-xs font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">EDGE</span>
          </motion.div>
        </motion.div>

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          {/* Animated Header */}
          <motion.div
            className="text-center mb-10 w-full"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.6, -0.05, 0.01, 0.99] }}
          >
            <motion.div
              className="relative inline-block"
              whileHover={{ scale: 1.03 }}
            >
              <h1
                className="text-5xl sm:text-7xl md:text-8xl font-extrabold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-500 tracking-tight"
                initial={{ scale: 0.9, opacity: 0, letterSpacing: '-0.05em' }}
                animate={{ scale: 1, opacity: 1, letterSpacing: '-0.02em' }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 120, 
                  damping: 12, 
                  delay: 0.4,
                  duration: 1.2
                }}
              >
                Nested Minds
              </h1>
              <motion.div
                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 1.2, ease: 'anticipate' }}
              />
            </motion.div>
            
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              Empowering human-AI collaboration with <span className="text-indigo-300 font-semibold">next-gen technology</span>. Enjoy seamless chats, document insights, and natural voice interactions.
            </motion.p>
          </motion.div>

          {/* Interactive Demo Section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-12 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            {/* Problem Visualization */}
            <motion.div
              className="relative bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-gray-600/30 shadow-xl overflow-hidden"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: 'backOut' }}
              whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)' }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              
              <div className="flex items-center gap-3 mb-5">
                <motion.div
                  className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  whileHover={{ rotate: [0, 10, -10, 0], boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
                  transition={{ rotate: { repeat: Infinity, duration: 2.5 }, boxShadow: { duration: 0.3 } }}
                >
                  <span className="text-2xl">😓</span>
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Traditional Hurdles</h3>
                  <p className="text-gray-300 text-sm">Overcoming outdated barriers</p>
                </div>
              </div>
              
              <motion.div className="space-y-3">
                {[
                  'Data overload and complexity',
                  'Language barriers',
                  'Slow processing speeds',
                  'Complex document handling'
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <p className="text-gray-200 text-sm">{item}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Solution Visualization */}
            <motion.div
              className="relative bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-600/30 shadow-xl overflow-hidden"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8, ease: 'backOut' }}
              whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)' }}
            >
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/10"
                    style={{
                      width: Math.random() * 80 + 40,
                      height: Math.random() * 80 + 40,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                    transition={{ duration: Math.random() * 8 + 4, repeat: Infinity, repeatType: 'reverse', delay: Math.random() * 2 }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <motion.div
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  whileHover={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.7)' }}
                  transition={{ rotate: { repeat: Infinity, duration: 6, ease: 'linear' }, boxShadow: { duration: 0.4 } }}
                >
                  <span className="text-2xl">🚀</span>
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Nested Minds Solution</h3>
                  <p className="text-indigo-200 text-sm">Redefining AI interaction</p>
                </div>
              </div>
              
              <motion.div className="space-y-3 relative z-10">
                {[
                  'Real-time multilingual chats',
                  'Smart document analysis',
                  'Natural voice synthesis',
                  'Ultra-fast Groq processing'
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.3 + index * 0.1 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-green-400"
                      animate={{ scale: [1, 1.3, 1] }}
                      whileHover={{ boxShadow: '0 0 8px rgba(74, 222, 128, 0.7)' }}
                      transition={{ scale: { repeat: Infinity, duration: 1.5 + index * 0.4 }, boxShadow: { duration: 0.3 } }}
                    />
                    <p className="text-gray-100 text-sm">{item}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Animated Connection Arrow */}
          <motion.div
            className="relative w-full max-w-sm h-24 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <motion.div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-red-400 via-indigo-500 to-blue-500"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ delay: 2, duration: 1.2, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.2, 1], backgroundColor: ['#fff', '#8b5cf6', '#fff'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 2.2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.6 }}
          >
            <motion.a
              href="/chat"
              className="relative px-6 py-3 text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 overflow-hidden"
              onHoverStart={() => setHoveredButton('chat')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              aria-label="Start Intelligent Chat"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 z-0"></div>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 z-0 opacity-0"
                animate={{ opacity: hoveredButton === 'chat' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              ></div>
              <motion.span 
                className="relative z-10 flex items-center gap-2"
                whileHover={{ x: 4 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start Intelligent Chat
              </motion.span>
              <motion.div 
                className="absolute -bottom-1 left-0 right-0 h-1 bg-white/40 z-0"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: hoveredButton === 'chat' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
            
            <motion.a
              href="/upload-pdf"
              className="relative px-6 py-3 text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 overflow-hidden"
              onHoverStart={() => setHoveredButton('upload')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              aria-label="Upload Documents"
            >
              <div className="absolute inset-0 bg-gray-700/70 border border-gray-600 z-0"></div>
              <div 
                className="absolute inset-0 bg-gray-600/70 border border-gray-500 z-0 opacity-0"
                animate={{ opacity: hoveredButton === 'upload' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              ></div>
              <motion.span 
                className="relative z-10 flex items-center gap-2"
                whileHover={{ x: 4 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Documents
              </motion.span>
              <motion.div 
                className="absolute -bottom-1 left-0 right-0 h-1 bg-white/40 z-0"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: hoveredButton === 'upload' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>

            <motion.a
              href="/text-to-audio"
              className="relative px-6 py-3 text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 overflow-hidden"
              onHoverStart={() => setHoveredButton('text-to-audio')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              aria-label="Text to Audio"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 z-0"></div>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 z-0 opacity-0"
                animate={{ opacity: hoveredButton === 'text-to-audio' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              ></div>
              <motion.span 
                className="relative z-10 flex items-center gap-2"
                whileHover={{ x: 4 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l-7-7 7-7m4 14l7-7-7-7m-4 7h8" />
                </svg>
                Text to Audio
              </motion.span>
              <motion.div 
                className="absolute -bottom-1 left-0 right-0 h-1 bg-white/40 z-0"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: hoveredButton === 'text-to-audio' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          </motion.div>

          {/* Floating AI Assistant */}
          <motion.div
            className="absolute -bottom-16 right-0 sm:-bottom-20 sm:right-4"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ delay: 2.8, duration: 0.8 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 backdrop-blur-md border border-indigo-400/40 shadow-xl flex items-center justify-center"
              animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)' }}
              transition={{ 
                y: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
                rotate: { repeat: Infinity, duration: 7, ease: 'easeInOut' },
                scale: { duration: 0.3 }
              }}
            >
              <motion.div
                className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 360] }}
                transition={{ scale: { repeat: Infinity, duration: 2.5 }, rotate: { repeat: Infinity, duration: 15, ease: 'linear' } }}
              >
                <motion.div
                  className="text-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                >
                  🤖
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="w-full py-5 text-center mt-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2, duration: 0.5 }}
        >
          <div className="flex flex-col items-center">
            <motion.p
              className="text-gray-300 text-xs sm:text-sm mb-1"
              animate={{ textShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 8px rgba(255,255,255,0.1)', '0 0 0 rgba(255,255,255,0)'] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              Advanced AI Interaction Platform
            </motion.p>
            <div className="flex items-center justify-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              />
              <p className="text-gray-400 text-xs">Powered by Groq</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}