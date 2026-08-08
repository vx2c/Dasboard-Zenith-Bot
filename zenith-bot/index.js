const express = require('express');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_API_KEY = process.env.BOT_API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_API_KEY) {
  console.error('Missing BOT_API_KEY environment variable.');
  process.exit(1);
}

if (!DISCORD_BOT_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN environment variable.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`Discord client ready: ${client.user.tag} (${client.user.id})`);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

app.use(express.json());

function authenticateBotApi(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');

  if (!token || token !== BOT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

app.get('/status', authenticateBotApi, (req, res) => {
  const uptimeMs = client.uptime || 0;
  const status = {
    online: client.isReady(),
    botName: client.user?.username || null,
    botId: client.user?.id || null,
    guildCount: client.guilds.cache.size,
    uptime: uptimeMs,
    websocketPing: client.ws.ping || null,
  };

  if (!status.online) {
    return res.status(503).json({ error: 'Bot is not ready', details: status });
  }

  res.json(status);
});

async function start() {
  try {
    await client.login(DISCORD_BOT_TOKEN);
    console.log(`Discord client logged in as ${client.user.tag}`);
  } catch (error) {
    console.error('Failed to login Discord client:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Bot API listening on http://localhost:${PORT}`);
  });
}

start();
