// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new credential
  const [newPackageId, setNewPackageId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Memoized default packages
  const defaultPackages = useMemo(() => [
    { id: "bronze-1w", name: "Bronze — 1 Week", price: 20 },
    { id: "silver-2w", name: "Silver — 2 Weeks", price: 40 },
    { id: "gold-3w", name: "Gold — 3 Weeks", price: 60 },
    { id: "vip-1m", name: "Platinum — 1 Month", price: 90 },
  ], []);

  // Load data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Packages
        const pkgSnap = await getDocs(collection(db, "packages"));
        const pkgDocs = pkgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPackages(pkgDocs.length ? pkgDocs : defaultPackages);

        // Credentials
        const credSnap = await getDocs(collection(db, "credentials"));
        setCredentials(credSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Transactions
        const txSnap = await getDocs(query(collection(db, "transactions"), orderBy("assignedAt", "desc")));
        setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [defaultPackages]);

  // Add a new credential
  const addCredential = async () => {
    if (!newPackageId || !newUsername || !newPassword) return alert("Fill all fields");
    try {
      await addDoc(collection(db, "credentials"), {
        packageId: newPackageId,
        username: newUsername,
        password: newPassword,
        used: false,
        assignedTo: null,
        createdAt: new Date(),
      });
      setNewPackageId("");
      setNewUsername("");
      setNewPassword("");
      // Refresh credentials
      const credSnap = await getDocs(collection(db, "credentials"));
      setCredentials(credSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      alert("Credential added!");
    } catch (err) {
      console.error("Error adding credential:", err);
    }
  };

  // Delete credential
  const deleteCredential = async (credId) => {
    try {
      await updateDoc(doc(db, "credentials", credId), { deleted: true });
      setCredentials(credentials.filter(c => c.id !== credId));
      alert("Credential deleted.");
    } catch (err) {
      console.error("Error deleting credential:", err);
    }
  };

  if (loading) return <div className="p-6">Loading Admin Dashboard...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-6 text-slate-700">Admin Dashboard</h1>

      {/* Packages */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Packages</h2>
        <ul className="space-y-2">
          {packages.map(p => (
            <li key={p.id} className="p-3 bg-white rounded shadow flex justify-between">
              <span>{p.name} — GHS {p.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Add Credential */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Credential</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
          <select
            className="p-2 rounded border"
            value={newPackageId}
            onChange={(e) => setNewPackageId(e.target.value)}
          >
            <option value="">Select Package</option>
            {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="p-2 rounded border"
          />
          <input
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-2 rounded border"
          />
          <button
            onClick={addCredential}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
          >
            Add
          </button>
        </div>
      </section>

      {/* Credentials */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Credentials</h2>
        <ul className="space-y-2">
          {credentials.map(c => (
            <li key={c.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
              <span>
                {c.username} | {c.password} | {c.packageId} | Used: {c.used ? "Yes" : "No"} | AssignedTo: {c.assignedTo || "N/A"}
              </span>
              <button
                onClick={() => deleteCredential(c.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Transactions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Transactions</h2>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {transactions.map(tx => (
            <li key={tx.id} className="p-3 bg-white rounded shadow">
              <strong>{tx.name}</strong> ({tx.phone}) bought <strong>{tx.packageId}</strong> — Username: {tx.username} — Amount: GHS {tx.amount.toFixed(2)} — {new Date(tx.assignedAt?.seconds * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
