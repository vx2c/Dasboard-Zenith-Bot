/**
 * /api/auth/me
 * Returns the logged-in user + guild info.
 * Reads the minimal session cookie and fetches guild data live from Discord.
 */

const botConfig = require('../../config/bot.config');

const DISCORD_API = 'https://discord.com/api/v10';

module.exports = async (req, res) => {
  const cookie = req.headers.cookie || '';
  const match  = cookie.match(/rz_session=([^;]+)/);

  if (!match) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let session;
  try {
    session = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  } catch {
    return res.status(401).json({ error: 'Invalid session format' });
  }

  // Validate session age (7 days)
  const AGE_LIMIT = 1000 * 60 * 60 * 24 * 7;
  if (!session.createdAt || Date.now() - session.createdAt > AGE_LIMIT) {
    return res.status(401).json({ error: 'Session expired' });
  }

  // Required fields check
  if (!session.userId || !session.accessToken) {
    return res.status(401).json({ error: 'Incomplete session' });
  }

  // Fetch user's guilds from Discord to verify server membership
  let managedGuild = null;
  try {
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (guildsRes.ok) {
      const guilds = await guildsRes.json();
      const found  = guilds.find(g => g.id === botConfig.GUILD_ID);

      if (found) {
        managedGuild = {
          id:   found.id,
          name: found.name,
          icon: found.icon,
        };
      }
    }
  } catch (err) {
    // Guild fetch failed — still allow login, guild will be null
    console.error('[me] Guild fetch error:', err.message);
  }

  return res.json({
    user: {
      id:            session.userId,
      username:      session.username,
      discriminator: session.discriminator,
      avatar:        session.avatar,
    },
    guild: managedGuild,
  });
};
