# ReZenith — Zenith Bot Dashboard

The official control panel for the Zenith Discord bot ecosystem.

---

## 🚀 Quick Setup (5 steps)

### 1. Clone / Upload to GitHub
Upload this entire folder as a new GitHub repository.

### 2. Create a Discord Application
1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Go to **OAuth2** → copy your **Client ID**
4. Click **Reset Secret** → copy your **Client Secret**
5. Add your Redirect URI: `https://rezenith.online/api/auth/callback`

### 3. Fill in Environment Variables on Vercel
In your Vercel project → Settings → Environment Variables, add:

| Variable               | Value                          |
|------------------------|--------------------------------|
| `DISCORD_CLIENT_ID`    | Your Discord App Client ID     |
| `DISCORD_CLIENT_SECRET`| Your Discord App Client Secret |
| `DISCORD_BOT_TOKEN`    | Your Discord Bot Token         |
| `GUILD_ID`             | Your Discord Server ID         |
| `REDIRECT_URI`         | `https://rezenith.online/api/auth/callback` |
| `SESSION_SECRET`       | A long random string           |
| `BOT_NAME`             | `Zenith` (or your bot's name)  |

### 4. Deploy on Vercel
1. Go to https://vercel.com → New Project
2. Import your GitHub repository
3. Vercel auto-detects the structure — no extra config needed
4. Click **Deploy**

### 5. Connect Custom Domain
1. In Vercel → Domains → Add `rezenith.online`
2. Update your DNS to point to Vercel

---

## 📁 Project Structure

```
index.html         ← Main dashboard (SPA entry point)
style.css          ← All styles (glassmorphism, dark theme)
script.js          ← All dashboard logic + routing
vercel.json        ← Vercel configuration
README.md          ← This file
package.json       ← Node.js package config

/config
  bot.config.js    ← Bot name, Client ID, Guild ID
  oauth.config.js  ← Discord OAuth2 credentials
  server.config.js ← Role & Channel IDs
  tickets.config.js← Ticket categories & settings
  welcome.config.js← Welcome/Goodbye messages

/api
  /auth
    discord.js     ← Starts Discord login flow
    callback.js    ← Handles OAuth2 callback
    me.js          ← Returns logged-in user info
  logout.js        ← Clears session
  /bot
    status.js      ← Bot health & metrics
  /guild
    info.js        ← Discord server info

/components        ← Custom JS/HTML components (add your own)
/assets            ← Images, icons, fonts
```

---

## 🔒 Security Notes

- **Never** hardcode tokens or secrets in any file
- All secrets go in `.env` (local) or Vercel Environment Variables (production)
- The `.gitignore` already excludes `.env`

---

## 🤖 Connecting Your Bot

To show live bot metrics (CPU, RAM, ping), your bot needs to expose an HTTP endpoint.

Set `BOT_API_URL` in your environment variables to your bot's URL, e.g.:
```
BOT_API_URL=https://your-bot-host.com
```

Without this, the dashboard shows placeholder values.

---

Built with ❤️ for the Zenith Platform.
