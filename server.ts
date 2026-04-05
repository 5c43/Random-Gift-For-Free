console.log("SERVER.TS LOADED");
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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
    if (getApps().length === 0) {
      try {
        console.log("Initializing Firebase Admin with project ID:", firebaseConfig.projectId);
        
        // Set environment variables to ensure the SDK uses the correct project and database
        process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
        process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
        if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
          process.env.FIRESTORE_DATABASE = firebaseConfig.firestoreDatabaseId;
        }

        // Explicitly pass the project ID and credentials to initializeApp
        initializeApp({
          projectId: firebaseConfig.projectId,
          credential: admin.credential.applicationDefault()
        });
        
        console.log("Firebase Admin initialized successfully.");
        console.log("Admin Project ID:", getApp().options.projectId);
      } catch (error) {
        console.error("Error initializing Firebase Admin:", error);
        // Fallback to basic initialization
        initializeApp();
      }
    }

    const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" 
      ? firebaseConfig.firestoreDatabaseId 
      : undefined;

    console.log("Connecting to Firestore:");
    console.log("- Project ID:", firebaseConfig.projectId);
    console.log("- Database ID:", databaseId || "(default)");

    // Use getFirestore(getApp(), databaseId) which is the most explicit way
    const db = getFirestore(getApp(), databaseId);
    console.log(`Firestore client initialized with getFirestore(getApp(), "${databaseId || "(default)"}").`);

    // Test Firestore connection immediately
    (async () => {
      try {
        console.log("Testing Firestore connection...");
        const testRef = db.collection("purchases").limit(1);
        await testRef.get();
        console.log("Firestore connection test successful.");
      } catch (e: any) {
        console.error("Firestore connection test FAILED:", e.message);
        if (e.code === 7 || e.message.includes('PERMISSION_DENIED')) {
          console.error("CRITICAL: The service account does not have permission to access the database:", databaseId || "(default)");
          console.error("Please ensure the service account has 'Cloud Datastore User' role on the project and database.");
        }
      }
    })();

    console.log("Setting up Express app...");
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());

    // Health check route
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Ziina API Configuration
    const ZIINA_API_KEY = process.env.ZIINA_API_KEY;
    if (!ZIINA_API_KEY) {
      console.warn("ZIINA_API_KEY is not set in environment variables. Payment features will be disabled.");
    }
    const ZIINA_BASE_URL = "https://api-v2.ziina.com/api";

    // API routes
    app.post("/api/create-payment-intent", async (req, res) => {
      const { amount, success_url, cancel_url, purchaseId, test: bodyTest } = req.body;

      if (!amount || amount < 100) {
        return res.status(400).json({ error: "Minimum amount is $1.00 (100 cents)" });
      }

      try {
        console.log(`Attempting to create Ziina payment intent for ${amount} cents (USD)...`);
        
        if (!ZIINA_API_KEY) {
          throw new Error("ZIINA_API_KEY is missing. Please set it in environment variables.");
        }

        // Determine if we should use test mode
        // 1. If ZIINA_TEST_MODE is explicitly 'false', use live mode (false)
        // 2. Otherwise, if ZIINA_TEST_MODE is 'true', use test mode (true)
        // 3. Otherwise, use the value from the request body (defaulting to false for safety)
        let isTest = bodyTest === true;
        if (process.env.ZIINA_TEST_MODE === 'false') {
          isTest = false;
        } else if (process.env.ZIINA_TEST_MODE === 'true') {
          isTest = true;
        }

        console.log(`Creating payment intent in ${isTest ? 'TEST' : 'LIVE'} mode.`);

        const response = await axios.post(
          `${ZIINA_BASE_URL}/payment_intent`,
          {
            amount,
            currency_code: "USD",
            success_url: `${success_url}?purchaseId=${purchaseId}`,
            cancel_url,
            test: isTest,
            metadata: {
              purchaseId,
              isTopUp: req.body.isTopUp ? "true" : "false",
              userId: req.body.userId
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
        
        const ziinaId = response.data.id;
        console.log("Ziina payment intent created successfully:", ziinaId);
        
        // Update purchase record with Ziina ID
        if (purchaseId) {
          try {
            console.log(`Updating purchase ${purchaseId} with Ziina ID ${ziinaId}...`);
            const purchaseRef = db.collection("purchases").doc(purchaseId);
            
            // Check if document exists first
            const docSnap = await purchaseRef.get();
            if (!docSnap.exists) {
              console.warn(`Purchase document ${purchaseId} not found. Creating new record.`);
            }
            
            // Use set with merge: true as it's often more resilient than update
            await purchaseRef.set({
              ziinaId: ziinaId,
              updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log("Purchase record updated with Ziina ID.");
          } catch (firestoreError: any) {
            console.error("Firestore Update Error (Purchase ID):", firestoreError.message);
            if (firestoreError.code === 7 || firestoreError.message.includes('PERMISSION_DENIED')) {
              console.error("PERMISSION_DENIED: The service account may lack permissions for the project or the named database.");
            }
            // CRITICAL: We do NOT throw here. We want the user to be able to proceed to payment
            // even if our internal tracking update fails. The webhook will handle the status update.
            console.warn("Continuing to payment despite Firestore update failure.");
          }
        }

        res.json(response.data);
      } catch (error: any) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        console.error(`Payment Intent Error (${status || 'Internal'}):`, data || error.message);
        
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

    app.get("/api/check-payment-status/:purchaseId", async (req, res) => {
      const { purchaseId } = req.params;
      
      try {
        const purchaseRef = db.collection("purchases").doc(purchaseId);
        const purchaseDoc = await purchaseRef.get();
        
        if (!purchaseDoc.exists) {
          return res.status(404).json({ error: "Purchase not found" });
        }
        
        const purchaseData = purchaseDoc.data();
        
        // If already paid, return success
        if (purchaseData?.status === "Pending Delivery") {
          return res.json({ status: "Pending Delivery" });
        }
        
        const ziinaId = purchaseData?.ziinaId;
        if (!ziinaId) {
          return res.json({ status: purchaseData?.status || "awaiting_payment" });
        }
        
        // Call Ziina to check status
        const response = await axios.get(
          `${ZIINA_BASE_URL}/payment_intent/${ziinaId}`,
          {
            headers: {
              Authorization: `Bearer ${ZIINA_API_KEY}`,
              "Accept": "application/json"
            }
          }
        );
        
        const ziinaStatus = response.data.status;
        console.log(`Ziina status for ${ziinaId}:`, ziinaStatus);
        
        if (ziinaStatus === "completed" || ziinaStatus === "succeeded") {
          // Manually trigger the success logic if Ziina says it's done
          await purchaseRef.update({
            status: "Pending Delivery",
            paidAt: FieldValue.serverTimestamp()
          });

          // Update listing status
          if (purchaseData?.listingId) {
            await db.collection("listings").doc(purchaseData.listingId).update({
              status: "pending"
            });
          }

          // Create notifications
          await db.collection("notifications").add({
            uid: purchaseData?.sellerId,
            title: "New Sale!",
            message: `You have a new sale for ${purchaseData?.price} USD. Please deliver the account.`,
            type: "sale",
            link: `/dashboard?tab=sales`,
            read: false,
            createdAt: FieldValue.serverTimestamp()
          });

          return res.json({ status: "Pending Delivery" });
        }
        
        res.json({ status: purchaseData?.status || "awaiting_payment" });
      } catch (error: any) {
        console.error("Error checking payment status:", error.message);
        res.status(500).json({ error: "Failed to check status" });
      }
    });

    // Ziina Webhook
    app.post("/api/webhooks/ziina", async (req, res) => {
      const event = req.body;
      console.log("Received Ziina webhook event:", event.type);

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const purchaseId = paymentIntent.metadata?.purchaseId;
        const isTopUp = paymentIntent.metadata?.isTopUp === "true";
        const userId = paymentIntent.metadata?.userId;

        if (isTopUp && userId) {
          try {
            console.log(`Processing wallet top-up for user ${userId}...`);
            const amount = paymentIntent.amount / 100; // Convert cents to USD
            
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
              balance: FieldValue.increment(amount)
            });

            // Create notification for user
            await db.collection("notifications").add({
              uid: userId,
              title: "Wallet Topped Up!",
              message: `Successfully added $${amount.toFixed(2)} to your wallet.`,
              type: "system",
              link: `/dashboard?tab=wallet`,
              read: false,
              createdAt: FieldValue.serverTimestamp()
            });

            console.log(`User ${userId} balance incremented by ${amount}.`);
          } catch (error) {
            console.error("Error processing wallet top-up webhook:", error);
            return res.status(500).send("Webhook processing failed");
          }
        } else if (purchaseId) {
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
      console.log("Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized.");
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
