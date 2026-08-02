/**
 * /api/guild/info
 * Returns real guild data from Discord API using the bot token.
 */

const botConfig = require('../../config/bot.config');

const DISCORD_API = 'https://discord.com/api/v10';

module.exports = async (req, res) => {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const GUILD_ID  = botConfig.GUILD_ID;

  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' || !GUILD_ID || GUILD_ID === 'YOUR_GUILD_ID_HERE') {
    return res.json({
      connected: false,
      error: 'DISCORD_BOT_TOKEN or GUILD_ID not configured in environment variables.',
    });
  }

  try {
    const [guildRes, previewRes] = await Promise.all([
      fetch(`${DISCORD_API}/guilds/${GUILD_ID}?with_counts=true`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }),
      fetch(`${DISCORD_API}/guilds/${GUILD_ID}/preview`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }),
    ]);

    if (!guildRes.ok) {
      const err = await guildRes.text();
      console.error('[guild/info] Discord API error:', err);
      return res.status(guildRes.status).json({ connected: false, error: `Discord API: ${guildRes.status}` });
    }

    const guild = await guildRes.json();

    return res.json({
      connected:   true,
      id:          guild.id,
      name:        guild.name,
      icon:        guild.icon,
      banner:      guild.banner,
      description: guild.description,
      memberCount: guild.approximate_member_count  || guild.member_count || 0,
      onlineCount: guild.approximate_presence_count || 0,
      boostCount:  guild.premium_subscription_count || 0,
      boostTier:   guild.premium_tier               || 0,
      features:    guild.features                   || [],
      channels:    guild.channels?.length           || 0,
    });

  } catch (err) {
    console.error('[guild/info] Error:', err.message);
    return res.status(500).json({ connected: false, error: 'Server error' });
  }
};
