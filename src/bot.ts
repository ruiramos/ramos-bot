import { Bot, webhookCallback } from 'grammy';
import { DateTime } from 'luxon';
import express from 'express';
import { addRecord, createDatabase, getRecords, removeRecord } from './database';
import { formatDate, formatLine } from './interface';

const bot = new Bot(process.env.TELEGRAM_TOKEN || '');

bot.command('list', (ctx) => {
  getRecords().then((birthdays) => {
    if (birthdays.length === 0) {
      return ctx.reply('No birthdays yet');
    } else {
      return ctx.reply(birthdays.map(formatLine).join('\n'), { parse_mode: 'HTML' });
    }
  });
});

bot.command('add', (ctx) => {
  const items = ctx.match;
  const [name, date] = items?.split(',') || [];

  if (!name || !date) {
    return ctx.reply('Please provide a name and a date like this: /add John, 2021-01-01');
  }

  const record = addRecord({ name, date });
  return ctx.reply(`Added ${record.name} — ${record.date}`);
});

bot.command('remove', (ctx) => {
  const name = ctx.match;

  if (!name) {
    return ctx.reply('Please provide a name');
  }

  removeRecord({ name });

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
  console.log('Uing Webhooks');
  app.use(webhookCallback(bot, 'express'));
} else {
  // Use Long Polling for development
  bot.start();
}

createDatabase();

app.post('/trigger', (req, res) => {
  console.log('Reveived trigger request!');
  bot.api.sendMessage(process.env.CHAT_ID as string, 'Hello world');
  res.json({ message: 'Triggered!' });
});

app.get('/', (req, res) => {
  getRecords().then((birthdays) => {
    res.json({ status: 'OK', birthdays });
  });
});
