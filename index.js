const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const config = require("./config");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan this QR code with WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━╮
┃    👑 RDX MD BOT     ┃
┃                      ┃
┃    ✅ Connected       ┃
┃    ⚡ Version: ${config.VERSION}    ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`);
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("🔄 Connection closed. Reconnecting...");
        startBot();
      } else {
        console.log("❌ WhatsApp logged out.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message) return;
    if (msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    if (!text.startsWith(config.PREFIX)) return;

    const args = text
      .slice(config.PREFIX.length)
      .trim()
      .split(/\s+/);

    const command = (args.shift() || "").toLowerCase();

    // MENU
    if (command === "menu") {
      await sock.sendMessage(jid, {
        text: `
╭━━〔𓆩 👑 RDX MD BOT 𓆪〕━━┈⊷
┃
┃ 🤖 Bot: ${config.BOT_NAME}
┃ 👑 Owner: ${config.OWNER_NAME}
┃ ⚡ Version: ${config.VERSION}
┃ 🌐 Mode: ${config.MODE}
┃ 🔰 Prefix: ${config.PREFIX}
┃
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
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷

> Powered by 👑 ${config.OWNER_NAME}
`
      });
    }

    // ALL MENU
    else if (command === "allmenu") {
      await sock.sendMessage(jid, {
        text: `
╭━━〔 👑 RDX MD ALL MENU 〕━━┈⊷
┃
┃ .menu
┃ .ping
┃ .owner
┃ .runtime
┃ .joke
┃ .quote
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }

    // PING
    else if (command === "ping") {
      await sock.sendMessage(jid, {
        text: "🏓 Pong!\n\n✅ RDX MD BOT is working!"
      });
    }

    // OWNER
    else if (command === "owner") {
      await sock.sendMessage(jid, {
        text: `👑 Owner: ${config.OWNER_NAME}`
      });
    }

    // RUNTIME
    else if (command === "runtime") {
      const seconds = Math.floor(process.uptime());

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      await sock.sendMessage(jid, {
        text:
          `⏱️ RDX MD BOT Runtime\n\n` +
          `${hours}h ${minutes}m ${secs}s`
      });
    }

    // JOKE
    else if (command === "joke") {
      await sock.sendMessage(jid, {
        text:
          "😂 Programmer: Bug fix kar diya.\n" +
          "Bug: Main phir aaunga! 🤣"
      });
    }

    // QUOTE
    else if (command === "quote") {
      await sock.sendMessage(jid, {
        text:
          "🔥 Stay focused.\n" +
          "💯 Keep learning.\n" +
          "🚀 Keep building."
      });
    }

    // OWNER MENU
    else if (command === "ownermenu") {
      await sock.sendMessage(jid, {
        text: `
╭━━〔 👑 OWNER MENU 〕━━┈⊷
┃
┃ .owner
┃ .runtime
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }

    // GROUP MENU
    else if (command === "groupmenu") {
      await sock.sendMessage(jid, {
        text: `
╭━━〔 👥 GROUP MENU 〕━━┈⊷
┃
┃ 🚧 Features coming soon...
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷
`
      });
    }

    // DOWNLOAD MENU
    else if (command === "downloadmenu") {
      await sock.sendMessage(jid, {
        text:
          "📥 DOWNLOAD MENU\n\n🚧 Download features will be added later."
      });
    }

    // FUN MENU
    else if (command === "funmenu") {
      await sock.sendMessage(jid, {
        text:
          "🎮 FUN MENU\n\n.joke\n.quote"
      });
    }

    // STICKER MENU
    else if (command === "stickermenu") {
      await sock.sendMessage(jid, {
        text:
          "🎨 STICKER MENU\n\n🚧 Sticker system will be added later."
      });
    }

    // UTILITY MENU
    else if (command === "utilitymenu") {
      await sock.sendMessage(jid, {
        text:
          "🛠️ UTILITY MENU\n\n.ping\n.runtime"
      });
    }

    // AI MENU
    else if (command === "aimenu") {
      await sock.sendMessage(jid, {
        text:
          "🤖 AI MENU\n\n.ai <your question>\n\nAI API baad mein connect karenge."
      });
    }

    // UNKNOWN COMMAND
    else {
      await sock.sendMessage(jid, {
        text:
          `❌ Unknown command: ${command}\n\n` +
          `Type ${config.PREFIX}menu`
      });
    }
  });
}

console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━╮
┃    👑 RDX MD BOT     ┃
┃    Starting...       ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`);

startBot().catch((error) => {
  console.error("❌ Bot Error:", error);
});
