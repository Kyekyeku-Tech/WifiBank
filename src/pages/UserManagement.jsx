// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const navigate = useNavigate();

  // ✅ Auth protection with admin role check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/admin/login");
        return;
      }

      try {
        const q = query(collection(db, "adminUsers"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Case-insensitive email match
        const current = list.find(
          (u) =>
            u.email &&
            u.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        );

        // 🔒 Allow only admins OR fallback super-admin email
        const superAdmin = "youremail@example.com"; // ✅ Replace with your email
        if (!current || current.role !== "admin") {
          if (user.email !== superAdmin) {
            alert("Access denied: Admins only.");
            await signOut(auth);
            navigate("/admin/login");
            return;
          }
        }
      } catch (err) {
        console.error(err);
        alert("Error verifying admin privileges.");
        await signOut(auth);
        navigate("/admin/login");
      }
    });

    return unsubscribe;
  }, [navigate]);

  // ✅ Load users from Firestore
  const loadUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "adminUsers"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (err) {
      console.error(err);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ Add new admin user
  const addUser = async () => {
    if (!email) return alert("Enter an email.");
    try {
      await addDoc(collection(db, "adminUsers"), {
        email,
        role,
        createdAt: new Date(),
      });
      setEmail("");
      await loadUsers();
      alert("✅ Admin user added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add user.");
    }
  };

  // ✅ Change role (admin ↔ user)
  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, "adminUsers", id), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update role.");
    }
  };

  // ✅ Delete user
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, "adminUsers", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  // ✅ Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Pagination logic
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Theme styles
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
        className="flex flex-wrap justify-between items-center mb-8"
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
          Admin User Management
        </h1>
        <div className="flex flex-wrap gap-3 mt-3 md:mt-0">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-300 text-black hover:bg-gray-200"
            }`}
          >
            Back to Dashboard
          </button>
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
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full font-semibold transition-all"
          >
            Logout
          </button>
        </div>
      </motion.div>

      {/* Add Admin */}
      <motion.section
        className={sectionClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Add Admin User</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`p-3 rounded-lg w-full md:w-1/3 focus:ring-2 outline-none ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 focus:ring-sky-500 text-white"
                : "bg-white border border-gray-400 focus:ring-blue-500 text-black"
            }`}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`p-3 rounded-lg w-full md:w-1/3 ${
              theme === "dark"
                ? "bg-gray-900/60 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500"
                : "bg-white border border-gray-400 text-black focus:ring-blue-500"
            }`}
          >
            <option value="admin" className="text-black">
              Admin
            </option>
            <option value="user" className="text-black">
              User
            </option>
          </select>
          <button
            onClick={addUser}
            className={`w-full md:w-auto px-6 py-2 rounded-full font-semibold transition-all ${
              theme === "dark"
                ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                : "bg-gradient-to-r from-blue-400 to-pink-500 hover:from-blue-300 hover:to-pink-400"
            }`}
          >
            Add User
          </button>
        </div>
      </motion.section>

      {/* Users Table */}
      <motion.section
        className={sectionClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">All Admin Users</h2>
          <button
            onClick={loadUsers}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${
              theme === "dark"
                ? "bg-sky-600 hover:bg-sky-500"
                : "bg-blue-600 hover:bg-blue-500"
            } text-white`}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading users...</p>
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
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={
                        theme === "dark"
                          ? "border-b border-slate-700 hover:bg-slate-700/40"
                          : "border-b border-gray-400 hover:bg-gray-200"
                      }
                    >
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2 capitalize">{u.role}</td>
                      <td className="px-3 py-2">
                        {u.createdAt?.seconds
                          ? new Date(u.createdAt.seconds * 1000).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right flex justify-end gap-2">
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          className="bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded text-xs font-semibold"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full ${
                  currentPage === 1
                    ? "bg-gray-400 cursor-not-allowed"
                    : theme === "dark"
                    ? "bg-sky-600 hover:bg-sky-500"
                    : "bg-blue-600 hover:bg-blue-500"
                } text-white`}
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full ${
                  currentPage === totalPages
                    ? "bg-gray-400 cursor-not-allowed"
                    : theme === "dark"
                    ? "bg-sky-600 hover:bg-sky-500"
                    : "bg-blue-600 hover:bg-blue-500"
                } text-white`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </motion.section>
    </div>
  );
}
