// src/pages/ZionWifiBank.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function ZionWifiBank() {
  const PAYSTACK_KEY =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PAYSTACK_KEY) ||
    process.env.REACT_APP_PAYSTACK_KEY ||
    "pk_live_8545c70ef4fb392f45389ba119cb921c7911141d";

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [processing, setProcessing] = useState(false);

  // Load packages from Firebase or fallback
  useEffect(() => {
    async function loadPackages() {
      try {
        const snap = await getDocs(collection(db, "packages"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!docs || docs.length === 0) {
          setPackages([
            { id: "bronze-1w", name: "Bronze — 1 Week", price: 20, description: "1 Week Unlimited" },
            { id: "silver-2w", name: "Silver — 2 Weeks", price: 40, description: "2 Weeks Unlimited" },
            { id: "gold-3w", name: "Gold — 3 Weeks", price: 60, description: "3 Weeks Unlimited" },
            { id: "vip-1m", name: "Platinum — 1 Month", price: 90, description: "1 Month, 2 devices" },
          ]);
        } else setPackages(docs);
      } catch (err) {
        console.error("Failed loading packages:", err);
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, []);

  const formatGhs = (x) => `GHS ${Number(x).toFixed(2)}`;

  // Open Paystack payment
  const openPaystack = (pkg) => {
    if (!phone) return alert("Enter your phone number.");
    if (!name) return alert("Enter your name.");

    if (!window.PaystackPop) {
      alert("Paystack script not loaded. Include https://js.paystack.co/v1/inline.js");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: email || "no-reply@zionwifi.com",
      amount: Math.round(pkg.price * 100),
      currency: "GHS",
      metadata: {
        custom_fields: [
          { display_name: "Customer Name", variable_name: "name", value: name },
          { display_name: "Phone", variable_name: "phone", value: phone },
          { display_name: "packageId", variable_name: "packageId", value: pkg.id },
        ],
      },
      callback: function (response) {
        onPaymentSuccess(response.reference, pkg);
      },
      onClose: function () {},
    });

    handler.openIframe();
  };

  // Handle payment success
  const onPaymentSuccess = async (reference, pkg) => {
    setProcessing(true);
    try {
      // Load available credentials
      const snap = await getDocs(
        query(
          collection(db, "credentials"),
          where("packageId", "==", pkg.id),
          where("used", "==", false)
        )
      );

      console.log("Package purchased:", pkg.id);
      console.log("Available credentials:", snap.docs.map(d => d.data()));

      if (snap.empty) {
        alert(
          "Payment succeeded but no credentials available. Admin has been notified."
        );
        await sendSmsAdmin(
          `No credentials available for ${pkg.name} after payment from ${name} (${phone}). Ref: ${reference}`
        );
        return;
      }

      // Pick the first available credential
      const credDoc = snap.docs[0];
      const credData = credDoc.data();

      // Mark credential as used and assign to user
      await updateDoc(doc(db, "credentials", credDoc.id), {
        used: true,
        assignedTo: phone,
        assignedAt: new Date(),
        packageId: pkg.id,
      });

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        reference,
        packageId: pkg.id,
        name,
        phone,
        amount: pkg.price,
        username: credData.username,
        assignedAt: new Date(),
      });

      // Send SMS via server endpoint
      const message = `Your WiFi credentials:\nUsername: ${credData.username}\nPassword: ${credData.password}\nPackage: ${pkg.name}`;
      await sendSmsCustomer(phone, message);

      alert(`Payment successful! Credentials sent to ${phone}.`);
    } catch (err) {
      console.error("Credential assignment failed:", err);
      alert(
        "Payment succeeded but credential assignment failed. Admin has been notified."
      );
      await sendSmsAdmin(
        `Error assigning credential for payment from ${name} (${phone}). Ref: ${reference}. Error: ${err.message}`
      );
    } finally {
      setProcessing(false);
    }
  };

  // Send SMS to admin via server
  const sendSmsAdmin = async (message) => {
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: "+233545454000",
          message,
        }),
      });
      const result = await res.json();
      console.log("Admin SMS result:", result);
    } catch (err) {
      console.error("Admin SMS failed:", err);
    }
  };

  // Send SMS to customer via server
  const sendSmsCustomer = async (recipient, message) => {
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, message }),
      });
      const result = await res.json();
      console.log("Customer SMS result:", result);
    } catch (err) {
      console.error("Customer SMS failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-700 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-sky-400 mb-2">Zion WiFi Bank</h1>
          <p className="text-slate-200">Fast — Unlimited — Reliable</p>
        </header>

        {/* User Form */}
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
        <p className="text-xs text-slate-300 mb-4">
          Enter your phone — credentials will be sent via SMS after payment.
        </p>

        {/* Packages */}
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
                    onClick={() => openPaystack(p)}
                    disabled={processing}
                    className="bg-sky-600 px-4 py-2 rounded-full hover:bg-sky-500"
                  >
                    Pay Now
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
