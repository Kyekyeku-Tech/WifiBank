// Full working ZionWifiBank.jsx
import React, { useCallback, useEffect, useState } from "react";
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
      ? "p-7 rounded-3xl shadow-xl border border-cyan-200/20 transition transform bg-slate-900/70 backdrop-blur-md hover:-translate-y-1 flex flex-col items-center justify-center"
      : "p-7 rounded-3xl shadow-xl border border-slate-200 transition transform bg-white/90 backdrop-blur-md hover:-translate-y-1 flex flex-col items-center justify-center";

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

  const PAYSTACK_KEY = process.env.REACT_APP_PAYSTACK_KEY;
  const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
  const MNOTIFY_KEY = process.env.REACT_APP_MNOTIFY_KEY || "";
  const MNOTIFY_SENDER = process.env.REACT_APP_MNOTIFY_SENDER || "Chidiz Hub";

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const normalizePackageValue = useCallback(
    (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""),
    []
  );

  const buildPackageCandidates = useCallback((pkg) => {
    const candidates = new Set();
    const rawValues = [pkg?.id, pkg?.name, pkg?.description, pkg?.price];

    for (const raw of rawValues) {
      const normalized = normalizePackageValue(raw);
      if (normalized) candidates.add(normalized);
    }

    const primary = `${pkg?.id || ""} ${pkg?.name || ""} ${pkg?.description || ""} ${pkg?.price || ""}`.toLowerCase();
    const normalizedPrimary = normalizePackageValue(primary);
    if (primary.includes("bronze")) {
      candidates.add("bronze");
      candidates.add("bronze1week");
      candidates.add("bronze1w");
      candidates.add("1week");
      candidates.add("week1");
      candidates.add("20");
      candidates.add("ghs20");
    }
    if (primary.includes("silver")) {
      candidates.add("silver");
      candidates.add("silver2weeks");
      candidates.add("silver2w");
      candidates.add("2weeks");
      candidates.add("2week");
      candidates.add("week2");
      candidates.add("40");
      candidates.add("ghs40");
    }
    if (primary.includes("gold")) {
      candidates.add("gold");
      candidates.add("gold3weeks");
      candidates.add("gold3w");
      candidates.add("3weeks");
      candidates.add("3week");
      candidates.add("week3");
      candidates.add("60");
      candidates.add("ghs60");
    }
    if (primary.includes("vip") || primary.includes("platinum")) {
      candidates.add("vip");
      candidates.add("vip1month");
      candidates.add("vip1m");
      candidates.add("platinum");
      candidates.add("platinum1month");
      candidates.add("1month");
      candidates.add("month1");
      candidates.add("90");
      candidates.add("ghs90");
    }

    if (normalizedPrimary.includes("1week") || normalizedPrimary.includes("1w") || normalizedPrimary.includes("weekly")) {
      candidates.add("bronze");
      candidates.add("bronze1week");
      candidates.add("bronze1w");
      candidates.add("1week");
    }
    if (normalizedPrimary.includes("2weeks") || normalizedPrimary.includes("2week") || normalizedPrimary.includes("2w")) {
      candidates.add("silver");
      candidates.add("silver2weeks");
      candidates.add("silver2w");
      candidates.add("2weeks");
    }
    if (normalizedPrimary.includes("3weeks") || normalizedPrimary.includes("3week") || normalizedPrimary.includes("3w")) {
      candidates.add("gold");
      candidates.add("gold3weeks");
      candidates.add("gold3w");
      candidates.add("3weeks");
    }
    if (normalizedPrimary.includes("1month") || normalizedPrimary.includes("monthly") || normalizedPrimary.includes("30day")) {
      candidates.add("vip");
      candidates.add("platinum");
      candidates.add("vip1month");
      candidates.add("vip1m");
    }

    return candidates;
  }, [normalizePackageValue]);

  const fetchWithTimeout = async (promise, timeoutMs = 12000) => {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("Network timeout")), timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };

  const isCredentialUnused = useCallback((cred) => {
    const used = cred?.used;
    if (used === false || used === 0 || used === "0") return true;
    if (used === null || typeof used === "undefined" || used === "") return true;
    if (typeof used === "string") {
      const val = used.trim().toLowerCase();
      return val === "false" || val === "unused" || val === "no" || val === "notused";
    }
    return false;
  }, []);

  const getCredentialPackageValues = useCallback((cred) => {
    return [
      cred?.packageId,
      cred?.package,
      cred?.packageName,
      cred?.plan,
      cred?.type,
      cred?.description,
      cred?.name,
      cred?.price,
    ];
  }, []);

  const packageMatchesCandidates = useCallback(
    (cred, candidates) => {
      const packageValues = getCredentialPackageValues(cred);

      for (const value of packageValues) {
        const normalized = normalizePackageValue(value);
        if (!normalized) continue;

        if (candidates.has(normalized)) return true;

        for (const candidate of candidates) {
          if (!candidate) continue;
          if (normalized.includes(candidate) || candidate.includes(normalized)) {
            return true;
          }
        }
      }

      return false;
    },
    [getCredentialPackageValues, normalizePackageValue]
  );

  const checkPackageAvailability = useCallback(async (pkg, retries = 2) => {
    const pkgId = pkg?.id;
    const candidates = buildPackageCandidates(pkg);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const exactSnap = await fetchWithTimeout(
          getDocs(
            query(collection(db, "credentials"), where("packageId", "==", pkgId), where("used", "==", false))
          ),
          12000
        );

        if (!exactSnap.empty) {
          return true;
        }

        // Fallback for mixed production schemas (different package fields, used as string).
        const allCredsSnap = await fetchWithTimeout(getDocs(collection(db, "credentials")), 12000);

        const found = allCredsSnap.docs.some((d) => {
          const cred = d.data();
          return isCredentialUnused(cred) && packageMatchesCandidates(cred, candidates);
        });

        return found ? true : null;
      } catch (error) {
        if (attempt === retries) {
          return null;
        }
        await wait(700 * (attempt + 1));
      }
    }
    return null;
  }, [buildPackageCandidates, isCredentialUnused, packageMatchesCandidates]);

  const getFirstAvailableCredential = useCallback(async (pkg, retries = 2) => {
    const pkgId = pkg?.id;
    const candidates = buildPackageCandidates(pkg);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const exactSnap = await fetchWithTimeout(
          getDocs(
            query(collection(db, "credentials"), where("packageId", "==", pkgId), where("used", "==", false))
          ),
          12000
        );

        if (!exactSnap.empty) {
          return exactSnap.docs[0];
        }

        const allCredsSnap = await fetchWithTimeout(getDocs(collection(db, "credentials")), 12000);

        const fallbackDoc = allCredsSnap.docs.find((d) => {
          const cred = d.data();
          return isCredentialUnused(cred) && packageMatchesCandidates(cred, candidates);
        });

        if (fallbackDoc) {
          return fallbackDoc;
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
      }

      await wait(700 * (attempt + 1));
    }

    return null;
  }, [buildPackageCandidates, isCredentialUnused, packageMatchesCandidates]);

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
              { id: "bronze-1w", name: "Bronze — 1 Week", price: 1, description: "1 Week Unlimited" },
              { id: "silver-2w", name: "Silver — 2 Weeks", price: 40, description: "2 Weeks Unlimited" },
              { id: "gold-3w", name: "Gold — 3 Weeks", price: 60, description: "3 Weeks Unlimited" },
              { id: "vip-1m", name: "Platinum — 1 Month", price: 90, description: "1 Month, 2 devices Unlimited" },
            ];
        setPackages(pkgs);

        const avail = {};
        for (let pkg of pkgs) {
          const status = await checkPackageAvailability(pkg, 2);
          if (status === true || status === false) {
            avail[pkg.id] = status;
          }
        }
        setAvailability(avail);
      } catch (err) {
        console.error(err);
        alert(
          "Could not load database data. If this is hosted on MikroTik, make sure this origin is allowed in Firebase Auth Authorized domains and Firestore rules allow reads/writes for your app."
        );
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, [checkPackageAvailability]);

  const formatGhs = (x) => `GHS ${Number(x).toFixed(2)}`;

  const buildSmsApiTargets = () => {
    const targets = new Set();

    if (API_BASE_URL) targets.add(API_BASE_URL);

    if (typeof window !== "undefined" && window.location?.origin) {
      targets.add(window.location.origin);
    }

    // Known hosted origins used by this project.
    targets.add("https://wifi-bank.vercel.app");
    targets.add("https://iqsmartboostservices.com");

    return Array.from(targets);
  };

  const buildPhoneCandidates = (rawPhone) => {
    const cleaned = String(rawPhone || "").trim().replace(/\s+/g, "");
    const digits = cleaned.replace(/\D/g, "");
    const candidates = new Set();

    if (cleaned) candidates.add(cleaned);
    if (digits) candidates.add(digits);

    if (digits.startsWith("0") && digits.length === 10) {
      candidates.add(`233${digits.slice(1)}`);
      candidates.add(`+233${digits.slice(1)}`);
    }

    if (digits.startsWith("233") && digits.length >= 12) {
      const local = `0${digits.slice(3)}`;
      candidates.add(local);
      candidates.add(`+${digits}`);
      candidates.add(digits);
    }

    if (cleaned.startsWith("+233")) {
      const localFromPlus = `0${cleaned.slice(4).replace(/\D/g, "")}`;
      if (localFromPlus.length === 10) candidates.add(localFromPlus);
    }

    return Array.from(candidates).filter(Boolean);
  };

  const sendSms = async ({ recipient, message }) => {
    const recipients = buildPhoneCandidates(recipient);
    const apiTargets = buildSmsApiTargets();

    for (const apiBase of apiTargets) {
      const endpoint = `${apiBase.replace(/\/$/, "")}/api/send-sms`;
      for (const phoneCandidate of recipients) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: phoneCandidate, message }),
          });

          const data = await response.json();
          if (response.ok && data.success) {
            return true;
          }

          console.error("Backend SMS failed:", endpoint, phoneCandidate, data);
        } catch (error) {
          console.error("Backend SMS error:", endpoint, phoneCandidate, error);
        }
      }
    }

    if (!MNOTIFY_KEY) {
      return false;
    }

    for (const phoneCandidate of recipients) {
      try {
        const response = await fetch(
          `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(MNOTIFY_KEY)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: [phoneCandidate],
              sender: MNOTIFY_SENDER,
              message,
              is_schedule: false,
              schedule_date: "",
            }),
          }
        );

        const data = await response.json();
        if (response.ok && data.status === "success") {
          return true;
        }

        console.error("Direct mNotify SMS failed:", phoneCandidate, data);
      } catch (error) {
        console.error("Direct mNotify SMS error:", phoneCandidate, error);
      }
    }

    return false;
  };

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

    try {
      docPDF.save(`Ticket-${reference}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    }

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

    try {
      const a = document.createElement("a");
      a.href = jpgURL;
      a.download = `Ticket-${reference}.jpg`;
      a.click();
    } catch (err) {
      console.error("JPG download failed:", err);
    }

    return jpgURL;
  };

  const payPackage = async (pkg) => {
    if (!phone || !name) return alert("Enter your name and phone number.");
   if (availability[pkg.id] === false) {
    const refreshedAvailability = await checkPackageAvailability(pkg, 3);

  if (refreshedAvailability !== false) {
    if (refreshedAvailability === true) {
      setAvailability((prev) => ({ ...prev, [pkg.id]: true }));
    }
  } else {
  const msg = `Hello Admin, I want to buy the ${pkg.name} package but it shows as unavailable. Please assist me.`;

  const goWhatsApp = window.confirm(
    `${pkg.name} is currently SOLD OUT.\n\nClick OK to contact admin on WhatsApp, or Cancel to close.`
  );

  if (goWhatsApp) {
    window.open(
      `https://wa.me/233243767677?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  }
  return;
  }
}

    if (!PAYSTACK_KEY) {
      alert("Paystack key is missing. Set REACT_APP_PAYSTACK_KEY in your production environment.");
      return;
    }

    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    const isSecure = window.location.protocol === "https:";
    if (!isLocalHost && !isSecure) {
      alert("Paystack live payments require HTTPS. Use HTTPS on MikroTik or host checkout on an HTTPS domain.");
      return;
    }


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
      // pick one available credential with retries for slow networks
      const credDoc = await getFirstAvailableCredential(pkg, 3);
      if (!credDoc) {
        alert("Payment succeeded but credential sync is delayed. Please contact admin with your payment reference.");
        return;
      }
      const credData = credDoc.data();

      const syncErrors = [];

      // mark credential as used with Firestore server timestamp
      try {
        await updateDoc(doc(db, "credentials", credDoc.id), {
          used: true,
          assignedTo: phone,
          assignedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Credential update failed:", err);
        syncErrors.push("credential-update");
      }

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
      try {
        await addDoc(collection(db, "transactions"), txData);
      } catch (err) {
        console.error("transactions write failed:", err);
        syncErrors.push("transactions");
      }

      // Some admin dashboards may read from MtnTransactions — write there as well to be safe
      try {
        await addDoc(collection(db, "MtnTransactions"), txData);
      } catch (err) {
        console.error("MtnTransactions write failed:", err);
        syncErrors.push("mtn-transactions");
      }

      const smsMessage = `Hello ${name}, your WiFi access is ready!
Package: ${pkg.name}
Username: ${credData.username}
Password: ${credData.password}
Reference: ${reference}
Thank you for choosing Starlink WiFi Bank.`;
      const smsSent = await sendSms({ recipient: phone, message: smsMessage });

      const credentialSummary = `Username: ${credData.username}\nPassword: ${credData.password}\nReference: ${reference}`;

      if (!smsSent) {
        try {
          await navigator.clipboard.writeText(credentialSummary);
        } catch (e) {
          console.error("Clipboard copy failed:", e);
        }
      }

      if (!smsSent) {
        alert(
          `Payment succeeded, but SMS delivery failed.\n\n${credentialSummary}\n\nThese details have been copied (if clipboard is allowed).`
        );
      } else if (syncErrors.length) {
        alert(
          `Payment succeeded and SMS sent, but admin sync had delays (${syncErrors.join(", ")}). Your access details are:\n\n${credentialSummary}`
        );
      } else {
        alert("Payment succeeded! Downloading your ticket and sending SMS.");
      }

      const ticketImageUrl = generateTicket({ reference, pkg, username: credData.username, password: credData.password });

      // Mobile browsers sometimes block automatic file downloads; open a viewable receipt fallback.
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobile && ticketImageUrl) {
        window.open(ticketImageUrl, "_blank");
      }

      // update local availability only if credential usage was synced
      if (!syncErrors.includes("credential-update")) {
        setAvailability((prev) => ({ ...prev, [pkg.id]: false }));
      }
    } catch (err) {
      console.error(err);
      alert("Payment succeeded but credential assignment failed. Please contact admin with your payment reference immediately.");
    } finally {
      setProcessing(false);
      // refresh packages/availability in background
      try {
        const snapReload = await getDocs(collection(db, "packages"));
        const docs = snapReload.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPackages(docs.length ? docs : packages);

        const avail = {};
        for (let pkgIt of (docs.length ? docs : packages)) {
          const status = await checkPackageAvailability(pkgIt, 2);
          if (status === true || status === false) {
            avail[pkgIt.id] = status;
          }
        }
        setAvailability(avail);
      } catch (e) {
        console.error("Availability reload error:", e);
      }
    }
  };

  const containerClass =
    theme === "dark"
      ? "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_5%,#12365f_0%,#0b1220_40%,#05070b_100%)] text-slate-100 px-4 py-8 md:px-8"
      : "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_4%,#d6ebff_0%,#f3f7fb_42%,#ffffff_100%)] text-slate-900 px-4 py-8 md:px-8";

  const packageCardClass = (isAvailable) =>
    theme === "dark"
      ? `rounded-3xl border p-6 shadow-xl transition-all duration-300 ${
          isAvailable
            ? "border-cyan-200/25 bg-slate-900/70 backdrop-blur-lg hover:-translate-y-1"
            : "border-slate-700/70 bg-slate-900/45 opacity-70"
        }`
      : `rounded-3xl border p-6 shadow-xl transition-all duration-300 ${
          isAvailable
            ? "border-slate-200 bg-white/95 backdrop-blur-lg hover:-translate-y-1"
            : "border-slate-200 bg-slate-100/85 opacity-75"
        }`;

  const inputClass =
    "h-12 rounded-xl px-4 text-sm outline-none transition placeholder:text-slate-400 " +
    (theme === "dark"
      ? "bg-slate-950/70 border-2 border-slate-500 text-slate-100 shadow-inner shadow-black/20 focus:border-cyan-300"
      : "bg-white border-2 border-slate-500 text-slate-900 shadow-inner shadow-slate-300/60 focus:border-blue-700");

  const buttonClass = (isAvailable) =>
    isAvailable
      ? theme === "dark"
        ? "w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        : "w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
      : "w-full rounded-xl bg-slate-400 px-4 py-3 text-sm font-semibold text-slate-700 cursor-not-allowed";

  return (
    <div className={containerClass} style={{ fontFamily: "Sora, IBM Plex Sans, Segoe UI, sans-serif" }}>
      <div
        className={
          theme === "dark"
            ? "pointer-events-none absolute -top-24 -right-10 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl"
            : "pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full bg-blue-300/45 blur-3xl"
        }
      />
      <div
        className={
          theme === "dark"
            ? "pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
            : "pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-teal-200/60 blur-3xl"
        }
      />

      <main className="relative mx-auto max-w-7xl space-y-8">
        <header
          className={
            theme === "dark"
              ? "flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/10 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between"
              : "flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/75 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between"
          }
        >
          <div>
            <div
              className={
                theme === "dark"
                  ? "mb-2 inline-flex items-center rounded-full border border-cyan-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"
                  : "mb-2 inline-flex items-center rounded-full border border-blue-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700"
              }
            >
              Enterprise Connectivity Portal
            </div>
            <h1 className={theme === "dark" ? "text-3xl font-semibold text-white md:text-4xl" : "text-3xl font-semibold text-slate-900 md:text-4xl"}>
              Starlink WiFi Bank
            </h1>
            <p className={theme === "dark" ? "mt-2 text-slate-300" : "mt-2 text-slate-700"}>Reliable plans for homes, teams, and business operations.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleTheme}
              className={theme === "dark" ? "rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700" : "rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300"}
            >
              {theme === "dark" ? "Light View" : "Dark View"}
            </button>
            <a href="tel:0243767677" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300">Call Admin</a>
            <a href="/admin/dashboard" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">Admin Access</a>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={theme === "dark" ? "lg:col-span-2 rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-7 backdrop-blur-lg" : "lg:col-span-2 rounded-3xl border border-slate-200 bg-white/95 p-7 backdrop-blur-lg"}
          >
            <h2 className={theme === "dark" ? "text-2xl font-semibold text-white md:text-3xl" : "text-2xl font-semibold text-slate-900 md:text-3xl"}>Premium internet plans with instant activation</h2>
            <p className={theme === "dark" ? "mt-3 text-slate-300" : "mt-3 text-slate-700"}>
              Choose a package, complete secure payment, and receive your credentials instantly by SMS with downloadable ticket support.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className={theme === "dark" ? "rounded-2xl border border-cyan-200/20 bg-slate-950/50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                <div className={theme === "dark" ? "text-xs uppercase tracking-widest text-cyan-400" : "text-xs uppercase tracking-widest text-blue-700"}>Service SLA</div>
                <div className={theme === "dark" ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-slate-900"}>99.9% Availability</div>
              </div>
              <div className={theme === "dark" ? "rounded-2xl border border-cyan-200/20 bg-slate-950/50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                <div className={theme === "dark" ? "text-xs uppercase tracking-widest text-cyan-400" : "text-xs uppercase tracking-widest text-blue-700"}>Activation</div>
                <div className={theme === "dark" ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-slate-900"}>Under 60 Seconds</div>
              </div>
              <div className={theme === "dark" ? "rounded-2xl border border-cyan-200/20 bg-slate-950/50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                <div className={theme === "dark" ? "text-xs uppercase tracking-widest text-cyan-400" : "text-xs uppercase tracking-widest text-blue-700"}>Support</div>
                <div className={theme === "dark" ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-slate-900"}>Direct WhatsApp Team</div>
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={theme === "dark" ? "rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-6 backdrop-blur-lg" : "rounded-3xl border border-slate-200 bg-white/95 p-6 backdrop-blur-lg"}
          >
            <h3 className={theme === "dark" ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-900"}>Customer Profile</h3>
            <p className={theme === "dark" ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-700"}>Required before checkout</p>
            <div className="mt-4 grid gap-3">
              <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              <input placeholder="Phone (+233...)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
          </motion.aside>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={theme === "dark" ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-900"}>Available WiFi Packages</h2>
            <div className={theme === "dark" ? "text-sm text-slate-300" : "text-sm text-slate-700"}>Secure checkout via Paystack</div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {loadingPackages ? (
              <div className={theme === "dark" ? "rounded-2xl border border-slate-700 bg-slate-900/50 p-6 text-slate-300" : "rounded-2xl border border-slate-200 bg-white p-6 text-slate-700"}>Loading packages...</div>
            ) : (
              packages.map((p, i) => {
                const hasAvailability = Object.prototype.hasOwnProperty.call(availability, p.id);
                const isAvailable = hasAvailability ? availability[p.id] : true;
                return (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className={packageCardClass(isAvailable)}
                  >
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <h3 className={theme === "dark" ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-900"}>{p.name}</h3>
                      <span
                        className={
                          hasAvailability
                            ? isAvailable
                              ? theme === "dark"
                                ? "rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300"
                                : "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800"
                              : theme === "dark"
                              ? "rounded-full bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-300"
                              : "rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-800"
                            : theme === "dark"
                            ? "rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300"
                            : "rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800"
                        }
                      >
                        {hasAvailability ? (isAvailable ? "Available" : "Sold Out") : "Checking"}
                      </span>
                    </div>

                    <p className={theme === "dark" ? "min-h-12 text-sm text-slate-300" : "min-h-12 text-sm text-slate-700"}>{p.description}</p>
                    <div className={theme === "dark" ? "mt-5 text-3xl font-semibold text-cyan-300" : "mt-5 text-3xl font-semibold text-blue-700"}>{formatGhs(p.price)}</div>
                    <div className={theme === "dark" ? "mb-5 mt-1 text-xs text-slate-400" : "mb-5 mt-1 text-xs text-slate-500"}>Transaction fee included automatically at checkout.</div>

                    <button
                      onClick={() => payPackage(p)}
                      className={buttonClass(isAvailable)}
                      disabled={processing || !isAvailable}
                    >
                      {processing ? "Processing..." : "Buy Now"}
                    </button>
                  </motion.article>
                );
              })
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 pb-2 lg:grid-cols-2">
          <div className={theme === "dark" ? "rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-6 backdrop-blur-lg" : "rounded-3xl border border-slate-200 bg-white/95 p-6 backdrop-blur-lg"}>
            <h2 className={theme === "dark" ? "mb-4 text-xl font-semibold text-white" : "mb-4 text-xl font-semibold text-slate-900"}>Installation Services</h2>
            <div className="h-[280px]">
              <AutoCarousel items={installationItems} theme={theme} whatsappPrefix={(item) => `Hello Admin, I want the ${item.title}.`} />
            </div>
          </div>

          <div className={theme === "dark" ? "rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-6 backdrop-blur-lg" : "rounded-3xl border border-slate-200 bg-white/95 p-6 backdrop-blur-lg"}>
            <h2 className={theme === "dark" ? "mb-4 text-xl font-semibold text-white" : "mb-4 text-xl font-semibold text-slate-900"}>Dedicated Internet</h2>
            <div className="h-[280px]">
              <AutoCarousel items={dedicatedItems} theme={theme} whatsappPrefix={(item) => `Hello Admin, I want to order the ${item.speed} Dedicated Internet Package.`} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
