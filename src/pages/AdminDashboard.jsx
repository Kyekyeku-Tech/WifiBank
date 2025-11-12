import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [activeTab, setActiveTab] = useState("credentials");
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState("");
  const [credentials, setCredentials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bulkData, setBulkData] = useState("");
  const [stats, setStats] = useState({ total: 0, used: 0, available: 0, sales: 0 });

  const ADMIN_PASSWORD = "zionadmin123"; // change in production

  // Default fallback packages
  const defaultPackages = [
    { id: "bronze-1w", name: "Bronze — 1 Week", price: 20.0 },
    { id: "silver-2w", name: "Silver — 2 Weeks", price: 40.0 },
    { id: "gold-3w", name: "Gold — 3 Weeks", price: 60.0 },
    { id: "vip-1m", name: "Platinum — 1 Month", price: 90.0 },
  ];

  // Load packages
  useEffect(() => {
    async function loadPackages() {
      try {
        const snap = await getDocs(collection(db, "packages"));
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPackages(fetched.length ? fetched : defaultPackages);
      } catch {
        setPackages(defaultPackages);
      }
    }
    loadPackages();
  }, []);

  // Load credentials for selected package
  useEffect(() => {
    if (!selectedPkg) return;
    const q = query(
      collection(db, "credentials"),
      where("packageId", "==", selectedPkg)
    );
    const unsub = onSnapshot(q, (snap) => {
      const creds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCredentials(creds);

      const used = creds.filter((c) => c.used).length;
      const available = creds.length - used;
      setStats((prev) => ({
        ...prev,
        total: creds.length,
        used,
        available,
      }));
    });
    return () => unsub();
  }, [selectedPkg]);

  // Load transactions
  useEffect(() => {
    if (!authorized) return;
    const q = query(collection(db, "transactions"), orderBy("assignedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const trans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      const totalSales = trans.reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats((prev) => ({ ...prev, sales: totalSales }));
    });
    return () => unsub();
  }, [authorized]);

  // Add single credential
  async function addCredential() {
    if (!selectedPkg || !username || !password)
      return alert("Fill all fields.");
    await addDoc(collection(db, "credentials"), {
      packageId: selectedPkg,
      username,
      password,
      used: false,
      assignedTo: null,
      createdAt: new Date(),
    });
    setUsername("");
    setPassword("");
  }

  // Bulk import credentials
  async function bulkImport() {
    if (!selectedPkg || !bulkData) return alert("Select package & enter bulk data.");
    const lines = bulkData.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return alert("No valid lines found.");

    const batch = writeBatch(db);
    lines.forEach((line) => {
      const [user, pass] = line.split(",").map((x) => x.trim());
      if (user && pass) {
        const newDoc = doc(collection(db, "credentials"));
        batch.set(newDoc, {
          packageId: selectedPkg,
          username: user,
          password: pass,
          used: false,
          assignedTo: null,
          createdAt: new Date(),
        });
      }
    });

    await batch.commit();
    alert(`${lines.length} credentials added.`);
    setBulkData("");
  }

  // Mark credential as used
  async function markUsed(id) {
    await updateDoc(doc(db, "credentials", id), { used: true });
  }

  // Delete credential
  async function deleteCredential(id) {
    if (!window.confirm("Delete this credential?")) return;
    try {
      await deleteDoc(doc(db, "credentials", id));
      alert("Deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  }

  // Login UI
  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 p-8 rounded-2xl shadow-xl w-80 text-center"
        >
          <h1 className="text-2xl font-bold mb-4 text-sky-400">Admin Login</h1>
          <input
            type="password"
            placeholder="Admin password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            className="p-2 rounded w-full mb-3 bg-slate-700 text-center"
          />
          <button
            onClick={() => {
              if (adminPass === ADMIN_PASSWORD) setAuthorized(true);
              else alert("Wrong password!");
            }}
            className="bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded w-full font-semibold"
          >
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-sky-400 mb-4 md:mb-0">
          Zion WiFi Admin Dashboard
        </h1>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "credentials" ? "bg-sky-600" : "bg-slate-700"
            }`}
            onClick={() => setActiveTab("credentials")}
          >
            Credentials
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "transactions" ? "bg-sky-600" : "bg-slate-700"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl shadow text-center">
          <div className="text-slate-400 text-sm">Total Credentials</div>
          <div className="text-2xl font-bold text-sky-400">{stats.total}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow text-center">
          <div className="text-slate-400 text-sm">Used</div>
          <div className="text-2xl font-bold text-red-400">{stats.used}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow text-center">
          <div className="text-slate-400 text-sm">Available</div>
          <div className="text-2xl font-bold text-green-400">{stats.available}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow text-center">
          <div className="text-slate-400 text-sm">Total Sales (GHS)</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.sales.toFixed(2)}</div>
        </div>
      </div>

      {/* Panels */}
      {activeTab === "credentials" ? (
        <motion.div
          key="creds"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-800 p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-sky-300">
            Credentials Manager
          </h2>

          {/* Add credential */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <select
              className="p-2 bg-slate-700 rounded flex-1"
              value={selectedPkg}
              onChange={(e) => setSelectedPkg(e.target.value)}
            >
              <option value="">Select package</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — GHS {p.price}
                </option>
              ))}
            </select>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-2 bg-slate-700 rounded flex-1"
            />
            <input
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 bg-slate-700 rounded flex-1"
            />
            <button
              onClick={addCredential}
              className="bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded font-semibold"
            >
              Add
            </button>
          </div>

          {/* Bulk import */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <textarea
              placeholder="Bulk credentials (username,password per line)"
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              className="p-2 bg-slate-700 rounded flex-1 h-28 resize-none"
            />
            <button
              onClick={bulkImport}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-semibold h-12 md:h-auto self-start"
            >
              Bulk Import
            </button>
          </div>

          {/* Credential list */}
          <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
            {credentials.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${
                  c.used ? "bg-slate-700/60" : "bg-slate-700"
                } flex flex-col md:flex-row justify-between items-start`}
              >
                <div>
                  <div className="font-bold">{c.username}</div>
                  <div className="text-sm text-slate-300">{c.password}</div>
                  {c.used && (
                    <div className="text-xs text-slate-400">
                      Used by {c.assignedTo || "Unknown"}
                    </div>
                  )}
                </div>
                <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0">
                  {!c.used && (
                    <button
                      onClick={() => markUsed(c.id)}
                      className="bg-red-600 px-3 py-1 rounded text-xs"
                    >
                      Mark Used
                    </button>
                  )}
                  <button
                    onClick={() => deleteCredential(c.id)}
                    className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="transactions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-800 p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-sky-300">
            Transactions Log
          </h2>
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {transactions.length === 0 ? (
              <p className="text-slate-400">No transactions yet.</p>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-700 p-4 rounded-xl flex justify-between items-start"
                >
                  <div>
                    <div className="font-semibold text-sky-300">{t.name || "Unknown"}</div>
                    <div className="text-sm text-slate-300">{t.phone}</div>
                    <div className="text-xs text-slate-400">
                      {t.packageId} | Ref: {t.reference}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-yellow-400">
                      GHS {t.amount?.toFixed(2)}
                    </div>
                    <div className="text-slate-400">{t.username || "pending"}</div>
                    <div className="text-xs text-slate-500">
                      {t.assignedAt
                        ? new Date(t.assignedAt.seconds * 1000).toLocaleString()
                        : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
