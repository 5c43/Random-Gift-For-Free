console.log("SERVER.TS LOADED");
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import admin from "firebase-admin";

import fs from "fs";

dotenv.config();

async function startServer() {
  try {
    console.log("Starting server initialization...");
    console.log("Current working directory:", process.cwd());
    console.log("Environment:", process.env.NODE_ENV);

    // Load Firebase Config
    let firebaseConfig;
    const configPath = "./firebase-applet-config.json";
    
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("Firebase config loaded from file for project:", firebaseConfig.projectId);
    } else {
      console.log("firebase-applet-config.json not found, using environment variables.");
      firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)",
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        appId: process.env.FIREBASE_APP_ID
      };
    }

    if (!firebaseConfig.projectId) {
      throw new Error("Firebase Project ID is missing. Please provide firebase-applet-config.json or set FIREBASE_PROJECT_ID environment variable.");
    }

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      try {
        console.log("Initializing Firebase Admin...");
        admin.initializeApp({
          projectId: firebaseConfig.projectId,
        });
        console.log("Firebase Admin initialized.");
      } catch (error) {
        console.error("Error initializing Firebase Admin:", error);
      }
    }

    console.log("Connecting to Firestore database:", firebaseConfig.firestoreDatabaseId);
    // In firebase-admin v13, use getFirestore with databaseId
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);
    console.log("Firestore connection established.");

    console.log("Setting up Express app...");
    const app = express();
    const PORT = process.env.PORT || 3000;

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

    // Ziina Webhook
    app.post("/api/webhooks/ziina", async (req, res) => {
      const event = req.body;
      console.log("Received Ziina webhook event:", event.type);

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const purchaseId = paymentIntent.metadata?.purchaseId;

        if (purchaseId) {
          try {
            const purchaseRef = db.collection("purchases").doc(purchaseId);
            const purchaseDoc = await purchaseRef.get();

            if (purchaseDoc.exists) {
              const purchaseData = purchaseDoc.data();
              
              // Update purchase status
              await purchaseRef.update({
                status: "Pending Delivery",
                paidAt: FieldValue.serverTimestamp()
              });

              // Update listing status to pending (escrow)
              if (purchaseData?.listingId) {
                await db.collection("listings").doc(purchaseData.listingId).update({
                  status: "pending"
                });
              }

              // Create notification for seller
              await db.collection("notifications").add({
                uid: purchaseData?.sellerId,
                title: "New Sale!",
                message: `You have a new sale for ${purchaseData?.price} USD. Please deliver the account.`,
                type: "sale",
                link: `/dashboard?tab=sales`,
                read: false,
                createdAt: FieldValue.serverTimestamp()
              });

              // Create notification for buyer
              await db.collection("notifications").add({
                uid: purchaseData?.buyerId,
                title: "Payment Successful",
                message: `Your payment for the account was successful. You can now chat with the seller.`,
                type: "purchase",
                link: `/chat/${purchaseData?.listingId}`,
                read: false,
                createdAt: FieldValue.serverTimestamp()
              });

              console.log(`Purchase ${purchaseId} updated to Pending Delivery via webhook.`);
            }
          } catch (error) {
            console.error("Error processing Ziina webhook:", error);
            return res.status(500).send("Webhook processing failed");
          }
        }
      }

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

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Vite middleware is ready.");
    });
  } catch (error) {
    console.error("CRITICAL SERVER ERROR:", error);
  }
}

startServer();
