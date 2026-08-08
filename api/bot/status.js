/**
 * /api/bot/status
 * Returns live bot stats. Requires your bot to expose a local HTTP endpoint,
 * OR you can hardcode placeholder values until your bot is connected.
 *
 * To connect your real bot:
 *   Set BOT_API_URL in your .env to your bot's internal metrics URL.
 *   Example: BOT_API_URL=http://localhost:4000/metrics
 */

module.exports = async (req, res) => {
  const BOT_API_URL = process.env.BOT_API_URL;

  // If a real bot API URL is configured, proxy the request
  if (BOT_API_URL) {
    try {
      const r = await fetch(`${BOT_API_URL}/status`);
      if (!r.ok) throw new Error('Bot unreachable');
      const data = await r.json();
      return res.json(data);
    } catch {
      return res.status(503).json({ error: 'Bot is offline or unreachable' });
    }
  }

  // No live bot connection configured.
  return res.status(503).json({ error: 'BOT_API_URL not configured. Please set this environment variable to your bot status endpoint.' });
};
