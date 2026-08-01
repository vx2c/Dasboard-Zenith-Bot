/**
 * ─────────────────────────────────────────────
 *  SERVER CONFIGURATION — ReZenith
 * ─────────────────────────────────────────────
 */

const serverConfig = {
  // Your Discord Server (Guild) ID
  GUILD_ID: process.env.GUILD_ID || 'YOUR_GUILD_ID_HERE',

  // Role IDs — right-click a role in Discord → Copy ID
  ROLES: {
    ADMIN:     process.env.ROLE_ADMIN     || 'ADMIN_ROLE_ID',
    MODERATOR: process.env.ROLE_MODERATOR || 'MOD_ROLE_ID',
    SUPPORT:   process.env.ROLE_SUPPORT   || 'SUPPORT_ROLE_ID',
    MEMBER:    process.env.ROLE_MEMBER    || 'MEMBER_ROLE_ID',
    VERIFIED:  process.env.ROLE_VERIFIED  || 'VERIFIED_ROLE_ID',
  },

  // Channel IDs — right-click a channel → Copy ID
  CHANNELS: {
    LOGS:        process.env.CHANNEL_LOGS        || 'LOG_CHANNEL_ID',
    MOD_LOGS:    process.env.CHANNEL_MOD_LOGS    || 'MOD_LOG_CHANNEL_ID',
    WELCOME:     process.env.CHANNEL_WELCOME     || 'WELCOME_CHANNEL_ID',
    GOODBYE:     process.env.CHANNEL_GOODBYE     || 'GOODBYE_CHANNEL_ID',
    GENERAL:     process.env.CHANNEL_GENERAL     || 'GENERAL_CHANNEL_ID',
    ANNOUNCEMENTS:process.env.CHANNEL_ANNOUNCEMENTS || 'ANNOUNCE_CHANNEL_ID',
  },

  // Bot prefix for text commands
  PREFIX: process.env.BOT_PREFIX || '!',
};

module.exports = serverConfig;
