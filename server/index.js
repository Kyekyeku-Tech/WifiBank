// server/index.js
import express from "express";
import bodyParser from "body-parser";
import sendSmsRouter from "./api/send-sms.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// API endpoint
app.use("/api/send-sms", sendSmsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
