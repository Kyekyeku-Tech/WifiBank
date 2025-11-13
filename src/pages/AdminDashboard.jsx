import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [credentials, setCredentials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [loadingTrans, setLoadingTrans] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [packageId, setPackageId] = useState("bronze-1w");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const packages = [
    { id: "bronze-1w", name: "Bronze — 1 Week" },
    { id: "silver-2w", name: "Silver — 2 Weeks" },
    { id: "gold-3w", name: "Gold — 3 Weeks" },
    { id: "vip-1m", name: "Platinum — 1 Month" },
  ];

  useEffect(() => {
    const loadCreds = async () => {
      try {
        const snap = await getDocs(collection(db, "credentials"));
        setCredentials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCreds(false);
      }
    };
    loadCreds();
  }, []);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const snap = await getDocs(collection(db, "transactions"));
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrans(false);
      }
    };
    loadTransactions();
  }, []);

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
      const snap = await getDocs(collection(db, "credentials"));
      setCredentials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      alert("Failed to add credential.");
    } finally {
      setProcessing(false);
    }
  };

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

  const resetCredential = async (id) => {
    try {
      await updateDoc(doc(db, "credentials", id), { used: false, assignedTo: null });
      setCredentials(prev => prev.map(c => c.id === id ? { ...c, used: false, assignedTo: null } : c));
    } catch (err) {
      console.error(err);
      alert("Failed to reset.");
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  const deleteAllTransactions = async () => {
    if (!window.confirm("Delete ALL transactions? This cannot be undone!")) return;
    try {
      const snap = await getDocs(collection(db, "transactions"));
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      setTransactions([]);
      alert("All transactions deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete all transactions.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 space-y-10">
      <motion.h1
        className="text-4xl font-extrabold text-center bg-gradient-to-r from-sky-400 to-fuchsia-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Admin Dashboard
      </motion.h1>

      {/* Add Credential */}
      <motion.section
        className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Add Credential</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            className="p-3 rounded-lg bg-gray-900/60 border border-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-slate-400" />
          <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-gray-900/60 border border-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-slate-400" />
          <select value={packageId} onChange={e => setPackageId(e.target.value)}
            className="p-3 rounded-lg bg-gray-900/60 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none">
            {packages.map(p => (
              <option key={p.id} value={p.id} className="text-black">{p.name}</option>
            ))}
          </select>
          <input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)}
            className="p-3 rounded-lg bg-gray-900/60 border border-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-slate-400" />
        </div>
        <button onClick={addCredential} disabled={processing}
          className="mt-5 bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2 rounded-full font-semibold hover:from-sky-400 hover:to-blue-500 transition-all">
          {processing ? "Adding..." : "Add Credential"}
        </button>
      </motion.section>

      {/* Credentials Table */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">All Credentials</h2>
        {loadingCreds ? (
          <p className="text-slate-400">Loading credentials...</p>
        ) : (
          <div className="overflow-x-auto bg-gray-800/70 rounded-2xl p-4 shadow-xl border border-slate-700">
            <table className="w-full table-auto text-left text-sm text-slate-200">
              <thead className="border-b border-slate-600 text-slate-300">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Password</th>
                  <th className="px-3 py-2">Package</th>
                  <th className="px-3 py-2">Used</th>
                  <th className="px-3 py-2">Assigned To</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map(c => (
                  <motion.tr key={c.id} className="border-b border-slate-700 hover:bg-slate-700/40"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <td className="px-3 py-2">{c.username}</td>
                    <td className="px-3 py-2">{c.password}</td>
                    <td className="px-3 py-2">{c.packageId}</td>
                    <td className="px-3 py-2">{c.used ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{c.assignedTo || "-"}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button onClick={() => resetCredential(c.id)} className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-300 text-xs font-semibold">Reset</button>
                      <button onClick={() => deleteCredential(c.id)} className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 text-xs font-semibold">Delete</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Transactions Table */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-sky-400">Transactions</h2>
          <button onClick={deleteAllTransactions}
            className="bg-red-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-500 transition-all">
            Delete All
          </button>
        </div>

        {loadingTrans ? (
          <p className="text-slate-400">Loading transactions...</p>
        ) : (
          <div className="overflow-x-auto bg-gray-800/70 rounded-2xl p-4 shadow-xl border border-slate-700">
            <table className="w-full table-auto text-left text-sm text-slate-200">
              <thead className="border-b border-slate-600 text-slate-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Package</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.map(t => (
                  <motion.tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700/40"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <td className="px-3 py-2">{t.name}</td>
                    <td className="px-3 py-2">{t.phone}</td>
                    <td className="px-3 py-2">{t.packageId}</td>
                    <td className="px-3 py-2">GHS {t.amount}</td>
                    <td className="px-3 py-2">{t.username}</td>
                    <td className="px-3 py-2">
                      {t.assignedAt?.seconds ? new Date(t.assignedAt.seconds * 1000).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => deleteTransaction(t.id)}
                        className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 text-xs font-semibold">
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {transactions.length > 10 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700 rounded-full hover:bg-slate-600 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-700 rounded-full hover:bg-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </motion.section>
    </div>
  );
}
