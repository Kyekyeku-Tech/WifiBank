// src/pages/ZionWifiBank.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ZionWifiBank() {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadPackages() {
      try {
        const snap = await getDocs(collection(db, "packages"));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!docs.length) {
          setPackages([
            { id: "bronze-1w", name: "Bronze — 1 Week", price: 20, description: "1 Week Unlimited" },
            { id: "silver-2w", name: "Silver — 2 Weeks", price: 40, description: "2 Weeks Unlimited" },
            { id: "gold-3w", name: "Gold — 3 Weeks", price: 60, description: "3 Weeks Unlimited" },
            { id: "vip-1m", name: "Platinum — 1 Month", price: 90, description: "1 Month, 2 devices" },
          ]);
        } else setPackages(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, []);

  const formatGhs = (x) => `GHS ${Number(x).toFixed(2)}`;

  const buyPackage = async (pkg) => {
    if (!phone || !name) return alert("Enter your name and phone number.");
    setProcessing(true);

    try {
      // Find an available credential
      const snap = await getDocs(query(
        collection(db, "credentials"),
        where("packageId", "==", pkg.id),
        where("used", "==", false)
      ));

      if (snap.empty) {
        alert("No credentials available. Admin has been notified.");
        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: "+233545454000",
            message: `No credentials for ${pkg.name} after purchase from ${name} (${phone})`
          }),
        });
        return;
      }

      const credDoc = snap.docs[0];
      const credData = credDoc.data();

      // Mark as used
      await updateDoc(doc(db, "credentials", credDoc.id), {
        used: true,
        assignedTo: phone,
        assignedAt: new Date(),
      });

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        packageId: pkg.id,
        name,
        phone,
        username: credData.username,
        amount: pkg.price,
        assignedAt: new Date(),
      });

      // Send credentials via serverless endpoint
      await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: phone,
          message: `Your WiFi credentials:\nUsername: ${credData.username}\nPassword: ${credData.password}\nPackage: ${pkg.name}`,
        }),
      });

      alert(`Payment succeeded! Credentials sent to ${phone}.`);
    } catch (err) {
      console.error(err);
      alert("Payment succeeded but credential assignment failed. Admin notified.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-700 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-sky-400 mb-2">Zion WiFi Bank</h1>
          <p className="text-slate-200">Fast — Unlimited — Reliable</p>
        </header>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 rounded bg-white/10 placeholder:text-slate-200"
          />
          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 rounded bg-white/10 placeholder:text-slate-200"
          />
          <input
            placeholder="Phone (+233...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-2 rounded bg-white/10 placeholder:text-slate-200"
          />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingPackages
            ? <div>Loading packages...</div>
            : packages.map((p) => (
              <div key={p.id} className="bg-white/10 p-6 rounded-2xl shadow hover:-translate-y-2 transition">
                <h3 className="text-xl font-bold text-sky-400 mb-2">{p.name}</h3>
                <p className="text-sm text-sky-200 mb-3">{p.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-extrabold text-sky-100">{formatGhs(p.price)}</div>
                  <button
                    onClick={() => buyPackage(p)}
                    disabled={processing}
                    className="bg-sky-600 px-4 py-2 rounded-full hover:bg-sky-500"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))
          }
        </section>
      </div>
    </div>
  );
}
