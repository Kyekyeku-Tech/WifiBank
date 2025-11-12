// server/api/send-sms.js
import express from "express";
import fetch from "node-fetch";
const router = express.Router();

const MNOTIFY_KEY = process.env.MNOTIFY_KEY;
const MNOTIFY_SENDER = process.env.MNOTIFY_SENDER || "chidiz hub";

router.post("/", async (req, res) => {
  try {
    const { recipient, message } = req.body;
    if (!recipient || !message)
      return res.status(400).json({ status: false, message: "recipient & message required" });

    const body = new URLSearchParams();
    body.append("recipient", recipient);
    body.append("sender", MNOTIFY_SENDER);
    body.append("message", message);

    const response = await fetch("https://api.mnotify.com/api/sms/quick", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("Send SMS error:", err);
    res.status(500).json({ status: false, message: err.message });
  }
});

export default router;
