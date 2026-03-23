module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { recipient, message } = req.body || {};

    if (!recipient || !message) {
      return res.status(400).json({ success: false, error: "recipient and message are required" });
    }

    const mnotifyKey = process.env.MNOTIFY_KEY;
    const mnotifySender = process.env.MNOTIFY_SENDER || "Chidiz Hub";

    if (!mnotifyKey) {
      return res.status(500).json({ success: false, error: "MNOTIFY_KEY is not configured" });
    }

    const response = await fetch(
      `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(mnotifyKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: [recipient],
          sender: mnotifySender,
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
  } catch (error) {
    console.error("send-sms api error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};