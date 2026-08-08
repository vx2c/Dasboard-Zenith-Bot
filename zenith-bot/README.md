# Zenith Bot Service

Minimal Discord bot service for the ReZenith dashboard.

## Setup

1. Copy `.env.example` to `.env`.
2. Set:
   - `DISCORD_BOT_TOKEN`
   - `BOT_API_KEY`
   - Optional: `PORT`
3. Install dependencies:
   ```bash
   cd zenith-bot
   npm install
   ```
4. Start the service:
   ```bash
   npm start
   ```

## API

- `GET /status`
  - Requires `Authorization: Bearer <BOT_API_KEY>` header.
  - Returns bot readiness, guild count, uptime, and ping.
