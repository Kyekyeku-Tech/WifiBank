// Full working ZionWifiBank.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

const AutoCarousel = ({ items, theme, whatsappPrefix }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  const cardClass =
    theme === "dark"
      ? `p-6 rounded-2xl shadow transition transform bg-white/10 hover:-translate-y-2 flex flex-col items-center justify-center`
      : `p-6 rounded-2xl shadow transition transform bg-gray-100 hover:-translate-y-2 flex flex-col items-center justify-center`;

  return (
    <div className="overflow-hidden relative w-full h-full flex justify-center items-center">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: "0%", opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={cardClass}
        >
          {items[index].title && (
            <>
              <h3 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-yellow-300" : "text-blue-600"}`}>
                {items[index].title}
              </h3>
              <p className="text-sm mb-2">{items[index].desc}</p>
              <div className="text-lg font-extrabold mb-4">{items[index].price}</div>
            </>
          )}

          {items[index].speed && (
            <>
              <h3 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-yellow-300" : "text-blue-600"}`}>
                {items[index].speed}
              </h3>
              <p className="text-sm mb-2">{items[index].desc}</p>
              <div className="text-lg font-extrabold mb-4">{items[index].price}</div>
            </>
          )}

          <a
            href={`https://wa.me/233243767677?text=${encodeURIComponent(whatsappPrefix(items[index]))}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-full font-bold ${
              theme === "dark"
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-green-500 hover:bg-green-400 text-white"
            }`}
          >
            WhatsApp Admin
          </a>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function ZionWifiBank() {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [availability, setAvailability] = useState({});
  const [theme, setTheme] = useState("dark");

  const PAYSTACK_KEY = import.meta.env?.VITE_PAYSTACK_KEY || process.env.REACT_APP_PAYSTACK_KEY;
  const apiKey = import.meta.env?.VITE_MNOTIFY_KEY || process.env.REACT_APP_MNOTIFY_KEY || "8KXVafxA7gnSFivj2T1Shoo97";
  const senderId = "Chidiz Hub";

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const installationItems = [
    { title: "Home Installation", price: "GHS 1,500", desc: "Standard home setup for all WiFi packages." },
    { title: "Business Installation", price: "GHS 1,500", desc: "Advanced installation for shops and offices." },
    { title: "Pole Extension", price: "GHS 1,500", desc: "For clients far from main distribution point." },
    { title: "Home Installation", price: "GHS 1,500", desc: "Standard home setup for all WiFi packages." },
    { title: "Company Installation", price: "GHS 1,500", desc: "Setup for companies and offices." },
    { title: "Pole Installation", price: "GHS 1,500", desc: "For extended pole connections." },
  ];

  const dedicatedItems = [
    { speed: "10 MBPS", price: "GHS 200 / month", desc: "NB: All packages are Unlimited." },
    { speed: "15 MBPS", price: "GHS 300 / month", desc: "NB: All packages are Unlimited." },
    { speed: "30 MBPS", price: "GHS 399 / month", desc: "NB: All packages are Unlimited." },
    { speed: "10 MBPS", price: "GHS 200 / month", desc: "NB: All packages are Unlimited." },
    { speed: "15 MBPS", price: "GHS 300 / month", desc: "NB: All packages are Unlimited." },
    { speed: "30 MBPS", price: "GHS 399 / month", desc: "NB: All packages are Unlimited." },
  ];

  useEffect(() => {
    async function loadPackages() {
      try {
        const snap = await getDocs(collection(db, "packages"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const pkgs = docs.length
          ? docs
          : [
              { id: "bronze-1w", name: "Bronze — 1 Week", price: 20, description: "1 Week Unlimited" },
              { id: "silver-2w", name: "Silver — 2 Weeks", price: 40, description: "2 Weeks Unlimited" },
              { id: "gold-3w", name: "Gold — 3 Weeks", price: 60, description: "3 Weeks Unlimited" },
              { id: "vip-1m", name: "Platinum — 1 Month", price: 90, description: "1 Month, 2 devices Unlimited" },
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

  const formatGhs = (x) => `GHS ${Number(x).toFixed(2)}`;

  const generateTicket = ({ reference, pkg, username, password }) => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(18);
    docPDF.text("Starlink WiFi Bank – Access Ticket", 20, 20);

    docPDF.setFontSize(12);
    docPDF.text(`Name: ${name}`, 20, 40);
    docPDF.text(`Phone: ${phone}`, 20, 50);
    docPDF.text(`Package: ${pkg.name}`, 20, 60);
    docPDF.text(`Username: ${username}`, 20, 70);
    docPDF.text(`Password: ${password}`, 20, 80);
    docPDF.text(`Reference: ${reference}`, 20, 90);
    docPDF.text(`Date: ${new Date().toLocaleString()}`, 20, 100);

    docPDF.save(`Ticket-${reference}.pdf`);

    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 700, 400);

    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText("Starlink WiFi Bank Ticket", 150, 50);

    ctx.font = "20px Arial";
    ctx.fillText(`Name: ${name}`, 50, 120);
    ctx.fillText(`Phone: ${phone}`, 50, 160);
    ctx.fillText(`Package: ${pkg.name}`, 50, 200);
    ctx.fillText(`Username: ${username}`, 50, 240);
    ctx.fillText(`Password: ${password}`, 50, 280);
    ctx.fillText(`Reference: ${reference}`, 50, 320);

    const jpgURL = canvas.toDataURL("image/jpeg");

    const a = document.createElement("a");
    a.href = jpgURL;
    a.download = `Ticket-${reference}.jpg`;
    a.click();
  };

  const payPackage = async (pkg) => {
    if (!phone || !name) return alert("Enter your name and phone number.");
    if (!availability[pkg.id]) return alert(`No credentials available for ${pkg.name}.`);

    if (!window.PaystackPop) {
      alert("Paystack script not loaded. Include https://js.paystack.co/v1/inline.js");
      return;
    }

setProcessing(true);
try {
  // Apply hidden 2% charge
  const finalAmount = pkg.price * 1.02;

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_KEY,
    email: email || "no-reply@starlinkwifi.com",
    amount: Math.round(finalAmount * 100),
    currency: "GHS",
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "name", value: name },
            { display_name: "Phone", variable_name: "phone", value: phone },
            { display_name: "Package", variable_name: "packageId", value: pkg.id },
          ],
        },
        callback: (response) => handlePaymentSuccess(response.reference, pkg),
      });
      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert("Error initiating payment.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (reference, pkg) => {
    setProcessing(true);
    try {
      // pick one available credential
      const snap = await getDocs(
        query(collection(db, "credentials"), where("packageId", "==", pkg.id), where("used", "==", false))
      );
      if (snap.empty) {
        alert("Payment succeeded but no credentials available.");
        return;
      }

      const credDoc = snap.docs[0];
      const credData = credDoc.data();

      // mark credential as used with Firestore server timestamp
      await updateDoc(doc(db, "credentials", credDoc.id), {
        used: true,
        assignedTo: phone,
        assignedAt: serverTimestamp(),
      });

      // Save transaction into BOTH collections to match various admin expectations
      const txData = {
        reference,
        packageId: pkg.id,
        name,
        phone,
        amount: pkg.price,
        username: credData.username,
        password: credData.password,
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      // Primary transactions collection
      await addDoc(collection(db, "transactions"), txData);
      // Some admin dashboards may read from MtnTransactions — write there as well to be safe
      await addDoc(collection(db, "MtnTransactions"), txData);

      // Send SMS (best-effort)
      try {
        const smsMessage = `Hello ${name}, your WiFi access is ready!
Package: ${pkg.name}
Username: ${credData.username}
Password: ${credData.password}
Reference: ${reference}
Thank you for choosing Starlink WiFi Bank.`;

        const response = await fetch(`https://api.mnotify.com/api/sms/quick?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: [phone],
            sender: senderId,
            message: smsMessage,
            is_schedule: false,
            schedule_date: "",
          }),
        });

        const data = await response.json();
        if (data.status === "success") console.log("SMS sent:", data.summary);
        else console.error("SMS failed:", data);
      } catch (smsErr) {
        console.error("SMS error:", smsErr);
      }

      alert(`Payment succeeded! Downloading your ticket.`);

      generateTicket({ reference, pkg, username: credData.username, password: credData.password });

      // update local availability to reflect the used credential
      setAvailability((prev) => ({ ...prev, [pkg.id]: false }));
    } catch (err) {
      console.error(err);
      alert("Payment succeeded but credential assignment failed.");
    } finally {
      setProcessing(false);
      // refresh packages/availability in background
      try {
        const snapReload = await getDocs(collection(db, "packages"));
        const docs = snapReload.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPackages(docs.length ? docs : packages);

        const avail = {};
        for (let pkgIt of (docs.length ? docs : packages)) {
          const snapCreds = await getDocs(
            query(collection(db, "credentials"), where("packageId", "==", pkgIt.id), where("used", "==", false))
          );
          avail[pkgIt.id] = !snapCreds.empty;
        }
        setAvailability(avail);
      } catch (e) {
        console.error("Availability reload error:", e);
      }
    }
  };

  const containerClass =
    theme === "dark"
      ? "min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-700 text-white p-6"
      : "min-h-screen bg-gradient-to-tr from-white via-gray-200 to-gray-300 text-black p-6";

  const cardClass = (isAvailable) =>
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
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className={theme === "dark" ? "text-3xl font-bold text-sky-400 mb-2" : "text-3xl font-bold text-blue-600 mb-2"}>Starlink WiFi Bank</h1>
            <p className={theme === "dark" ? "text-slate-200" : "text-gray-700"}>Fast — Unlimited — Reliable</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleTheme}
              className={theme === "dark" ? "bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 font-bold" : "bg-gray-300 text-black px-4 py-2 rounded-full hover:bg-gray-200 font-bold"}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <a href="tel:0243767677" className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-full font-bold hover:bg-yellow-300">Call Admin</a>
            <a href="/admin/login" className="bg-red-600 text-white px-4 py-2 rounded-full font-bold hover:bg-red-500">Admin</a>
          </div>
        </header>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <input placeholder="Phone (+233...)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingPackages ? (
            <div>Loading packages...</div>
          ) : (
            packages.map((p) => {
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
            })
          )}
        </section>

        <section className="mt-6 relative h-[300px] md:h-[250px]">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-4">Installation Fees</h2>
          <AutoCarousel items={installationItems} theme={theme} whatsappPrefix={(item) => `Hello Admin, I want the ${item.title}.`} />
        </section>

        <section className="mt-6 relative h-[300px] md:h-[250px]">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-4">Dedicated Internet Packages</h2>
          <AutoCarousel items={dedicatedItems} theme={theme} whatsappPrefix={(item) => `Hello Admin, I want to order the ${item.speed} Dedicated Internet Package.`} />
        </section>
      </div>
    </div>
  );
}
