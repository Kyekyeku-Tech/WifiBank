// server/index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const sendSmsRouter = require("./api/send-sms");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.status(200).json({ ok: true, service: "wifi-bank-api" });
});

app.use("/api/send-sms", sendSmsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
