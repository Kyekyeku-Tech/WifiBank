const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { recipient, message } = req.body || {};

    if (!recipient || !message) {
      return res.status(400).json({ success: false, error: "recipient and message are required" });
    }

    const MNOTIFY_KEY = process.env.MNOTIFY_KEY;
    const MNOTIFY_SENDER = process.env.MNOTIFY_SENDER || "ZionWifi";

    if (!MNOTIFY_KEY) {
      return res.status(500).json({ success: false, error: "MNOTIFY_KEY is not configured" });
    }

    const response = await fetch(
      `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(MNOTIFY_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: [recipient],
          sender: MNOTIFY_SENDER,
          message,
          is_schedule: false,
          schedule_date: "",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("send-sms error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
