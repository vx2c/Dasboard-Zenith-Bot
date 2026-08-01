/**
 * /api/auth/callback
 * Discord OAuth2 callback — exchanges code for token, stores session cookie.
 * Vercel Serverless Function (Node.js)
 */

const oauth = require('../../config/oauth.config');

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing OAuth code.');
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch(`${oauth.DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     oauth.CLIENT_ID,
        client_secret: oauth.CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  oauth.REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user info
    const userRes = await fetch(`${oauth.DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) throw new Error('Failed to fetch user');
    const user = await userRes.json();

    // 3. Fetch user's guilds
    const guildsRes = await fetch(`${oauth.DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const guilds = guildsRes.ok ? await guildsRes.json() : [];

    // 4. Store in a signed session cookie (base64 encoded payload)
    //    For production, replace with JWT signed with SESSION_SECRET
    const sessionPayload = Buffer.from(
      JSON.stringify({ user, guilds, accessToken, createdAt: Date.now() })
    ).toString('base64');

    // Set HttpOnly cookie (7-day expiry)
    res.setHeader('Set-Cookie',
      `rz_session=${sessionPayload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    // 5. Redirect to dashboard
    res.redirect('/#/');

  } catch (err) {
    console.error('[auth/callback]', err);
    res.status(500).send('Authentication failed. Please try again.');
  }
};
