/**
 * /api/auth/me
 * Returns the logged-in user + guild info from the session cookie.
 * Called by script.js on every page load to check auth state.
 */

const botConfig = require('../../config/bot.config');

module.exports = async (req, res) => {
  const cookie = req.headers.cookie || '';
  const match  = cookie.match(/rz_session=([^;]+)/);

  if (!match) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const session = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));

    // Optional: validate session age (7 days)
    const AGE_LIMIT = 1000 * 60 * 60 * 24 * 7;
    if (Date.now() - session.createdAt > AGE_LIMIT) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Find the managed guild from the user's guild list
    const managedGuild = (session.guilds || []).find(
      g => g.id === botConfig.GUILD_ID
    ) || null;

    return res.json({
      user: {
        id:            session.user.id,
        username:      session.user.username,
        discriminator: session.user.discriminator,
        avatar:        session.user.avatar,
        email:         session.user.email,
      },
      guild: managedGuild
        ? {
            id:          managedGuild.id,
            name:        managedGuild.name,
            icon:        managedGuild.icon,
            memberCount: null, // populated by /api/guild/info
            boostCount:  null,
            boostTier:   null,
          }
        : null,
    });

  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }
};
