// src/pages/ZionWifiBank.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";

export default function ZionWifiBank() {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  const [availability, setAvailability] = useState({});
  const [theme, setTheme] = useState("dark"); // default dark

  const PAYSTACK_KEY = import.meta.env?.VITE_PAYSTACK_KEY || process.env.REACT_APP_PAYSTACK_KEY;

  // Toggle theme
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Load packages and availability
  useEffect(() => {
    async function loadPackages() {
      try {
        const snap = await getDocs(collection(db, "packages"));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const pkgs = docs.length ? docs : [
          { id: "bronze-1w", name: "Bronze — 1 Week", price: 20, description: "1 Week Unlimited" },
          { id: "silver-2w", name: "Silver — 2 Weeks", price: 40, description: "2 Weeks Unlimited" },
          { id: "gold-3w", name: "Gold — 3 Weeks", price: 60, description: "3 Weeks Unlimited" },
          { id: "vip-1m", name: "Platinum — 1 Month", price: 90, description: "1 Month, 2 devices" },
        ];
        setPackages(pkgs);

        const avail = {};
        for (let pkg of pkgs) {
          const snapCreds = await getDocs(
            query(collection(db, "credentials"), where("packageId", "==", pkg.id), where("used", "==", false))
          );
          avail[pkg.id] = !snapCreds.empty;
        }
        setAvailability(avail);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, []);

  const formatGhs = x => `GHS ${Number(x).toFixed(2)}`;

  // -------------------------------
  //  TICKET GENERATOR (PDF + JPG)
  // -------------------------------
  const generateTicket = (details) => {
    const { reference, pkg, username } = details;

    const docPDF = new jsPDF();
    docPDF.setFontSize(18);
    docPDF.text("Chidiz WiFi Bank – Access Ticket", 20, 20);

    docPDF.setFontSize(12);
    docPDF.text(`Name: ${name}`, 20, 40);
    docPDF.text(`Phone: ${phone}`, 20, 50);
    docPDF.text(`Package: ${pkg.name}`, 20, 60);
    docPDF.text(`Username: ${username}`, 20, 70);
    docPDF.text(`Reference: ${reference}`, 20, 80);
    docPDF.text(`Date: ${new Date().toLocaleString()}`, 20, 90);

    docPDF.save(`Ticket-${reference}.pdf`);

    // JPG VERSION
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 700, 400);

    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText("Chidiz WiFi Bank Ticket", 180, 50);

    ctx.font = "20px Arial";
    ctx.fillText(`Name: ${name}`, 50, 120);
    ctx.fillText(`Phone: ${phone}`, 50, 160);
    ctx.fillText(`Package: ${pkg.name}`, 50, 200);
    ctx.fillText(`Username: ${username}`, 50, 240);
    ctx.fillText(`Reference: ${reference}`, 50, 280);

    const jpgURL = canvas.toDataURL("image/jpeg");

    const a = document.createElement("a");
    a.href = jpgURL;
    a.download = `Ticket-${reference}.jpg`;
    a.click();
  };

  // -------------------------------
  // PAYMENT SUCCESS HANDLER
  // -------------------------------
  const payPackage = async (pkg) => {
    if (!phone || !name) return alert("Enter your name and phone number.");
    if (!availability[pkg.id]) return alert(`No credentials available for ${pkg.name}.`);

    if (!window.PaystackPop) {
      alert("Paystack script not loaded. Include https://js.paystack.co/v1/inline.js");
      return;
    }

    setProcessing(true);
    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY,
        email: email || "no-reply@zionwifi.com",
        amount: Math.round(pkg.price * 100),
        currency: "GHS",
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "name", value: name },
            { display_name: "Phone", variable_name: "phone", value: phone },
            { display_name: "Package", variable_name: "packageId", value: pkg.id },
          ],
        },
        callback: (response) => handlePaymentSuccess(response.reference, pkg),
        onClose: () => {},
      });
      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert("Error initiating payment. Try again later.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (reference, pkg) => {
    setProcessing(true);
    try {
      const snap = await getDocs(
        query(collection(db, "credentials"), where("packageId", "==", pkg.id), where("used", "==", false))
      );
      if (snap.empty) {
        alert("Payment succeeded but no credentials available.");
        return;
      }

      const credDoc = snap.docs[0];
      const credData = credDoc.data();

      await updateDoc(doc(db, "credentials", credDoc.id), {
        used: true,
        assignedTo: phone,
        assignedAt: new Date(),
      });

      await addDoc(collection(db, "transactions"), {
        reference,
        packageId: pkg.id,
        name,
        phone,
        amount: pkg.price,
        username: credData.username,
        assignedAt: new Date(),
      });

      alert(`Payment succeeded! Downloading your ticket.`);
      
      // Generate ticket (PDF + JPG)
      generateTicket({
        reference,
        pkg,
        username: credData.username
      });

    } catch (err) {
      console.error(err);
      alert("Payment succeeded but credential assignment failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Dynamic theme classes
  const containerClass =
    theme === "dark"
      ? "min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-700 text-white p-6"
      : "min-h-screen bg-gradient-to-tr from-white via-gray-200 to-gray-300 text-black p-6";

  const cardClass = isAvailable =>
    theme === "dark"
      ? `p-6 rounded-2xl shadow transition transform ${isAvailable ? "bg-white/10 hover:-translate-y-2" : "bg-white/20 opacity-50 cursor-not-allowed"}`
      : `p-6 rounded-2xl shadow transition transform ${isAvailable ? "bg-gray-100 hover:-translate-y-2" : "bg-gray-200 opacity-50 cursor-not-allowed"}`;

  const inputClass = "p-2 rounded placeholder:text-slate-400 " + (theme === "dark" ? "bg-white/10 text-white" : "bg-white text-black");

  const buttonClass = (isAvailable) =>
    isAvailable
      ? theme === "dark"
        ? "bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-full font-bold"
        : "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-bold"
      : theme === "dark"
        ? "bg-gray-400 text-gray-700 cursor-not-allowed px-4 py-2 rounded-full font-bold"
        : "bg-gray-300 text-gray-800 cursor-not-allowed px-4 py-2 rounded-full font-bold";

  return (
    <div className={containerClass}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className={theme === "dark" ? "text-3xl font-bold text-sky-400 mb-2" : "text-3xl font-bold text-blue-600 mb-2"}>Chidiz WiFi Bank</h1>
            <p className={theme === "dark" ? "text-slate-200" : "text-gray-700"}>Fast — Unlimited — Reliable</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleTheme}
              className={theme === "dark" ? "bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 font-bold" : "bg-gray-300 text-black px-4 py-2 rounded-full hover:bg-gray-200 font-bold"}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <a href="tel:+233545454000" className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-full font-bold hover:bg-yellow-300">Call Admin</a>
            <a href="/admin/login" className="bg-red-600 text-white px-4 py-2 rounded-full font-bold hover:bg-red-500">Admin</a>
          </div>
        </header>

        {/* User Inputs */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          <input placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          <input placeholder="Phone (+233...)" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
        </div>

        {/* Packages */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingPackages
            ? <div>Loading packages...</div>
            : packages.map(p => {
                const isAvailable = availability[p.id];
                return (
                  <div key={p.id} className={cardClass(isAvailable)}>
                    <h3 className={theme === "dark" ? "text-xl font-bold text-sky-400 mb-2" : "text-xl font-bold text-blue-600 mb-2"}>{p.name}</h3>
                    <p className={theme === "dark" ? "text-sm text-sky-200 mb-3" : "text-sm text-gray-700 mb-3"}>{p.description}</p>
                    <div className="flex items-center justify-between">
                      <div className={theme === "dark" ? "text-2xl font-extrabold text-sky-100" : "text-2xl font-extrabold text-gray-800"}>{formatGhs(p.price)}</div>
                      <button onClick={() => payPackage(p)} disabled={!isAvailable || processing} className={buttonClass(isAvailable)}>
                        {isAvailable ? "Pay Now" : "Sold Out"}
                      </button>
                    </div>
                  </div>
                );
              })}
        </section>

      </div>
    </div>
  );
}
