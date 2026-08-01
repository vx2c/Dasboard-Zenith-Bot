/**
 * /api/auth/discord
 * Redirects the user to Discord's OAuth2 login page.
 * Vercel Serverless Function (Node.js)
 */

const oauth = require('../../config/oauth.config');

module.exports = (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${oauth.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(oauth.REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${oauth.SCOPES}`;

  res.redirect(url);
};
