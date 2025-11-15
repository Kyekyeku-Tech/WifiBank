import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  // Data
  const [credentials, setCredentials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [loadingTrans, setLoadingTrans] = useState(true);

  // Single credential inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [packageId, setPackageId] = useState("bronze-1w");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);

  // Bulk paste textarea (comma-separated lines)
  const [bulkText, setBulkText] = useState("");
  const [bulkErrors, setBulkErrors] = useState([]); // errors for preview

  // CSV upload errors
  const [csvErrors, setCsvErrors] = useState([]);

  // UI
  const [theme, setTheme] = useState("dark"); // Dark theme by default
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(transactions.length / itemsPerPage));
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

  // Redirect if not authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/admin/login");
    });
    return unsubscribe;
  }, [navigate]);

  // Load credentials
  useEffect(() => {
    const loadCreds = async () => {
      try {
        const snap = await getDocs(collection(db, "credentials"));
        setCredentials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCreds(false);
      }
    };
    loadCreds();
  }, []);

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const snap = await getDocs(collection(db, "transactions"));
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrans(false);
      }
    };
    loadTransactions();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Credential & Transaction functions
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
      setUsername("");
      setPassword("");
      setDescription("");
      const snap = await getDocs(collection(db, "credentials"));
      setCredentials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      alert("Credential added successfully!");
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
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  const resetCredential = async (id) => {
    try {
      await updateDoc(doc(db, "credentials", id), {
        used: false,
        assignedTo: null,
      });
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, used: false, assignedTo: null } : c
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to reset.");
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  const deleteAllTransactions = async () => {
    if (!window.confirm("Delete ALL transactions? This cannot be undone!"))
      return;
    try {
      const snap = await getDocs(collection(db, "transactions"));
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      setTransactions([]);
      alert("All transactions deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete all transactions.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  // --------------------------
  // Bulk paste logic (comma-separated)
  // --------------------------
  // Example accepted lines:
  // username,password
  // username,password,packageId
  // username,password,packageId,description

  const previewBulk = (text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const errors = [];
    const preview = lines.map((line, idx) => {
      const parts = line.split(",").map((p) => p.trim());
      const [u, p, pkg, desc] = parts;
      if (!u || !p) {
        errors.push(`Line ${idx + 1}: username or password missing.`);
      }
      return {
        line: idx + 1,
        username: u || "",
        password: p || "",
        packageId: pkg || packageId, // fallback to currently selected package
        description: desc || "",
      };
    });
    setBulkErrors(errors);
    return preview;
  };

  const handleBulkPasteUpload = async () => {
    if (!bulkText.trim()) {
      alert("Paste some lines first (comma-separated).");
      return;
    }

    const preview = previewBulk(bulkText);
    if (bulkErrors.length > 0) {
      const proceed = window.confirm(
        `There are ${bulkErrors.length} problems. See console for details. Proceed with valid rows?`
      );
      if (!proceed) return;
    }

    const validRows = preview.filter((r) => r.username && r.password);

    if (validRows.length === 0) {
      alert("No valid rows to upload.");
      return;
    }

    setProcessing(true);
    try {
      // create all docs in parallel
      const promises = validRows.map((r) =>
        addDoc(collection(db, "credentials"), {
          username: r.username,
          password: r.password,
          packageId: r.packageId,
          description: r.description,
          used: false,
          assignedTo: null,
          createdAt: new Date(),
        })
      );
      await Promise.all(promises);

      // reload credentials
      const snap = await getDocs(collection(db, "credentials"));
      setCredentials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // clear bulk UI
      setBulkText("");
      setBulkErrors([]);
      alert(`Uploaded ${validRows.length} credential(s) successfully.`);
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Error during bulk upload.");
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------
  // CSV file upload from device
  // --------------------------
  // Accepts same formats as bulk paste:
  // username,password
  // username,password,packageId
  // username,password,packageId,description
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    setCsvErrors([]);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = String(event.target.result || "");
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      // If first line looks like a header (contains "username" and "password"), skip it
      const first = lines[0] || "";
      const startIndex =
        /username/i.test(first) && /password/i.test(first) ? 1 : 0;

      const rows = [];
      const errors = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        // split on comma but don't break if description has comma — we'll join extras into description
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 2) {
          errors.push(`Line ${i + 1}: missing username/password.`);
          continue;
        }
        const usernameVal = parts[0];
        const passwordVal = parts[1];
        const packageVal = parts[2] || packageId;
        // join remaining parts as description (so description can contain commas)
        const descriptionVal = parts.slice(3).join(",") || parts[3] || "";

        if (!usernameVal || !passwordVal) {
          errors.push(`Line ${i + 1}: username or password empty.`);
          continue;
        }

        rows.push({
          username: usernameVal,
          password: passwordVal,
          packageId: packageVal,
          description: descriptionVal,
        });
      }

      if (rows.length === 0) {
        setCsvErrors(errors.length ? errors : ["No valid rows found in CSV."]);
        return;
      }

      setProcessing(true);
      try {
        const promises = rows.map((r) =>
          addDoc(collection(db, "credentials"), {
            username: r.username,
            password: r.password,
            packageId: r.packageId,
            description: r.description,
            used: false,
            assignedTo: null,
            createdAt: new Date(),
          })
        );
        await Promise.all(promises);

        // refresh credentials
        const snap = await getDocs(collection(db, "credentials"));
        setCredentials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

        if (errors.length) setCsvErrors(errors);
        else setCsvErrors([]);

        alert(`Uploaded ${rows.length} credential(s) from CSV.`);
      } catch (err) {
        console.error("CSV upload error:", err);
        alert("CSV upload failed.");
      } finally {
        setProcessing(false);
      }
    };

    reader.readAsText(file);
    // clear the input value so same file can be reselected later if needed
    e.target.value = "";
  };

  // Set container class based on theme
  const containerClass =
    theme === "dark"
      ? "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6"
      : "min-h-screen bg-gradient-to-br from-white via-gray-200 to-gray-300 text-black p-6";

  const sectionClass =
    theme === "dark"
      ? "bg-gray-800/70 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-xl mb-10"
      : "bg-white/70 border border-gray-400 rounded-2xl p-6 shadow-md mb-10";

  const tableClass =
    theme === "dark"
      ? "w-full text-left text-sm text-slate-200"
      : "w-full text-left text-sm text-gray-800";

  return (
    <div className={containerClass}>
      {/* Header */}
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1
          className={`text-4xl font-extrabold bg-clip-text text-transparent ${
            theme === "dark"
              ? "bg-gradient-to-r from-sky-400 to-fuchsia-500"
              : "bg-gradient-to-r from-blue-400 to-pink-500"
          }`}
        >
          Admin Dashboard
        </h1>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-3">
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-300 text-black hover:bg-gray-200"
            }`}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full font-semibold transition-all"
          >
            User Management
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full font-semibold transition-all"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <button
          className="md:hidden text-3xl px-3 py-1 rounded"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </motion.div>

      {/* Mobile Slide-In Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden">
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bg-gray-900 text-white w-72 h-full p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="block w-full mb-3 bg-gray-700 py-2 rounded-lg font-semibold"
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              onClick={() => {
                navigate("/admin/users");
                setMobileMenuOpen(false);
              }}
              className="block w-full mb-3 bg-green-600 py-2 rounded-lg font-semibold"
            >
              User Management
            </button>

            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="block w-full bg-red-600 py-2 rounded-lg font-semibold"
            >
              Logout
            </button>
          </motion.div>
        </div>
      )}

      {/* Add Credential Section */}
      <motion.section
        className={sectionClass}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          className={`text-2xl font-semibold mb-4 ${
            theme === "dark" ? "text-sky-400" : "text-blue-600"
          }`}
        >
          Add Credential
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`p-3 rounded-lg focus:ring-2 outline-none placeholder:text-slate-400 ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 focus:ring-sky-500 text-white"
                : "bg-white border border-gray-400 focus:ring-blue-500 text-black"
            }`}
          />
          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`p-3 rounded-lg focus:ring-2 outline-none placeholder:text-slate-400 ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 focus:ring-sky-500 text-white"
                : "bg-white border border-gray-400 focus:ring-blue-500 text-black"
            }`}
          />
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className={`p-3 rounded-lg outline-none ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500"
                : "bg-white border border-gray-400 text-black focus:ring-blue-500"
            }`}
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id} className="text-black">
                {p.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`p-3 rounded-lg focus:ring-2 outline-none placeholder:text-slate-400 ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 focus:ring-sky-500 text-white"
                : "bg-white border border-gray-400 focus:ring-blue-500 text-black"
            }`}
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={addCredential}
            disabled={processing}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              theme === "dark"
                ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                : "bg-gradient-to-r from-blue-400 to-pink-500 hover:from-blue-300 hover:to-pink-400"
            }`}
          >
            {processing ? "Adding..." : "Add Credential"}
          </button>

          {/* Quick clear for ease */}
          <button
            onClick={() => {
              setUsername("");
              setPassword("");
              setDescription("");
            }}
            className="px-6 py-2 rounded-full font-semibold bg-gray-500/30"
          >
            Clear
          </button>
        </div>

        {/* Bulk Paste Upload */}
        <div className="mt-6">
          <label className="font-semibold block mb-2">
            Bulk Paste (comma-separated)
          </label>
          <p className="text-sm mb-2 text-slate-400">
            Paste lines like: <code>username,password</code> or{" "}
            <code>username,password,packageId,description</code>
          </p>

          <textarea
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              previewBulk(e.target.value);
            }}
            placeholder={"john,1234\namoah,pass88,bronze-1w,VIP user"}
            rows={6}
            className={`w-full p-3 rounded-lg outline-none placeholder:text-slate-400 ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 text-white"
                : "bg-white border border-gray-400 text-black"
            }`}
          />

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleBulkPasteUpload}
              disabled={processing}
              className="px-4 py-2 rounded-full font-semibold bg-indigo-600 hover:bg-indigo-500"
            >
              {processing ? "Uploading..." : "Upload Bulk"}
            </button>
            <button
              onClick={() => {
                setBulkText("");
                setBulkErrors([]);
                setCsvErrors([]);
              }}
              className="px-4 py-2 rounded-full font-semibold bg-gray-600/30"
            >
              Clear
            </button>
          </div>

          {/* Errors preview */}
          {bulkErrors.length > 0 && (
            <div className="mt-3 p-3 bg-red-900/30 rounded text-sm">
              <strong>Problems:</strong>
              <ul className="list-disc pl-5">
                {bulkErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 📌 CSV UPLOAD ADDED HERE */}
          <div className="mt-6">
            <label className="font-semibold block mb-2">Upload CSV</label>
            <p className="text-sm mb-2 text-slate-400">
              Upload a CSV file from your device. Format:
              <code>username,password</code> or{" "}
              <code>username,password,packageId,description</code>
            </p>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCSVUpload}
              className="p-2 rounded border bg-transparent"
            />

            {/* CSV Errors */}
            {csvErrors.length > 0 && (
              <div className="mt-3 p-3 bg-red-900/30 rounded text-sm">
                <strong>CSV problems:</strong>
                <ul className="list-disc pl-5">
                  {csvErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Credentials Table */}
      <motion.section
        className={sectionClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2
          className={`text-2xl font-semibold mb-4 ${
            theme === "dark" ? "text-sky-400" : "text-blue-600"
          }`}
        >
          All Credentials
        </h2>
        {loadingCreds ? (
          <p className={theme === "dark" ? "text-slate-400" : "text-gray-700"}>
            Loading credentials...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead
                className={
                  theme === "dark"
                    ? "border-b border-slate-600 text-slate-300"
                    : "border-b border-gray-400 text-gray-700"
                }
              >
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
                {credentials.map((c) => (
                  <motion.tr
                    key={c.id}
                    className={
                      theme === "dark"
                        ? "border-b border-slate-700 hover:bg-slate-700/40"
                        : "border-b border-gray-400 hover:bg-gray-200"
                    }
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <td className="px-3 py-2">{c.username}</td>
                    <td className="px-3 py-2">{c.password}</td>
                    <td className="px-3 py-2">{c.packageId}</td>
                    <td className="px-3 py-2">{c.used ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{c.assignedTo || "-"}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => resetCredential(c.id)}
                        className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-300 text-xs font-semibold"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => deleteCredential(c.id)}
                        className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 text-xs font-semibold"
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
      </motion.section>

      {/* Transactions Table */}
      <motion.section
        className={sectionClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-2xl font-semibold ${
              theme === "dark" ? "text-sky-400" : "text-blue-600"
            }`}
          >
            Transactions
          </h2>
          <button
            onClick={deleteAllTransactions}
            className="bg-red-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-500 transition-all"
          >
            Delete All
          </button>
        </div>

        {loadingTrans ? (
          <p className={theme === "dark" ? "text-slate-400" : "text-gray-700"}>
            Loading transactions...
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead
                  className={
                    theme === "dark"
                      ? "border-b border-slate-600 text-slate-300"
                      : "border-b border-gray-400 text-gray-700"
                  }
                >
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
                  {currentTransactions.map((t) => (
                    <motion.tr
                      key={t.id}
                      className={
                        theme === "dark"
                          ? "border-b border-slate-700 hover:bg-slate-700/40"
                          : "border-b border-gray-400 hover:bg-gray-200"
                      }
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <td className="px-3 py-2">{t.name}</td>
                      <td className="px-3 py-2">{t.phone}</td>
                      <td className="px-3 py-2">{t.packageId}</td>
                      <td className="px-3 py-2">GHS {t.amount}</td>
                      <td className="px-3 py-2">{t.username}</td>
                      <td className="px-3 py-2">
                        {t.assignedAt?.seconds
                          ? new Date(t.assignedAt.seconds * 1000).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

           {/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-4 mt-4">
    <button
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 bg-slate-700 rounded-full hover:bg-slate-600 disabled:opacity-40"
    >
      Prev
    </button>

    <span className={theme === "dark" ? "text-slate-300" : "text-gray-700"}>
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
      className="px-4 py-2 bg-slate-700 rounded-full hover:bg-slate-600 disabled:opacity-40"
    >
      Next
    </button>
  </div>
)}
          </>
        )}
      </motion.section>
    </div>
  );
}
