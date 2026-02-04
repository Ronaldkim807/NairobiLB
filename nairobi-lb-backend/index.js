import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// M-Pesa service
import mpesaService from "./services/mpesaService.js";

// API route imports
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import chatbotRoutes from "./routes/chatbot.js";
import organizerRoutes from "./routes/organizer.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Check M-Pesa config
function checkMpesaConfig() {
  const required = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
    "MPESA_CALLBACK_URL",
  ];
  const missing = required.filter((k) => !process.env[k] || process.env[k] === "UNDEFINED");
  if (missing.length > 0) {
    console.warn("⚠️  M-Pesa environment variables missing:", missing);
    return false;
  }
  return true;
}
const mpesaReady = checkMpesaConfig();

// M-Pesa payment handler
async function handleMpesaPay(req, res) {
  const { phone, amount } = req.body;
  if (!phone || amount == null) return res.status(400).json({ error: "Phone and amount required" });

  let normalizedPhone = String(phone).trim();
  if (normalizedPhone.startsWith("0")) normalizedPhone = `254${normalizedPhone.slice(1)}`;

  const integerAmount = Math.round(Number(amount));
  if (Number.isNaN(integerAmount) || integerAmount <= 0)
    return res.status(400).json({ error: "Amount must be positive" });

  if (!mpesaReady)
    return res.status(500).json({ error: "M-Pesa not configured on this server" });

  try {
    console.log(`Initiating STK Push for ${normalizedPhone} amount ${integerAmount}`);
    const response = await mpesaService.initiateSTKPush(
      normalizedPhone,
      integerAmount,
      "NairobiLB",
      "Event Ticket Payment"
    );
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error in /mpesa/pay:", error.response?.data || error.message || error);
    return res.status(500).json({
      error: error.message || "Failed to initiate payment",
      details: error.response?.data ?? null,
    });
  }
}

// Root + health endpoints
app.get("/", (req, res) => res.send("Nairobi LB Backend is running!"));
app.get("/api/health", (req, res) =>
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mpesaConfigured: mpesaReady,
  })
);

// M-Pesa endpoints
app.post("/mpesa/pay", handleMpesaPay);
app.post("/api/mpesa/pay", handleMpesaPay);

app.post("/mpesa/callback", async (req, res) => {
  try {
    console.log("M-Pesa Callback received:", new Date().toISOString());
    console.dir(req.body, { depth: 5 });
    // TODO: persist callback to DB and handle booking/payment updates
    return res.status(200).json({ status: "success", message: "Callback received" });
  } catch (err) {
    console.error("Error handling M-Pesa callback:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);

// Catch-all 404 (no more /*, fixes path-to-regexp error)
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const cb = process.env.MPESA_CALLBACK_URL || "(MPESA_CALLBACK_URL not set)";
  console.log(`MPESA_CALLBACK_URL = ${cb}`);
  if (!mpesaReady) console.log("Tip: set missing MPESA_* variables in .env for STK testing");
});
