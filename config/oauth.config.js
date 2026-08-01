/**
 * ─────────────────────────────────────────────
 *  DISCORD OAUTH2 CONFIGURATION — ReZenith
 *  Fill in after creating your Discord app at:
 *  https://discord.com/developers/applications
 * ─────────────────────────────────────────────
 */

const oauthConfig = {
  // Your Discord Application Client ID (public — safe to expose)
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',

  // Your Discord Application Client Secret (KEEP THIS PRIVATE)
  // Store as environment variable on Vercel, never hardcode here
  CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE',

  // The URL Discord redirects to after login
  // Local development: http://localhost:3000/api/auth/callback
  // Production:        https://rezenith.online/api/auth/callback
  // Add BOTH to your Discord app's Redirect URIs
  REDIRECT_URI: process.env.REDIRECT_URI || 'https://rezenith.online/api/auth/callback',

  // Discord OAuth2 scopes needed
  SCOPES: ['identify', 'guilds'].join('%20'),

  // Discord OAuth2 endpoint
  DISCORD_API: 'https://discord.com/api/v10',
};

module.exports = oauthConfig;
