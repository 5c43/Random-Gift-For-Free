import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ziina API Configuration
  const ZIINA_API_KEY = process.env.ZIINA_API_KEY;
  if (!ZIINA_API_KEY) {
    console.warn("ZIINA_API_KEY is not set in environment variables. Payment features will be disabled.");
  }
  const ZIINA_BASE_URL = "https://api-v2.ziina.com/api";

  // API routes
  app.post("/api/create-payment-intent", async (req, res) => {
    const { amount, success_url, cancel_url, purchaseId, test = true } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Minimum amount is $1.00 (100 cents)" });
    }

    if (!ZIINA_API_KEY) {
      return res.status(500).json({ error: "Payment system not configured" });
    }

    try {
      console.log(`Attempting to create Ziina payment intent for ${amount} cents (USD)...`);
      const response = await axios.post(
        `${ZIINA_BASE_URL}/payment_intent`,
        {
          amount,
          currency_code: "USD",
          success_url: `${success_url}?purchaseId=${purchaseId}`,
          cancel_url,
          test,
          metadata: {
            purchaseId
          }
        },
        {
          headers: {
            Authorization: `Bearer ${ZIINA_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "X-Requested-With": "XMLHttpRequest"
          }
        }
      );
      console.log("Ziina payment intent created successfully:", response.data.id);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`Ziina API Error (${status || 'Unknown Status'}):`, data || error.message);
      
      if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
        return res.status(status || 500).json({
          error: "Ziina API is currently blocking the request (Cloudflare WAF).",
          details: "Cloudflare is challenging the request. This might be due to the environment or suspicious headers. Status: " + status
        });
      }

      res.status(status || 500).json({ 
        error: "Failed to create payment intent", 
        details: data || error.message 
      });
    }
  });

  // Ziina Webhook - simplified version without Firebase Admin
  app.post("/api/webhooks/ziina", async (req, res) => {
    const event = req.body;
    console.log("Received Ziina webhook event:", event.type);
    // Webhook processing requires Firebase Admin which is not available in this environment
    // In production, you would process the webhook and update Firestore here
    res.json({ received: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
