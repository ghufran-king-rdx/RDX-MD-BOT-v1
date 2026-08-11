const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const TelegramBot = require("node-telegram-bot-api");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

const config = require("./config");

let whatsapp;

function getMenu() {
  return `
╭━━〔𓆩 ${config.BOT_NAME} 𓆪〕━━┈⊷
┃
┃ 🤖 Bot Name : ${config.BOT_NAME}
┃ 👑 Owner    : ${config.OWNER_NAME}
┃ ⚡ Version  : ${config.VERSION}
┃ 🌐 Mode     : ${config.MODE}
┃ 🔰 Prefix   : ${config.PREFIX}
┃
╰━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 MENU CATEGORIES 〕━━┈⊷
┃
┃ ✮ .allmenu
┃ ✮ .ownermenu
┃ ✮ .groupmenu
┃ ✮ .downloadmenu
┃ ✮ .funmenu
┃ ✮ .gamemenu
┃ ✮ .stickermenu
┃ ✮ .utilitymenu
┃ ✮ .aimenu
┃ ✮ .imagemenu
┃
╰━━━━━━━━━━━━━━━━━━┈⊷

> Powered by ${config.OWNER_NAME} 👑
`;
}

function getAllMenu() {
  return `
╭━━〔 RDX MD ALL MENU 〕━━┈⊷

┃ .menu
┃ .ping
┃ .owner
┃ .runtime
┃
┃ .joke
┃ .quote
┃
┃ .ai <text>
┃
┃ .sticker
┃
╰━━━━━━━━━━━━━━━━━━┈⊷
`;
}

async function startWhatsApp() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  whatsapp = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  whatsapp.ev.on("creds.update", saveCreds);

  whatsapp.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 WhatsApp QR Code:\n");
      qrcode.generate(qr, { small: true });
      console.log("\nWhatsApp → Linked Devices → Link a Device");
    }

    if (connection === "open") {
      console.log("✅ RDX MD BOT connected to WhatsApp!");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("🔄 WhatsApp disconnected. Reconnecting...");
        startWhatsApp();
      } else {
        console.log("❌ WhatsApp logged out.");
      }
    }
  });

  whatsapp.ev.on("messages.upsert", async ({ messages }) => {
    const message = messages[0];

    if (!message?.message) return;
    if (message.key.fromMe) return;

    const jid = message.key.remoteJid;

    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(config.PREFIX)) return;

    const args = text.slice(config.PREFIX.length).trim().split(/\s+/);
    const command = (args.shift() || "").toLowerCase();

    if (command === "menu") {
      await whatsapp.sendMessage(jid, {
        text: getMenu()
      });
    }

    else if (command === "allmenu") {
      await whatsapp.sendMessage(jid, {
        text: getAllMenu()
      });
    }

    else if (command === "ping") {
      await whatsapp.sendMessage(jid, {
        text: "🏓 Pong!\n\n✅ RDX MD BOT is alive."
      });
    }

    else if (command === "owner") {
      await whatsapp.sendMessage(jid, {
        text: `👑 Owner: ${config.OWNER_NAME}`
      });
    }

    else if (command === "runtime") {
      const seconds = Math.floor(process.uptime());

      await whatsapp.sendMessage(jid, {
        text: `⏱️ Bot Runtime: ${seconds} seconds`
      });
    }

    else if (command === "joke") {
      const jokes = [
        "😂 Programmer ne bug ko fix kiya, bug ne kaha: main wapas aaunga!",
        "🤣 WiFi slow ho to sabse pehle router ko blame kiya jata hai."
      ];

      const joke =
        jokes[Math.floor(Math.random() * jokes.length)];

      await whatsapp.sendMessage(jid, {
        text: joke
      });
    }

    else if (command === "quote") {
      await whatsapp.sendMessage(jid, {
        text: "🔥 Stay focused. Keep learning. Keep building."
      });
    }

    else if (command === "ai") {
      const question = args.join(" ");

      if (!question) {
        return whatsapp.sendMessage(jid, {
          text: "🤖 Example:\n.ai hello"
        });
      }

      await whatsapp.sendMessage(jid, {
        text:
          `🤖 AI Demo\n\n` +
          `You said: ${question}\n\n` +
          `⚙️ Real AI API baad mein connect karenge.`
      });
    }

    else if (command === "ownermenu") {
      await whatsapp.sendMessage(jid, {
        text: `
╭━━〔 OWNER MENU 〕━━┈⊷
┃ .owner
┃ .runtime
╰━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }

    else if (command === "groupmenu") {
      await whatsapp.sendMessage(jid, {
        text: `
╭━━〔 GROUP MENU 〕━━┈⊷
┃ 🚧 Coming Soon
╰━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }

    else if (command === "downloadmenu") {
      await whatsapp.sendMessage(jid, {
        text: `
╭━━〔 DOWNLOAD MENU 〕━━┈⊷
┃ 🚧 Download system
┃ will be added later.
╰━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }

    else if (command === "aimenu") {
      await whatsapp.sendMessage(jid, {
        text: `
╭━━〔 AI MENU 〕━━┈⊷
┃ .ai <text>
╰━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }
  });
}

async function startTelegram() {
  if (!config.TELEGRAM_TOKEN) {
    console.log("ℹ️ Telegram token not added yet.");
    return;
  }

  const bot = new TelegramBot(
    config.TELEGRAM_TOKEN,
    { polling: true }
  );

  console.log("✅ Telegram Bot started!");

  bot.onText(/^\/start$/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `👑 Welcome to ${config.BOT_NAME}!\n\nUse /menu`
    );
  });

  bot.onText(/^\/menu$/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      getMenu()
    );
  });

  bot.onText(/^\/ping$/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "🏓 Pong! Telegram Bot is alive."
    );
  });
}

async function main() {
  console.log(`
╭━━━━━━━━━━━━━━━━━━━━╮
┃   👑 RDX MD BOT    ┃
┃   Version 1.0.0    ┃
╰━━━━━━━━━━━━━━━━━━━━╯
`);

  await startWhatsApp();
  await startTelegram();
}

main().catch(console.error);
