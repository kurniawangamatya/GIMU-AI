import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import midtransClient from "midtrans-client";

dotenv.config();

// Load firebase config manually
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

// Set environment variables for better project discovery
if (firebaseConfig.projectId) {
  process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
}
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
  process.env.FIRESTORE_DATABASE = firebaseConfig.firestoreDatabaseId;
}

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || ""
});

// Initialize Firebase Admin
let dbAdmin: admin.firestore.Firestore;

async function initFirebase() {
  try {
    // Clear any existing apps to prevent conflict during re-init
    if (admin.apps.length > 0) {
      for (const app of admin.apps) {
        if (app) await app.delete();
      }
    }

    // Try multiple initialization strategies
    console.log("Starting Firebase Admin initialization...");
    console.log("Config Project ID:", firebaseConfig.projectId);
    console.log("Config Database ID:", firebaseConfig.firestoreDatabaseId);

    try {
      // Strategy 1: Standard initialization (picks up environment credentials)
      admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log("Initialized with explicit projectId");
    } catch (err: any) {
      console.warn("Explicit projectId init failed, trying no-args init:", err.message);
      admin.initializeApp();
    }
    
    const app = admin.app();
    const targetDb = firebaseConfig.firestoreDatabaseId || "(default)";

    // Try to get Firestore with the target DB
    try {
      dbAdmin = getFirestore(app, targetDb);
      // Verify quickly
      await dbAdmin.collection("_health_check").limit(1).get();
      console.log(`Verified connection to Firestore DB: ${dbAdmin.databaseId}`);
    } catch (err: any) {
      console.error(`Failed to connect to targeted DB [${targetDb}]:`, err.message);
      if (targetDb !== "(default)") {
        console.warn("Trying fallback to (default) database...");
        dbAdmin = getFirestore(app);
        await dbAdmin.collection("_health_check").limit(1).get();
        console.log("Successfully connected to (default) database instead");
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin initialization error:", error.message);
    // Absolute fallback - last resort
    if (admin.apps.length === 0) admin.initializeApp();
    dbAdmin = getFirestore();
  }
}

await initFirebase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health/firestore", async (req, res) => {
    try {
      // 1. Attempt a minimal document read
      const snapshot = await dbAdmin.collection("_health_check").limit(1).get();
      
      // 2. Attempt a write to confirm permissions
      const healthRef = dbAdmin.collection("_health_check").doc("last_run");
      await healthRef.set({
        timestamp: FieldValue.serverTimestamp(),
        lastRunBy: "server",
        time: new Date().toISOString()
      });

      res.json({ 
        status: "ok", 
        adminReady: admin.apps.length > 0,
        appConfig: {
          projectId: admin.app().options.projectId || "ENV_DEFAULT",
          name: admin.app().name
        },
        databaseId: dbAdmin.databaseId,
        isDefaultDatabase: dbAdmin.databaseId === "(default)",
        connected: true,
        writeVerified: true,
        snapshotEmpty: snapshot.empty,
        configSource: {
          projectId: firebaseConfig.projectId,
          dbId: firebaseConfig.firestoreDatabaseId
         }
      });
    } catch (error: any) {
      console.error("Firestore Health check failed:", error.message);
      
      let suggestion = "Check IAM permissions.";
      if (error.message.includes("quota") || error.message.includes("rate limit") || error.message.includes("8 RESOURCE_EXHAUSTED")) {
        suggestion = "Firestore Quota Exceeded. Please wait for quota reset.";
      } else if (error.message.includes("not been used")) {
        suggestion = "Cloud Firestore API is disabled. Enable it in the project console.";
      } else if (error.message.includes("PERMISSION_DENIED")) {
        suggestion = `Permission Denied. Target: Project[${admin.app().options.projectId || "ENV_DEFAULT"}], DB[${dbAdmin.databaseId || "(default)"}]. Ensure the service account has 'Cloud Datastore User' role.`;
      }

      res.status(500).json({ 
        status: "error", 
        message: error.message,
        details: {
          code: error.code,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        },
        env: {
          projectId: admin.app().options.projectId,
          database: dbAdmin.databaseId
        },
        suggestion: suggestion
      });
    }
  });

  // Create Midtrans Transaction
  app.post("/api/payment/create", async (req, res) => {
    try {
      const { packageId, amount, customerDetails, tokens, userId } = req.body;

      if (!process.env.MIDTRANS_SERVER_KEY) {
        throw new Error("MIDTRANS_SERVER_KEY is missing. Please set it in Settings > Secrets.");
      }

      // 1. Create a pending payment record in Firestore
      const orderId = `GIMU-${Date.now()}-${userId.slice(0, 5)}`;
      console.log(`Attempting to create order record: ${orderId} in db: ${dbAdmin.databaseId}`);
      
      const paymentData = {
        userId,
        tokens,
        packageId,
        amount,
        status: "pending",
        createdAt: FieldValue.serverTimestamp()
      };

      try {
        await dbAdmin.collection("pending_payments").doc(orderId).set(paymentData);
      } catch (fsError: any) {
        console.error("Firestore Write Failed:", fsError.message);
        throw fsError;
      }

      // 2. Request Midtrans Transaction
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: customerDetails.name || "Customer",
          email: customerDetails.email,
          phone: customerDetails.phone || "08123456789",
        },
        item_details: [{
          id: packageId,
          price: amount,
          quantity: 1,
          name: `${tokens} GIMU Credits`,
        }],
        callbacks: {
          finish: `${req.headers.origin}/?status=success&orderId=${orderId}`
        }
      };

      const transaction = await snap.createTransaction(parameter);
      
      res.json({ 
        url: transaction.redirect_url,
        token: transaction.token,
        orderId: orderId
      });
    } catch (error: any) {
      console.error("Midtrans Create Error:", error.message);
      res.status(500).json({ 
        error: error.message 
      });
    }
  });

  // Midtrans Webhook for Fulfillment
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const notificationJson = req.body;
      console.log("Midtrans Webhook Received:", JSON.stringify(notificationJson, null, 2));

      const statusResponse = await snap.transaction.notification(notificationJson);
      
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      console.log(`Processing Fulfillment - Order: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'challenge') {
          // TODO: handle fraud challenge
          console.log("Fraud challenge detected");
        } else if (fraudStatus === 'accept') {
          await fulfillOrder(orderId, statusResponse);
        }
      } else if (transactionStatus === 'settlement') {
        await fulfillOrder(orderId, statusResponse);
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        // Handle failure
        await dbAdmin.collection("pending_payments").doc(orderId).update({
          status: "failed",
          updatedAt: FieldValue.serverTimestamp(),
          webhookPayload: statusResponse
        });
      } else if (transactionStatus === 'pending') {
        // Still pending
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Webhook Fulfillment Error:", error.message);
      res.status(200).send("Handled with error: " + error.message);
    }
  });

  async function fulfillOrder(orderId: string, payload: any) {
    const pendingRef = dbAdmin.collection("pending_payments").doc(orderId);
    const orderDoc = await pendingRef.get();

    if (orderDoc.exists) {
      const data = orderDoc.data()!;
      
      if (data.status === "pending") {
        const { userId, tokens } = data;
        const userRef = dbAdmin.collection("users").doc(userId);

        console.log(`Fulfilling ${tokens} tokens for User: ${userId}`);

        await dbAdmin.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          const currentCredits = userDoc.exists ? (userDoc.data()?.credits || 0) : 0;
          
          transaction.set(userRef, {
            credits: currentCredits + tokens,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });

          transaction.update(pendingRef, {
            status: "completed",
            completedAt: FieldValue.serverTimestamp(),
            webhookPayload: payload
          });
        });

        console.log(`Fulfillment Complete for Order: ${orderId}`);
      } else {
        console.log(`Order ${orderId} already in status: ${data.status}`);
      }
    } else {
      console.error(`Order record ${orderId} not found in Firestore pending_payments`);
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
