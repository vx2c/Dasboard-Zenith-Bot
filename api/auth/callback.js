/**
 * /api/auth/callback
 * Discord OAuth2 callback — exchanges code for token, stores minimal session cookie.
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

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[callback] Token exchange failed:', err);
      return res.redirect('/?error=token_failed');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch minimal user info
    const userRes = await fetch(`${oauth.DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return res.redirect('/?error=user_failed');
    }

    const user = await userRes.json();

    // 3. Store MINIMAL data in cookie (keep it well under 4KB)
    //    Do NOT store guilds array here — it can be 50KB+
    const sessionData = {
      userId:        user.id,
      username:      user.username,
      discriminator: user.discriminator || '0',
      avatar:        user.avatar || null,
      accessToken,
      createdAt:     Date.now(),
    };

    const sessionPayload = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // 4. Set HttpOnly cookie — 7-day expiry
    res.setHeader('Set-Cookie',
      `rz_session=${sessionPayload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    // 5. Redirect to dashboard
    res.redirect('/#/');

  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    res.redirect('/?error=server_error');
  }
};
