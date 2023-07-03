import express from 'express';
import { Bot, webhookCallback } from 'grammy';
import { ageLine, birthdayLine, nextBirthday } from './interface';
import { addRecord, createDatabase, getNext, getRecords, removeRecord, clearDB } from './database';
import salutations from './salutations';

const bot = new Bot(process.env.TELEGRAM_TOKEN);

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

bot.command(['debug'], async (ctx) => {
  console.log(JSON.stringify(ctx, null, 2));
});

// commands for admin (ie local) use
if (process.env.NODE_ENV !== 'production') {
  bot.command('add', (ctx) => {
    const items = ctx.match;
    const [name, date] = items?.split(',').map(s => s.trim()) || [];

    if (!name || !date) {
      return ctx.reply('Please provide a name and a date in this format: `/add John, 1999-11-25`', { parse_mode: 'MarkdownV2' });
    }

    addRecord({ name, date });
    return ctx.reply(`Added ${name} — ${date}`);
  });

  bot.command('remove', (ctx) => {
    const name = ctx.match;

    if (!name) {
      return ctx.reply('Please provide a name');
    }

    removeRecord({ name });
    return ctx.reply(`Removed ${name}`);
  });

  bot.command('clear', (ctx) => {
    clearDB();
    return ctx.reply(`Cleared the DB, oops`);
  });
}

// Creates the database if it doesn't exist.
createDatabase();

// Commands to be used in the live version. The other commands above are for development only.
bot.api.setMyCommands([
  {
    command: 'aniversarios',
    description:
      'Mostra a lista completa de aniversários ordenados do mais próximo para o mais distante',
  },
  {
    command: 'idades',
    description: 'Mostra a lista completa de idades ordenadas por data de nascimento',
  },
  {
    command: 'proximo',
    description: 'Mostra o próximo aniversário',
  },
]);

const app = express();

// Use Webhooks for the production server
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});

app.post('/trigger', async (req, res) => {
  // no chat to notify, returning
  if(!process.env.CHAT_ID) return;

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
