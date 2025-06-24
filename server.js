const express = require("express");
const cron = require("node-cron");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Burada client'tan gelen tokenları bellekte tutacağız (örnek amaçlı, kalıcı değil)
let deviceTokens = [];

// Client token'ı POST ile kaydeder
app.post("/register-token", (req, res) => {
  const { token } = req.body;
  if (token && !deviceTokens.includes(token)) {
    deviceTokens.push(token);
  }
  res.sendStatus(200);
});

// Bildirim mesajı gönderme fonksiyonu
function sendDueDateNotification(token, message) {
  const payload = {
    notification: {
      title: "Ödeme Hatırlatması",
      body: message,
    },
  };
  return admin.messaging().sendToDevice(token, payload);
}

// Her gün Türkiye saatiyle 11:00'de bildirimleri tetikler
cron.schedule("0 8 * * *", async () => {
  console.log("Saat 11:00 oldu, bildirim gönderiliyor...");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Örnek kayıt (gerçekte client'tan alınacak)
  const exampleRecords = [
    { title: "X Bankası", dueDate: today },
    { title: "Elektrik Faturası", dueDate: "2099-12-31" },
  ];

  const dueRecords = exampleRecords.filter(rec => rec.dueDate === today);

  for (const token of deviceTokens) {
    for (const rec of dueRecords) {
      await sendDueDateNotification(token, `${rec.title} için son ödeme günü! Lütfen ödemeyi unutmayın.`);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Push sunucu ${PORT} portunda çalışıyor.`);
});