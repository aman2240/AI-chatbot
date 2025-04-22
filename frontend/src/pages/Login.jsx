import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Main Component
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Simulate page load
  React.useEffect(() => {
    setTimeout(() => setIsPageLoaded(true), 1000);
  }, []);

  // Memoize particle data
  const particles = useMemo(() => [...Array(10)].map(() => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.2})`,
    duration: Math.random() * 10 + 6,
  })), []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    setIsLoading(true);
    console.log("Login attempt:", { email, password });
    setTimeout(() => {
      setIsLoading(false);
      setEmail("");
      setPassword("");
      console.log("Login successful (dummy)");
    }, 1000);
  };

  // Cursor trail effect
  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-900 to-gray-900 text-white flex flex-col items-center p-4 sm:p-6 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
    >

      {/* Main Content */}
      <motion.div
        className="w-full max-w-md flex flex-col items-center"
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
          Login to VoxMate
        </motion.h2>

        {/* Login Form */}
        <motion.div
          className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-600/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)" }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              className="text-3xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              🔐
            </motion.div>
            <p className="text-gray-300 mb-4">
              Enter your credentials to access VoxMate
            </p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
                whileFocus={{ boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }}
                transition={{ duration: 0.3 }}
                aria-label="Email"
              />
              <motion.input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="p-3 rounded-lg bg-gray-800/50 text-gray-100 placeholder-gray-400 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
                whileFocus={{ boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }}
                transition={{ duration: 0.3 }}
                aria-label="Password"
              />
              {error && (
                <motion.p
                  className="text-red-400 text-sm break-words"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {error}
                </motion.p>
              )}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg text-white font-semibold ${
                  isLoading
                    ? "bg-gray-600/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-blue-500"
                }`}
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
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
                  "Login"
                )}
              </motion.button>
            </form>
            <motion.p
              className="mt-4 text-gray-300 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Sign Up
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}