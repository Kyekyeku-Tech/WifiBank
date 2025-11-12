// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [credentials, setCredentials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [loadingTrans, setLoadingTrans] = useState(true);

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [packageId, setPackageId] = useState("bronze-1w");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);

  const packages = [
    { id: "bronze-1w", name: "Bronze — 1 Week" },
    { id: "silver-2w", name: "Silver — 2 Weeks" },
    { id: "gold-3w", name: "Gold — 3 Weeks" },
    { id: "vip-1m", name: "Platinum — 1 Month" },
  ];

  // Load credentials
  useEffect(() => {
    async function loadCreds() {
      try {
        const snap = await getDocs(collection(db, "credentials"));
        setCredentials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCreds(false);
      }
    }
    loadCreds();
  }, []);

  // Load transactions
  useEffect(() => {
    async function loadTransactions() {
      try {
        const snap = await getDocs(collection(db, "transactions"));
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrans(false);
      }
    }
    loadTransactions();
  }, []);

  // Add new credential
  const addCredential = async () => {
    if (!username || !password || !packageId) return alert("Fill all fields.");
    setProcessing(true);
    try {
      await addDoc(collection(db, "credentials"), {
        username,
        password,
        packageId,
        description,
        used: false,
        assignedTo: null,
        createdAt: new Date(),
      });
      alert("Credential added!");
      setUsername(""); setPassword(""); setDescription("");
      // Refresh credentials
      const snap = await getDocs(collection(db, "credentials"));
      setCredentials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      alert("Failed to add credential.");
    } finally {
      setProcessing(false);
    }
  };

  // Delete credential
  const deleteCredential = async (id) => {
    if (!window.confirm("Delete this credential?")) return;
    try {
      await deleteDoc(doc(db, "credentials", id));
      setCredentials(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  // Mark credential as unused (optional)
  const resetCredential = async (id) => {
    try {
      await updateDoc(doc(db, "credentials", id), { used: false, assignedTo: null });
      setCredentials(prev => prev.map(c => c.id === id ? { ...c, used: false, assignedTo: null } : c));
    } catch (err) {
      console.error(err);
      alert("Failed to reset.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-sky-400 mb-2">Admin Dashboard</h1>
          <p className="text-slate-300">Manage credentials and track transactions</p>
        </header>

        {/* Add Credential Form */}
        <section className="bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Add Credential</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="p-2 rounded bg-white/10"
            />
            <input
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="p-2 rounded bg-white/10"
            />
            <select
              value={packageId}
              onChange={e => setPackageId(e.target.value)}
              className="p-2 rounded bg-white/10"
            >
              {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="p-2 rounded bg-white/10"
            />
          </div>
          <button
            onClick={addCredential}
            disabled={processing}
            className="mt-4 bg-sky-600 px-4 py-2 rounded-full hover:bg-sky-500"
          >
            Add Credential
          </button>
        </section>

        {/* Credentials Table */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">All Credentials</h2>
          {loadingCreds ? (
            <p>Loading credentials...</p>
          ) : (
            <div className="overflow-x-auto bg-slate-800 rounded-2xl p-4 shadow">
              <table className="w-full table-auto text-left text-sm">
                <thead className="border-b border-slate-600 text-slate-300">
                  <tr>
                    <th className="px-2 py-2">Username</th>
                    <th className="px-2 py-2">Password</th>
                    <th className="px-2 py-2">Package</th>
                    <th className="px-2 py-2">Used</th>
                    <th className="px-2 py-2">Assigned To</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map(c => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-slate-700"
                    >
                      <td className="px-2 py-1">{c.username}</td>
                      <td className="px-2 py-1">{c.password}</td>
                      <td className="px-2 py-1">{c.packageId}</td>
                      <td className="px-2 py-1">{c.used ? "Yes" : "No"}</td>
                      <td className="px-2 py-1">{c.assignedTo || "-"}</td>
                      <td className="px-2 py-1 space-x-2">
                        <button
                          onClick={() => resetCredential(c.id)}
                          className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400 text-black text-xs"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => deleteCredential(c.id)}
                          className="bg-red-600 px-2 py-1 rounded hover:bg-red-500 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Transactions Table */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Transactions</h2>
          {loadingTrans ? (
            <p>Loading transactions...</p>
          ) : (
            <div className="overflow-x-auto bg-slate-800 rounded-2xl p-4 shadow">
              <table className="w-full table-auto text-left text-sm">
                <thead className="border-b border-slate-600 text-slate-300">
                  <tr>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Phone</th>
                    <th className="px-2 py-2">Package</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2">Username</th>
                    <th className="px-2 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-slate-700"
                    >
                      <td className="px-2 py-1">{t.name}</td>
                      <td className="px-2 py-1">{t.phone}</td>
                      <td className="px-2 py-1">{t.packageId}</td>
                      <td className="px-2 py-1">GHS {t.amount}</td>
                      <td className="px-2 py-1">{t.username}</td>
                      <td className="px-2 py-1">{new Date(t.assignedAt.seconds * 1000).toLocaleString()}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
