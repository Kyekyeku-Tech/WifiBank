// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [theme, setTheme] = useState("dark");
  const navigate = useNavigate();

  // Redirect if already logged in and role is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check role in Firestore
        const q = query(
          collection(db, "adminUsers"),
          where("email", "==", user.email)
        );
        const snap = await getDocs(q);
        const userData = snap.docs[0]?.data();

        if (userData?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          await signOut(auth);
        }
      }
    });
    return unsubscribe;
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Admin account created successfully!");
      } else {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        // Check role in Firestore
        const q = query(
          collection(db, "adminUsers"),
          where("email", "==", user.email)
        );
        const snap = await getDocs(q);
        const userData = snap.docs[0]?.data();

        if (!userData || userData.role !== "admin") {
          setError("Access denied: only admins can log in.");
          await signOut(auth);
          setLoading(false);
          return;
        }

        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  const toggleTheme = () =>
    setTheme(theme === "dark" ? "light" : "dark");

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
    (theme === "dark"
      ? "bg-white/10 focus:ring-sky-500 text-white"
      : "bg-gray-100 focus:ring-blue-500 text-black placeholder:text-gray-500");

  const buttonClass =
    "w-full p-3 rounded font-semibold transition-all duration-300 " +
    (loading
      ? theme === "dark"
        ? "bg-sky-400/60 cursor-not-allowed"
        : "bg-blue-400/60 cursor-not-allowed"
      : theme === "dark"
      ? "bg-sky-600 hover:bg-sky-500 text-white"
      : "bg-blue-600 hover:bg-blue-500 text-white");

  const secondaryBtn =
    "w-full text-center mt-3 font-semibold transition " +
    (theme === "dark"
      ? "text-sky-400 hover:text-sky-300"
      : "text-blue-600 hover:text-blue-500");

  const errorClass =
    theme === "dark"
      ? "text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded mb-3 text-center"
      : "text-red-700 bg-red-100 border border-red-200 p-2 rounded mb-3 text-center";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <h2
          className={
            theme === "dark"
              ? "text-3xl font-bold mb-6 text-center text-sky-400"
              : "text-3xl font-bold mb-6 text-center text-blue-600"
          }
        >
          {isRegister ? "Create Admin Account" : "Admin Sign In"}
        </h2>

        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className={
              theme === "dark"
                ? "bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 font-bold"
                : "bg-gray-300 text-black px-4 py-2 rounded-full hover:bg-gray-200 font-bold"
            }
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {error && <div className={errorClass}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
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
            {loading
              ? isRegister
                ? "Creating..."
                : "Signing in..."
              : isRegister
              ? "Register Admin"
              : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className={secondaryBtn}
        >
          {isRegister
            ? "Already have an account? Sign In"
            : "Create new admin account"}
        </button>
      </div>
    </div>
  );
}
