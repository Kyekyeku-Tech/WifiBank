// serverless function: /api/send-sms.js
import fetch from "node-fetch";

export async function POST(req) {
  try {
    const { recipient, message } = await req.json();

    const MNOTIFY_KEY = process.env.MNOTIFY_KEY; // store in .env
    const MNOTIFY_SENDER = process.env.MNOTIFY_SENDER || "ZionWifi";

    const formData = new URLSearchParams();
    formData.append("recipient", recipient);
    formData.append("sender", MNOTIFY_SENDER);
    formData.append("message", message);

    const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(MNOTIFY_KEY)}`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
