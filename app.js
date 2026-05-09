require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/auth");
const verificationRoutes = require("./src/routes/verification");

connectDB();

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again in 15 minutes.",
  },
});
app.use("/api", limiter);
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,               
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 10 minutes.",
  },
});
app.use("/api/verify/send-otp", otpLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "docs")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/verify", verificationRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "API is running 🚀" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Mock SMS    : ${process.env.MOCK_SMS === "true" ? "ON" : "OFF"}`);
  });
}

module.exports = app;
