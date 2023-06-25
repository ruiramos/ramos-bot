import { Bot, Context, session, SessionFlavor, webhookCallback } from 'grammy';
import { freeStorage } from '@grammyjs/storage-free';
import { DateTime } from 'luxon';
import express from 'express';

interface BirthdayData {
  name: string;
  date: string;
}

type BirthdayContext = Context & SessionFlavor<BirthdayData[]>;

// Create a bot using the Telegram token
const bot = new Bot<BirthdayContext>(process.env.TELEGRAM_TOKEN || '');

bot.use(
  session({
    initial: () => [],
    storage: freeStorage<BirthdayData[]>(bot.token),
  }),
);

// Handle the /yo command to greet the user
bot.command('list', (ctx) => {
  const birthdays = ctx.session;
  if (birthdays.length === 0) {
    return ctx.reply('No birthdays yet');
  } else {
    const birthdays = ctx.session.sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate === bDate ? 0 : aDate > bDate ? 1 : -1;
    });

    return ctx.reply(
      birthdays
        .map((record) => {
          const date = new Date(record.date);
          const age = DateTime.fromJSDate(date).diffNow('years').years * -1;

          return `<code>${date.toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })}</code> — ${record.name} (${Math.floor(age)})`;
        })
        .join('\n'),
      { parse_mode: 'HTML' },
    );
  }
});

bot.command('add', (ctx) => {
  const items = ctx.match;
  const [name, date] = items?.split(',') || [];

  if (!name || !date) {
    return ctx.reply('Please provide a name and a date like this: /add John, 2021-01-01');
  }

  const record = { name: name.trim(), date: date.trim() };

  ctx.session.push(record);
  return ctx.reply(`Added ${record.name} — ${record.date}`);
});

bot.command('remove', (ctx) => {
  const name = ctx.match;

  if (!name) {
    return ctx.reply('Please provide a name');
  }

  const index = ctx.session.findIndex((b) => b.name === name);

  if (index === -1) {
    return ctx.reply('No such birthday');
  }

  ctx.session.splice(index, 1);
  return ctx.reply(`Removed ${name}`);
});

const app = express();

// Use Webhooks for the production server
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});

// Start the server
if (process.env.NODE_ENV === 'production') {
  app.use(webhookCallback(bot, 'express'));
} else {
  // Use Long Polling for development
  bot.start();
}

app.post('/trigger', (req, res) => {
  bot.api.sendMessage(process.env.CHAT_ID as string, 'Hello world');
  res.json({ message: 'Triggered!' });
});
