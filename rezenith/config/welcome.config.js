/**
 * ─────────────────────────────────────────────
 *  WELCOME / GOODBYE CONFIGURATION — ReZenith
 * ─────────────────────────────────────────────
 */

const welcomeConfig = {
  // ── Welcome ──────────────────────────────────
  WELCOME: {
    ENABLED: true,

    // Channel where welcome messages are sent
    CHANNEL: process.env.WELCOME_CHANNEL || 'WELCOME_CHANNEL_ID',

    // Message text. Variables: {user} {server} {memberCount}
    MESSAGE: 'Welcome {user} to **{server}**! You are member **#{memberCount}**. Please read the rules and enjoy your stay! 🎉',

    // DM sent to new member (leave empty to disable)
    DM_MESSAGE: 'Hey {user}! Welcome to **{server}**. Check out #rules to get started!',

    // URL of the background image for the welcome card
    CARD_BACKGROUND: '',

    // Font for the welcome card
    CARD_FONT: 'Inter',
  },

  // ── Goodbye ───────────────────────────────────
  GOODBYE: {
    ENABLED: true,

    // Channel where goodbye messages are sent
    CHANNEL: process.env.GOODBYE_CHANNEL || 'GOODBYE_CHANNEL_ID',

    // Message text. Variables: {user} {server} {memberCount}
    MESSAGE: 'Goodbye **{user}**! We now have **{memberCount}** members. Hope to see you again!',
  },
};

module.exports = welcomeConfig;
