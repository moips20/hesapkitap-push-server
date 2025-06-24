const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Admin SDK ile bağlantı
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(bodyParser.json());

// Cihaz token'ı alma (opsiyonel)
app.post("/register-token", (req, res) => {
  const { token } = req.body;
  console.log("Token kaydedildi:", token);
  res.sendStatus(200);
});

// Frontend her sabah saat 11:00'de bu endpoint'e istek atar
app.post("/send-reminders", async (req, res) => {
  const { token, records } = req.body;

  if (!token || !records || !Array.isArray(records)) {
    return res.status(400).send("Eksik parametre");
  }

  try {
    for (const record of records) {
      await admin.messaging().send({
        token,
        notification: {
          title: record.title || "Hatırlatma",
          body: record.body || "Bugün son ödeme günü"
        }
      });
    }
    console.log("📨 Bildirimler gönderildi.");
    res.sendStatus(200);
  } catch (err) {
    console.error("Bildirim gönderme hatası:", err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Push sunucu çalışıyor: http://localhost:${PORT}`);
});