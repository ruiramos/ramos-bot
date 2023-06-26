import express from 'express';
import { Bot, webhookCallback } from 'grammy';
import { ageLine, birthdayLine, getAge, nextBirthday } from './interface';
import {
  addRecord,
  createDatabase,
  getNext,
  getRecords,
  removeRecord,
  resetDatabase,
} from './database';
import salutations from './salutations';

const bot = new Bot(process.env.TELEGRAM_TOKEN || '');

bot.command(['aniversarios', 'birthdays'], async (ctx) => {
  const birthdays = await getRecords({ sort: 'abs(min(diff, 0)) ASC, diff' });

  if (birthdays.length === 0) {
    return ctx.reply('No birthdays yet');
  } else {
    return ctx.reply(birthdays.map(birthdayLine).join('\n'), { parse_mode: 'Markdown' });
  }
});

bot.command(['list', 'idades'], async (ctx) => {
  const birthdays = await getRecords({ sort: 'date' });

  if (birthdays.length === 0) {
    return ctx.reply('No birthdays yet');
  } else {
    return ctx.reply(birthdays.map(ageLine).join('\n'), { parse_mode: 'MarkdownV2' });
  }
});

bot.command(['proximo', 'next'], async (ctx) => {
  const birthday = await getNext({ sort: 'diff' });

  return ctx.reply(nextBirthday(birthday), { parse_mode: 'MarkdownV2' });
});

bot.command('reset', (ctx) => {
  if (process.env.NODE_ENV === 'production') {
    return ctx.reply('Sorry, this command is not available in production');
  }

  resetDatabase();
  return ctx.reply('Database reset');
});

bot.command('add', (ctx) => {
  if (process.env.NODE_ENV === 'production') {
    return ctx.reply('Sorry, this command is not available in production');
  }

  const items = ctx.match;
  const [name, date] = items?.split(',') || [];

  if (!name || !date) {
    return ctx.reply('Please provide a name and a date like this: /add John, 2021-01-01');
  }

  addRecord({ name, date });
  return ctx.reply(`Added ${name} — ${date}`);
});

bot.command('remove', (ctx) => {
  if (process.env.NODE_ENV === 'production') {
    return ctx.reply('Sorry, this command is not available in production');
  }

  const name = ctx.match;

  if (!name) {
    return ctx.reply('Please provide a name');
  }

  removeRecord({ name });
  return ctx.reply(`Removed ${name}`);
});

createDatabase();

const app = express();

// Use Webhooks for the production server
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});

app.post('/trigger', async (req, res) => {
  const birthday = await getNext({ sort: 'diff' });
  if (birthday.diff === 0) {
    const message = salutations[Math.floor(Math.random() * salutations.length)];
    console.log(message);
    const formattedMsg = message(birthday);

    bot.api.sendMessage(process.env.CHAT_ID as string, formattedMsg, {
      parse_mode: 'Markdown',
    });
  }

  res.json({ birthday });
});

app.get('/status', async (req, res) => {
  const birthdays = await getRecords({});

  res.json({ status: 'OK', birthdays });
});

// Start the server
if (process.env.NODE_ENV === 'production') {
  console.log('Using Webhooks');
  app.use(webhookCallback(bot, 'express'));
} else {
  // Use Long Polling for development
  bot.start();
}
