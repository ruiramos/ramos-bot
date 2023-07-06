import express from "express";
import {
  Bot,
  CommandContext,
  Context,
  MiddlewareFn,
  webhookCallback,
} from "grammy";
import { ageLine, birthdayLine, nextBirthday } from "./interface";
import {
  addRecord,
  getRecords,
  getRecord,
  removeRecord,
  clearDB,
  getRecordByDate,
} from "./dynamodb";
import salutations from "./salutations";
import { sortAbsoluteDate, sortClosestDate } from "./utils";
import { DateTime } from "luxon";

type MyContext = Context & { chatId: number };
const bot = new Bot<MyContext>(process.env.TELEGRAM_TOKEN);

const withChatId: MiddlewareFn<MyContext> = async (ctx, next) => {
  let chatId;
  if (ctx.chat?.type === "group") {
    chatId = ctx.chat.id;
  } else {
    // on a private 1:1, need to supply chatId on the message
    chatId = parseInt(typeof ctx.match === "string" ? ctx.match : "");
    if (!ctx.match) {
      return ctx.reply(`Need a Chat ID on a private chat.`);
    }
    if (isNaN(chatId)) {
      return ctx.reply(`Invalid Chat ID provided, got '${ctx.match}'.`);
    }
  }

  ctx.chatId = chatId;

  await next();
};

bot.command(["aniversarios", "birthdays"], withChatId, async (ctx) => {
  const birthdays = (await getRecords(ctx.chatId)).sort(sortClosestDate);

  if (birthdays.length === 0) {
    return ctx.reply("No birthdays yet");
  } else {
    return ctx.reply(birthdays.map(birthdayLine).join("\n"), {
      parse_mode: "Markdown",
    });
  }
});

bot.command(["list", "idades"], withChatId, async (ctx) => {
  const birthdays = (await getRecords(ctx.chatId)).sort(sortAbsoluteDate);

  if (birthdays.length === 0) {
    return ctx.reply("No birthdays yet");
  } else {
    return ctx.reply(birthdays.map(ageLine).join("\n"), {
      parse_mode: "MarkdownV2",
    });
  }
});

bot.command(["proximo", "next"], withChatId, async (ctx) => {
  const birthdays = await getRecords(ctx.chatId);
  const next = birthdays.sort(sortClosestDate)[0];
  if (!next) {
    return ctx.reply("No birthdays yet");
  }
  const nextRecord = await getRecord(next);
  if (!nextRecord) {
    return ctx.reply("Error getting data");
  }
  return ctx.reply(nextBirthday(nextRecord), { parse_mode: "MarkdownV2" });
});

bot.command(["debug"], async (ctx) => {
  console.log(JSON.stringify(ctx, null, 2));
});

bot.on("message:new_chat_members:me", async (ctx) => {
  if ("title" in ctx.chat) {
    ctx.reply(`Howdy ${ctx.chat.title}! (id: ${ctx.chat.id})`);
  }
});

// commands for admin (ie local) use
if (process.env.NODE_ENV !== "production") {
  bot.command("add", (ctx) => {
    let [name, date, chatId] = ctx.match?.split(",").map((s) => s.trim()) || [];

    if (!chatId && ctx.chat.type === "group") chatId = String(ctx.chat.id);
    let intChatId = parseInt(chatId);

    if (!name || !date || !chatId) {
      if (ctx.chat.type === "group") {
        return ctx.reply(
          "Please provide a name, a date in this format: `/add John, 1999-11-25`",
          { parse_mode: "MarkdownV2" }
        );
      } else {
        return ctx.reply(
          "Please provide a name, a date and a chatId in this format: `/add John, 1999-11-25, -12345`",
          { parse_mode: "MarkdownV2" }
        );
      }
    }

    if (isNaN(intChatId)) {
      return ctx.reply(`Invalid Chat ID, got ${chatId}`, {
        parse_mode: "MarkdownV2",
      });
    }

    const adate = DateTime.fromISO(date);

    if (!adate.isValid) {
      return ctx.reply(
        "Couldn't parse date, please provide a date in this format: `/add John, 1999-11-25`",
        { parse_mode: "MarkdownV2" }
      );
    }

    addRecord({ name, date, chatId: parseInt(chatId) });
    return ctx.reply(`Added ${name} — ${date}`);
  });

  bot.command("remove", (ctx) => {
    let [name, date, chatId] = ctx.match?.split(",").map((s) => s.trim()) || [];

    if (!chatId && ctx.chat.type === "group") chatId = String(ctx.chat.id);
    let intChatId = parseInt(chatId);

    if (!name || !date || !chatId) {
      if (ctx.chat.type === "group") {
        return ctx.reply(
          "Please provide a name, a date in this format: `/remove John, 1999-11-25`",
          { parse_mode: "MarkdownV2" }
        );
      } else {
        return ctx.reply(
          "Please provide a name, a date and a chatId in this format: `/remove John, 1999-11-25, -12345`",
          { parse_mode: "MarkdownV2" }
        );
      }
    }

    if (isNaN(intChatId)) {
      return ctx.reply(`Invalid Chat ID, got ${chatId}`, {
        parse_mode: "MarkdownV2",
      });
    }

    removeRecord({ name, date, chatId: intChatId });
    return ctx.reply(`Removed ${name}`);
  });

  bot.command("clear", (ctx) => {
    clearDB();
    return ctx.reply(`Cleared the DB, oops`);
  });
}

// Commands to be used in the live version. The other commands above are for development only.
let commands = [
  {
    command: "aniversarios",
    description:
      "Mostra a lista completa de aniversários ordenados do mais próximo para o mais distante",
  },
  {
    command: "idades",
    description:
      "Mostra a lista completa de idades ordenadas por data de nascimento",
  },
  {
    command: "proximo",
    description: "Mostra o próximo aniversário",
  },
];

if (process.env.NODE_ENV !== "production") {
  commands = commands.concat([
    {
      command: "add",
      description: "[ADMIN] Adiciona novo aniversario",
    },
    {
      command: "remove",
      description: "[ADMIN] Remove um aniversario",
    },
    {
      command: "debug",
      description: "[ADMIN] Send debug message",
    },
  ]);
}
bot.api.setMyCommands(commands);

const app = express();

// Use Webhooks for the production server
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});

app.post("/trigger", async (req, res) => {
  // no chat to notify, returning
  if (!process.env.CHAT_ID) return;

  /* TODO
  const birthday = await getNext({ sort: "diff" });
  if (birthday.diff === 0) {
    const message = salutations[Math.floor(Math.random() * salutations.length)];
    console.log(message);
    const formattedMsg = message(birthday);

    bot.api.sendMessage(process.env.CHAT_ID as string, formattedMsg, {
      parse_mode: "Markdown",
    });
  }

  res.json({ birthday });
  */
});

app.get("/status", async (req, res) => {
  res.json({ status: "OK" });
});

// Start the server
if (process.env.NODE_ENV === "production") {
  console.log("Using Webhooks");
  app.use(webhookCallback(bot, "express"));
} else {
  // Use Long Polling for development
  bot.start();
}
