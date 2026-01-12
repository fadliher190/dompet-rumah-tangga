const TelegramBot = require("node-telegram-bot-api");

const token = "8272501510:AAGiFS2CnrtivqVWUOFSflB7yaBQjEYdswk";
const bot = new TelegramBot(token, { polling: true });

const users = {};

// format rupiah
const rupiah = (angka) =>
  "Rp " + angka.toLocaleString("id-ID");

// fungsi broadcast
const broadcast = (message) => {
  Object.keys(users).forEach((chatId) => {
    bot.sendMessage(chatId, message);
  });
};

// START
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    users[chatId] = {
      saldo: 0,
      state: null,
    };
  }

  bot.sendMessage(
    chatId,
    `💰 *Dompet Digital*\nSaldo: ${rupiah(users[chatId].saldo)}`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➕ Pemasukan", callback_data: "PEMASUKAN" },
            { text: "➖ Pengeluaran", callback_data: "PENGELUARAN" },
          ],
        ],
      },
    }
  );
});

// BUTTON HANDLER
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  users[chatId].state = query.data;

  bot.sendMessage(
    chatId,
    `Masukkan nominal ${
      query.data === "PEMASUKAN" ? "pemasukan" : "pengeluaran"
    }:`
  );
});

// INPUT NOMINAL
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!users[chatId] || !users[chatId].state) return;

  const nominal = parseInt(text.replace(/\D/g, ""));
  if (isNaN(nominal) || nominal <= 0) {
    bot.sendMessage(chatId, "❌ Nominal tidak valid");
    return;
  }

  let tipe = users[chatId].state;

  if (tipe === "PEMASUKAN") {
    users[chatId].saldo += nominal;
  }

  if (tipe === "PENGELUARAN") {
    if (nominal > users[chatId].saldo) {
      bot.sendMessage(chatId, "❌ Saldo tidak cukup");
      return;
    }
    users[chatId].saldo -= nominal;
  }

  users[chatId].state = null;

  const info = `
📢 *Update Saldo*
👤 User: ${msg.from.first_name}
💸 ${tipe === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}: ${rupiah(nominal)}
💰 Saldo sekarang: ${rupiah(users[chatId].saldo)}
`;

  // broadcast ke semua user
  broadcast(info);

  // kirim ulang menu ke user
  bot.sendMessage(chatId, "Pilih transaksi:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➕ Pemasukan", callback_data: "PEMASUKAN" },
          { text: "➖ Pengeluaran", callback_data: "PENGELUARAN" },
        ],
      ],
    },
  });
});
