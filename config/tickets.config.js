/**
 * ─────────────────────────────────────────────
 *  TICKETS CONFIGURATION — ReZenith
 * ─────────────────────────────────────────────
 */

const ticketsConfig = {
  // Channel where users click to open a ticket
  PANEL_CHANNEL: process.env.TICKET_PANEL_CHANNEL || 'PANEL_CHANNEL_ID',

  // Category where ticket channels are created
  TICKET_CATEGORY: process.env.TICKET_CATEGORY || 'TICKET_CATEGORY_ID',

  // Channel where transcripts are sent after closing
  TRANSCRIPT_CHANNEL: process.env.TICKET_TRANSCRIPT_CHANNEL || 'TRANSCRIPT_CHANNEL_ID',

  // Role that can see and manage all tickets
  STAFF_ROLE: process.env.TICKET_STAFF_ROLE || 'STAFF_ROLE_ID',

  // Ticket categories available in the panel
  CATEGORIES: [
    { id: 'support',      label: 'Support',       emoji: '🎧', description: 'General help & questions' },
    { id: 'report',       label: 'Report',        emoji: '🚨', description: 'Report a rule-breaker' },
    { id: 'application',  label: 'Application',   emoji: '📋', description: 'Apply for a staff position' },
    { id: 'partnership',  label: 'Partnership',   emoji: '🤝', description: 'Partnership requests' },
    { id: 'appeal',       label: 'Appeal',        emoji: '⚖️', description: 'Appeal a ban or punishment' },
  ],

  // Max open tickets per user
  MAX_PER_USER: 1,

  // Auto-close inactive tickets after N hours (0 = disabled)
  AUTO_CLOSE_HOURS: 48,
};

module.exports = ticketsConfig;
