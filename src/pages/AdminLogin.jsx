// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark"); // default dark
  const navigate = useNavigate();

  // Auto redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/admin/dashboard");
    });
    return unsubscribe;
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const containerClass =
    theme === "dark"
      ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-4"
      : "min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4";

  const cardClass =
    theme === "dark"
      ? "max-w-md w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-700 text-white transition-all duration-300"
      : "max-w-md w-full bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-gray-300 text-black transition-all duration-300";

  const inputClass =
    "w-full p-3 rounded placeholder:text-slate-400 focus:ring-2 outline-none transition " +
    (theme === "dark" ? "bg-white/10 focus:ring-sky-500 text-white" : "bg-gray-100 focus:ring-blue-500 text-black placeholder:text-gray-500");

  const buttonClass =
    "w-full p-3 rounded font-semibold transition-all duration-300 " +
    (loading
      ? theme === "dark"
        ? "bg-sky-400/60 cursor-not-allowed"
        : "bg-blue-400/60 cursor-not-allowed"
      : theme === "dark"
      ? "bg-sky-600 hover:bg-sky-500 text-white"
      : "bg-blue-600 hover:bg-blue-500 text-white");

  const errorClass =
    theme === "dark"
      ? "text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded mb-3 text-center"
      : "text-red-700 bg-red-100 border border-red-200 p-2 rounded mb-3 text-center";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <h2 className={theme === "dark" ? "text-3xl font-bold mb-6 text-center text-sky-400" : "text-3xl font-bold mb-6 text-center text-blue-600"}>
          Admin Sign In
        </h2>

        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className={theme === "dark" ? "bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 font-bold" : "bg-gray-300 text-black px-4 py-2 rounded-full hover:bg-gray-200 font-bold"}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {error && <div className={errorClass}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
