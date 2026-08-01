/**
 * /api/guild/info
 * Returns guild information from the Discord API using the bot token.
 * Requires DISCORD_BOT_TOKEN in your environment variables.
 */

const botConfig = require('../../config/bot.config');

module.exports = async (req, res) => {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    // Return placeholder until token is configured
    return res.json({
      id:          botConfig.GUILD_ID,
      name:        'Zenith Server',
      icon:        null,
      memberCount: 0,
      onlineCount: 0,
      boostCount:  0,
      boostTier:   0,
    });
  }

  try {
    const r = await fetch(
      `https://discord.com/api/v10/guilds/${botConfig.GUILD_ID}?with_counts=true`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (!r.ok) throw new Error(`Discord API ${r.status}`);
    const guild = await r.json();

    res.json({
      id:               guild.id,
      name:             guild.name,
      icon:             guild.icon,
      memberCount:      guild.approximate_member_count  || 0,
      onlineCount:      guild.approximate_presence_count || 0,
      boostCount:       guild.premium_subscription_count || 0,
      boostTier:        guild.premium_tier               || 0,
    });

  } catch (err) {
    console.error('[guild/info]', err);
    res.status(500).json({ error: 'Could not fetch guild info' });
  }
};
