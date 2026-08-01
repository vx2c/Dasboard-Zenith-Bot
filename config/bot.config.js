/**
 * ─────────────────────────────────────────────
 *  BOT CONFIGURATION — ReZenith
 *  Fill in your Discord bot details here.
 *  NEVER commit the real values to GitHub.
 *  Use environment variables in production.
 * ─────────────────────────────────────────────
 */

const botConfig = {
  // Your Discord Application Client ID
  // Found at: https://discord.com/developers/applications → Your App → OAuth2
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',

  // Your Discord Server (Guild) ID
  // Right-click your server → Copy Server ID (enable Developer Mode in settings)
  GUILD_ID: process.env.GUILD_ID || 'YOUR_GUILD_ID_HERE',

  // The display name of your bot
  BOT_NAME: process.env.BOT_NAME || 'Zenith',

  // Bot version shown on the dashboard
  BOT_VERSION: 'v2.1.4',
};

module.exports = botConfig;
