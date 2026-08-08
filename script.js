/* =============================================
   REZENITH — MAIN APPLICATION SCRIPT
   SPA Router · Discord Dashboard · Vanilla JS
   ============================================= */

'use strict';

// ─── Particles Canvas ──────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 120 }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,92,246,${p.alpha})`;
      ctx.fill();
    });

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ─── Auth State ────────────────────────────────────────────────────────────
const Auth = {
  user:      null,
  guild:     null,
  guildInfo: null,   // full real data from /api/guild/info

  async load() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Unauthenticated');
      const data = await res.json();
      this.user  = data.user;
      this.guild = data.guild;
      return true;
    } catch {
      return false;
    }
  },

  async loadGuildInfo() {
    try {
      const res = await fetch('/api/guild/info');
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) this.guildInfo = data;
    } catch { /* silent */ }
  },

  logout() {
    window.location.href = '/api/logout';
  }
};

const AppState = {
  botStatus: null,
};

async function loadBotStatus() {
  try {
    const res = await fetch('/api/bot/status');
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      AppState.botStatus = { online: false, error: data?.error || 'Bot status unavailable' };
      return;
    }

    const data = await res.json();
    AppState.botStatus = {
      online:     data.online ?? true,
      version:    data.version || 'Unknown',
      uptime:     data.uptime ?? 0,
      ping:       data.ping ?? data.apiLatency ?? 0,
      cpuUsage:   data.cpuUsage ?? 0,
      ramUsageMB: data.ramUsageMB ?? data.ramUsage ?? 0,
      ramTotalMB: data.ramTotalMB ?? data.ramTotal ?? 0,
      shards:     data.shards || { current: 0, total: 1 },
      apiLatency: data.apiLatency ?? 0,
    };
  } catch (err) {
    AppState.botStatus = { online: false, error: err.message || 'Fetch failed' };
  }
}

// ─── Toast Notifications ───────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(24px)'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── Modal ─────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ─── Sidebar ───────────────────────────────────────────────────────────────
let sidebarCollapsed = false;

function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const main      = document.getElementById('main-content');
  const toggleBtn = document.getElementById('sidebar-toggle');

  toggleBtn.addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    main.classList.toggle('expanded',    sidebarCollapsed);
  });

  // Highlight active nav item on route change
  window.addEventListener('hashchange', updateActiveNav);
  updateActiveNav();
}

function updateActiveNav() {
  const route = getRoute();
  document.querySelectorAll('.nav-item[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

function getRoute() {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

// ─── Router ────────────────────────────────────────────────────────────────
const routes = {
  '/':              renderHome,
  '/analytics':     renderAnalytics,
  '/bot-status':    renderBotStatus,
  '/messages':      renderMessages,
  '/welcome':       renderWelcome,
  '/goodbye':       renderGoodbye,
  '/autoroles':     renderAutoRoles,
  '/reaction-roles':renderReactionRoles,
  '/tickets':       renderTickets,
  '/staff':         renderStaff,
  '/moderation':    renderModeration,
  '/levels':        renderLevels,
  '/settings':      renderSettings,
};

function navigate() {
  const route = getRoute();
  const render = routes[route] || render404;
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="mobile-topbar">
    <button class="mobile-menu-btn" onclick="toggleMobileSidebar()"><i class="fa-solid fa-bars"></i></button>
    <div class="logo-text" style="font-size:16px;">ReZenith</div>
  </div>`;
  render(main);
  updateActiveNav();
  window.scrollTo(0, 0);
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

// ─── Page: Home ────────────────────────────────────────────────────────────
function renderHome(container) {
  const g = Auth.guildInfo || {};
  const botStatus = AppState.botStatus || {};
  const botConnected = botStatus.online === true;

  // Real numbers from Discord API (only available if bot token is set)
  const memberCount = g.memberCount ? g.memberCount.toLocaleString() : '—';
  const onlineCount = g.onlineCount ? g.onlineCount.toLocaleString() : '—';
  const boostCount  = g.boostCount  != null ? g.boostCount  : '—';
  const boostTier   = g.boostTier   != null ? g.boostTier   : '0';
  const dataSource  = g.connected
    ? '<span class="badge badge-green" style="font-size:11px;"><i class="fa-solid fa-circle" style="font-size:7px;"></i> Live from Discord</span>'
    : '<span class="badge badge-yellow" style="font-size:11px;"><i class="fa-solid fa-triangle-exclamation" style="font-size:10px;"></i> Set DISCORD_BOT_TOKEN in Vercel</span>';

  container.innerHTML += `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <div class="page-title">Dashboard Overview</div>
          <div class="page-subtitle">Welcome back, ${Auth.user?.username || 'Admin'} — here's your server at a glance.</div>
        </div>
        ${dataSource}
      </div>
    </div>

    <div class="stats-grid">
      ${statCard('fa-users',  memberCount,   'Total Members',  'purple', g.connected ? 'Live count' : 'Add bot token', '')}
      ${statCard('fa-wifi',   onlineCount,   'Online Now',     'green',  g.connected ? 'Right now'  : 'Add bot token', '')}
      ${statCard('fa-gem',    boostCount,    'Boosts',         'orange', 'Level ' + boostTier, '')}
      ${statCard('fa-ticket', '—',           'Open Tickets',   'blue',   'Needs bot API', '')}
      ${statCard('fa-shield', '—',           'Mod Actions',    'red',    'Needs bot API', '')}
      ${statCard('fa-star',   '—',           'XP Today',       'purple', 'Needs bot API', '')}
    </div>

    ${!g.connected ? `
    <div class="card glass" style="border-color:rgba(245,158,11,0.3);margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="stat-icon orange" style="flex-shrink:0;"><i class="fa-solid fa-plug"></i></div>
        <div>
          <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Connect your bot token to see live server data</div>
          <div style="font-size:13px;color:var(--text-muted);">
            Go to <strong>Vercel → Settings → Environment Variables</strong> and add
            <code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;">DISCORD_BOT_TOKEN</code>
            and <code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;">GUILD_ID</code>,
            then redeploy.
          </div>
        </div>
      </div>
    </div>` : ''}

    <div class="section-grid left-heavy">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-server"></i> Server Info</div>
        </div>
        ${g.connected ? `
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">Server Name</div></div>
            <span style="font-size:13px;font-weight:600;">${g.name || '—'}</span>
          </div>
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">Total Members</div></div>
            <span class="badge badge-purple">${memberCount}</span>
          </div>
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">Online Members</div></div>
            <span class="badge badge-green">${onlineCount}</span>
          </div>
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">Boost Level</div></div>
            <span class="badge badge-orange">Level ${boostTier} · ${boostCount} boosts</span>
          </div>
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">Server ID</div></div>
            <span style="font-size:12px;color:var(--text-dim);font-family:monospace;">${g.id}</span>
          </div>
        ` : botNotConnected('Server stats require DISCORD_BOT_TOKEN')}
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-bolt"></i> Bot Connection</div>
        </div>
        <div class="toggle-row">
          <div class="toggle-info"><div class="toggle-title">Discord API</div></div>
          <span class="badge ${g.connected ? 'badge-green' : 'badge-red'}">${g.connected ? '✓ Connected' : '✗ No token'}</span>
        </div>
        <div class="toggle-row">
          <div class="toggle-info"><div class="toggle-title">Bot API (metrics)</div></div>
          <span class="badge ${botConnected ? 'badge-green' : 'badge-red'}">${botConnected ? 'Connected' : 'Offline'}</span>
        </div>
        <div class="toggle-row">
          <div class="toggle-info"><div class="toggle-title">Database</div></div>
          <span class="badge badge-yellow">Not configured</span>
        </div>

        <div style="margin-top:16px;padding:14px;background:rgba(139,92,246,0.06);border-radius:var(--radius-sm);border:1px solid rgba(139,92,246,0.15);">
          <div style="font-size:12px;font-weight:700;color:var(--accent-bright);margin-bottom:8px;">
            <i class="fa-solid fa-circle-info"></i> To show live bot metrics
          </div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.7;">
            Set <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;">BOT_API_URL</code>
            in Vercel env vars to your bot's API endpoint.
            <br>Your bot must expose a <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;">/status</code> route.
          </div>
        </div>
      </div>
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-gavel"></i> Recent Mod Actions</div>
        </div>
        ${botNotConnected('Moderation logs require your bot to save cases to a database and expose a /api/modlogs endpoint.')}
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-ticket"></i> Recent Tickets</div>
        </div>
        ${botNotConnected('Ticket data requires your bot to save tickets to a database and expose a /api/tickets endpoint.')}
      </div>
    </div>
  `;
}

function botNotConnected(msg) {
  return `
    <div class="empty-state" style="padding:28px 16px;">
      <i class="fa-solid fa-plug" style="font-size:28px;color:var(--accent-dim);opacity:0.6;margin-bottom:12px;"></i>
      <h3 style="font-size:14px;">Bot API not connected</h3>
      <p style="font-size:12px;line-height:1.6;">${msg}</p>
    </div>
  `;
}

function formatUptime(ms) {
  if (!ms || ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${seconds}s`);
  return parts.join(' ');
}

function process_env(key) {
  // Client-side can't read server env vars — always returns falsy
  // Used as a flag placeholder; real check happens server-side
  return false;
}

// ─── Page: Analytics ───────────────────────────────────────────────────────
function renderAnalytics(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Analytics</div>
      <div class="page-subtitle">Server activity, growth, and engagement data.</div>
    </div>

    <div class="stats-grid">
      ${statCard('fa-message',  '12,450', 'Messages Today',   'purple', '+5.2%', 'up')}
      ${statCard('fa-user-plus','34',     'New Members',       'green',  'This week', '')}
      ${statCard('fa-user-minus','8',     'Members Left',      'red',    'This week', 'down')}
      ${statCard('fa-terminal', '2,341',  'Commands Used',     'blue',   'Today', '')}
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-chart-line"></i> Member Growth (30 Days)</div>
        </div>
        <div class="chart-container">
          ${barChart([10,8,15,12,20,18,25,22,30,28,35,33,38,36,40,42,45,44,48,50,53,55,58,56,60,62,65,63,68,70],
            ['','','','','','W1','','','','','','','W2','','','','','','','W3','','','','','','','W4','','',''],true)}
        </div>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-fire"></i> Most Active Channels</div>
        </div>
        ${channelBar('#general',     '4,280', 85)}
        ${channelBar('#bot-commands','2,110', 55)}
        ${channelBar('#off-topic',   '1,830', 47)}
        ${channelBar('#announcements','540',  14)}
        ${channelBar('#media',        '320',  8)}
      </div>
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-ticket"></i> Ticket Activity</div>
        </div>
        <div class="chart-container">
          ${barChart([3,5,2,8,6,4,7], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])}
        </div>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-clock"></i> Peak Activity Hours</div>
        </div>
        ${channelBar('12:00 – 14:00', '3,400 msgs', 100)}
        ${channelBar('18:00 – 20:00', '2,900 msgs', 85)}
        ${channelBar('20:00 – 22:00', '2,600 msgs', 76)}
        ${channelBar('15:00 – 17:00', '1,800 msgs', 53)}
        ${channelBar('10:00 – 12:00', '1,200 msgs', 35)}
      </div>
    </div>
  `;
}

// ─── Page: Bot Status ──────────────────────────────────────────────────────
function renderBotStatus(container) {
  const botStatus = AppState.botStatus || {};
  const online = botStatus.online === true;
  const uptime = formatUptime(botStatus.uptime);
  const ramUsage = botStatus.ramUsageMB != null ? `${botStatus.ramUsageMB} MB` : '—';
  const ramTotal = botStatus.ramTotalMB != null ? `${botStatus.ramTotalMB} MB` : '--';
  const cpuUsage = botStatus.cpuUsage != null ? `${botStatus.cpuUsage}%` : '—';
  const latency = botStatus.ping != null ? `${botStatus.ping}ms` : '—';
  const version = botStatus.version || 'Unknown';

  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Bot Status</div>
      <div class="page-subtitle">Real-time Zenith bot health and performance metrics.</div>
    </div>

    <div class="stats-grid">
      ${statCard('fa-microchip', cpuUsage, 'CPU Usage', 'green', online ? 'Normal' : 'Offline', '')}
      ${statCard('fa-memory', ramUsage, 'RAM Usage', 'blue', `of ${ramTotal}`, '')}
      ${statCard('fa-clock', uptime, 'Uptime', 'purple', online ? 'Live' : 'Offline', '')}
      ${statCard('fa-wifi', latency, 'API Latency', online ? 'Healthy' : 'Unknown', 'green', '')}
      ${statCard('fa-network-wired', `${botStatus.shards?.current || 0}/${botStatus.shards?.total || 1}`, 'Shards', 'blue', online ? 'Active' : 'Inactive', '')}
      ${statCard('fa-code-branch', version, 'Version', 'orange', online ? 'Up to date' : 'Unknown', '')}
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-heartbeat"></i> Health Checks</div>
          <span class="badge badge-green"><i class="fa-solid fa-circle" style="font-size:8px;"></i> All Systems Operational</span>
        </div>
        ${healthRow('Discord API', 'Connected', 'green')}
        ${healthRow('Database', 'Connected', 'green')}
        ${healthRow('Command Handler', 'Running', 'green')}
        ${healthRow('Event Listener', 'Active', 'green')}
        ${healthRow('Ticket System', 'Active', 'green')}
        ${healthRow('Welcome System', 'Active', 'green')}
        ${healthRow('Level System', 'Active', 'green')}
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-microchip"></i> Resource Usage</div>
        </div>
        <div style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
            <span>CPU</span><span style="color:var(--accent-bright)">12%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:12%"></div></div>
        </div>
        <div style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
            <span>RAM</span><span style="color:var(--accent-bright)">38%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:38%"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
            <span>Disk</span><span style="color:var(--accent-bright)">5%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:5%"></div></div>
        </div>
      </div>
    </div>

    <div class="card glass">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-history"></i> Event Log</div>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Logs refreshed','info')">
          <i class="fa-solid fa-rotate"></i> Refresh
        </button>
      </div>
      <table class="data-table">
        <thead><tr><th>Time</th><th>Event</th><th>Details</th><th>Status</th></tr></thead>
        <tbody>
          ${logRow('Just now','Gateway Connected','Shard 0 identified','green')}
          ${logRow('2m ago','Command Used','/ban by Moderator#1234','blue')}
          ${logRow('15m ago','Ticket Created','#ticket-0042 opened','blue')}
          ${logRow('1h ago','Member Joined','NewUser#5678 joined','green')}
          ${logRow('2h ago','Reconnect','Brief gateway disconnect recovered','yellow')}
          ${logRow('6h ago','Restart','Bot restarted — v2.1.4 deployed','purple')}
        </tbody>
      </table>
    </div>
  `;
}

// ─── Page: Message Builder ─────────────────────────────────────────────────
function renderMessages(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Message Builder</div>
      <div class="page-subtitle">Create and send rich embed messages to any channel.</div>
    </div>

    <div class="section-grid left-heavy">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-pen-to-square"></i> Compose Message</div>
        </div>

        <div class="tabs">
          <button class="tab-btn active" onclick="switchTab(this,'basic')">Basic</button>
          <button class="tab-btn" onclick="switchTab(this,'embed')">Embed</button>
          <button class="tab-btn" onclick="switchTab(this,'schedule')">Schedule</button>
        </div>

        <div id="tab-basic">
          <div class="form-group">
            <label class="form-label">Target Channel</label>
            <select class="form-control">
              <option>Select a channel...</option>
              <option>#announcements</option>
              <option>#general</option>
              <option>#updates</option>
              <option>#events</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Message Content</label>
            <textarea class="form-control" placeholder="Type your message here... Use {user} {server} {memberCount}" oninput="updateEmbedPreview()" id="msg-content"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Ping Role (optional)</label>
            <select class="form-control">
              <option>None</option>
              <option>@everyone</option>
              <option>@here</option>
              <option>@Announcements</option>
            </select>
          </div>
        </div>

        <div id="tab-embed" style="display:none;">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Embed Title</label>
              <input class="form-control" type="text" placeholder="Title" id="embed-title" oninput="updateEmbedPreview()" />
            </div>
            <div class="form-group">
              <label class="form-label">Embed Color</label>
              <div class="color-picker-row">
                <div class="color-swatch selected" style="background:#8b5cf6;" data-color="#8b5cf6" onclick="selectColor(this)"></div>
                <div class="color-swatch" style="background:#3b82f6;" data-color="#3b82f6" onclick="selectColor(this)"></div>
                <div class="color-swatch" style="background:#22c55e;" data-color="#22c55e" onclick="selectColor(this)"></div>
                <div class="color-swatch" style="background:#ef4444;" data-color="#ef4444" onclick="selectColor(this)"></div>
                <div class="color-swatch" style="background:#f59e0b;" data-color="#f59e0b" onclick="selectColor(this)"></div>
                <input type="color" value="#8b5cf6" class="form-control" style="height:36px;padding:4px;width:80px;" id="embed-color" oninput="updateEmbedPreview()" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" placeholder="Embed description..." id="embed-desc" oninput="updateEmbedPreview()"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Author Name</label>
              <input class="form-control" type="text" placeholder="Author" id="embed-author" oninput="updateEmbedPreview()" />
            </div>
            <div class="form-group">
              <label class="form-label">Footer Text</label>
              <input class="form-control" type="text" placeholder="Footer" id="embed-footer" oninput="updateEmbedPreview()" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Thumbnail URL</label>
            <input class="form-control" type="url" placeholder="https://..." id="embed-thumb" />
          </div>
          <div class="form-group">
            <label class="form-label">Timestamp</label>
            <label class="toggle" style="display:inline-flex;align-items:center;gap:10px;">
              <input type="checkbox" id="embed-timestamp" />
              <span class="toggle-slider"></span>
              <span style="font-size:13px;color:var(--text-muted);">Include current timestamp</span>
            </label>
          </div>
        </div>

        <div id="tab-schedule" style="display:none;">
          <div class="form-group">
            <label class="form-label">Schedule Date & Time</label>
            <input class="form-control" type="datetime-local" />
          </div>
          <div class="form-group">
            <label class="form-label">Repeat</label>
            <select class="form-control">
              <option>No repeat</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;">
          <button class="btn btn-primary" onclick="showToast('Message sent successfully!','success')">
            <i class="fa-solid fa-paper-plane"></i> Send
          </button>
          <button class="btn btn-ghost">
            <i class="fa-solid fa-floppy-disk"></i> Save Draft
          </button>
        </div>
      </div>

      <div>
        <div class="card glass" style="position:sticky;top:20px;">
          <div class="card-header">
            <div class="card-title"><i class="fa-brands fa-discord"></i> Discord Preview</div>
          </div>
          <div class="embed-preview" id="embed-preview-box" style="border-left-color:#8b5cf6;">
            <div class="embed-preview-author" id="preview-author"></div>
            <div class="embed-preview-title" id="preview-title">Your Title Here</div>
            <div class="embed-preview-desc" id="preview-desc">Your message description will appear here. You can use **bold**, *italic*, and other markdown formatting.</div>
            <div class="embed-preview-footer" id="preview-footer"></div>
          </div>
          <div style="margin-top:14px;font-size:12px;color:var(--text-dim);">
            <i class="fa-solid fa-circle-info"></i> Preview updates in real-time as you type.
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['basic','embed','schedule'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
}

function selectColor(el) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  const preview = document.getElementById('embed-preview-box');
  if (preview) preview.style.borderLeftColor = el.dataset.color;
}

function updateEmbedPreview() {
  const title  = document.getElementById('embed-title');
  const desc   = document.getElementById('embed-desc');
  const author = document.getElementById('embed-author');
  const footer = document.getElementById('embed-footer');
  if (title)  document.getElementById('preview-title').textContent  = title.value  || 'Your Title Here';
  if (desc)   document.getElementById('preview-desc').textContent   = desc.value   || 'Your message description will appear here.';
  if (author) document.getElementById('preview-author').textContent = author.value || '';
  if (footer) document.getElementById('preview-footer').textContent = footer.value || '';
}

// ─── Page: Welcome System ──────────────────────────────────────────────────
function renderWelcome(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Welcome System</div>
      <div class="page-subtitle">Configure how new members are greeted when they join.</div>
    </div>

    <div class="section-grid left-heavy">
      <div>
        <div class="card glass">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-gear"></i> Welcome Settings</div>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-title">Enable Welcome System</div>
              <div class="toggle-desc">Send a message when a member joins</div>
            </div>
            <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-title">Welcome Card</div>
              <div class="toggle-desc">Show a graphical welcome image</div>
            </div>
            <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-title">Auto DM</div>
              <div class="toggle-desc">Send a private welcome message</div>
            </div>
            <label class="toggle"><input type="checkbox" /></span><span class="toggle-slider"></span></label>
          </div>

          <div class="form-group" style="margin-top:20px;">
            <label class="form-label">Welcome Channel</label>
            <select class="form-control">
              <option>#welcome</option>
              <option>#general</option>
              <option>#introductions</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Welcome Message</label>
            <textarea class="form-control">Welcome {user} to {server}! You are member #{memberCount}. Please read the rules and enjoy your stay! 🎉</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">DM Message</label>
            <textarea class="form-control" placeholder="Private message sent to new members...">Hey {user}! Welcome to {server}. Check out #rules to get started!</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Card Background</label>
            <div style="display:flex;gap:10px;align-items:center;">
              <input class="form-control" type="text" placeholder="Background image URL..." style="flex:1;" />
              <button class="btn btn-ghost btn-sm"><i class="fa-solid fa-upload"></i> Upload</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Card Font</label>
            <select class="form-control">
              <option>Inter</option>
              <option>Roboto</option>
              <option>Poppins</option>
              <option>Montserrat</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="showToast('Welcome settings saved!','success')">
            <i class="fa-solid fa-floppy-disk"></i> Save Settings
          </button>
        </div>
      </div>

      <div>
        <div class="card glass">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-eye"></i> Card Preview</div>
          </div>
          <div class="welcome-card-preview">
            <img class="welcome-avatar" src="https://cdn.discordapp.com/embed/avatars/0.png" alt="User" />
            <div class="welcome-text">
              <div class="welcome-greeting">Welcome, NewUser!</div>
              <div class="welcome-sub">You are member #1,204 of Zenith Server</div>
            </div>
          </div>
          <div style="margin-top:16px;font-size:12px;color:var(--text-dim);">
            Available variables: <code>{user}</code> <code>{server}</code> <code>{memberCount}</code>
          </div>
        </div>

        <div class="card glass" style="margin-top:16px;">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-music"></i> Join Sound</div>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-title">Play Join Sound</div>
              <div class="toggle-desc">Play audio when a member joins a voice channel</div>
            </div>
            <label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="form-group" style="margin-top:16px;">
            <label class="form-label">Sound File URL</label>
            <input class="form-control" type="url" placeholder="https://..." />
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Page: Goodbye ─────────────────────────────────────────────────────────
function renderGoodbye(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Goodbye System</div>
      <div class="page-subtitle">Configure leave messages when members depart.</div>
    </div>

    <div class="section-grid left-heavy">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-gear"></i> Goodbye Settings</div>
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-title">Enable Goodbye System</div>
            <div class="toggle-desc">Send a message when a member leaves</div>
          </div>
          <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-title">Goodbye Card</div>
            <div class="toggle-desc">Show a graphical leave image</div>
          </div>
          <label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></label>
        </div>

        <div class="form-group" style="margin-top:20px;">
          <label class="form-label">Goodbye Channel</label>
          <select class="form-control">
            <option>#goodbye</option>
            <option>#general</option>
            <option>#logs</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Goodbye Message</label>
          <textarea class="form-control">Goodbye {user}! We had {memberCount} members. Hope to see you again soon.</textarea>
        </div>
        <button class="btn btn-primary" onclick="showToast('Goodbye settings saved!','success')">
          <i class="fa-solid fa-floppy-disk"></i> Save Settings
        </button>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-chart-bar"></i> Leave Statistics</div>
        </div>
        <div class="stats-grid" style="grid-template-columns:1fr;">
          <div class="stat-card glass-inner">
            <div class="stat-icon purple"><i class="fa-solid fa-user-minus"></i></div>
            <div class="stat-value">8</div>
            <div class="stat-label">Left This Week</div>
          </div>
          <div class="stat-card glass-inner">
            <div class="stat-icon red"><i class="fa-solid fa-calendar"></i></div>
            <div class="stat-value">26</div>
            <div class="stat-label">Left This Month</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Page: Auto Roles ──────────────────────────────────────────────────────
function renderAutoRoles(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Auto Role System</div>
      <div class="page-subtitle">Automatically assign roles to members when they join.</div>
    </div>

    <div class="section-grid left-heavy">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-user-tag"></i> Auto Role Rules</div>
          <button class="btn btn-primary btn-sm" onclick="openModal('Add Auto Role', addRoleModalHTML())">
            <i class="fa-solid fa-plus"></i> Add Rule
          </button>
        </div>
        <table class="data-table">
          <thead><tr><th>Role</th><th>Delay</th><th>Account Age</th><th>Verified Only</th><th>Actions</th></tr></thead>
          <tbody>
            ${autoRoleRow('@Member','0s','None','No')}
            ${autoRoleRow('@Unverified','0s','None','No')}
            ${autoRoleRow('@Newcomer','5m','< 30 days','No')}
          </tbody>
        </table>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-gear"></i> Settings</div>
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-title">Enable Auto Role</div>
            <div class="toggle-desc">Assign roles to new members</div>
          </div>
          <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-title">Account Age Check</div>
            <div class="toggle-desc">Require minimum account age</div>
          </div>
          <label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></label>
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-title">Delay Assignment</div>
            <div class="toggle-desc">Wait before assigning roles</div>
          </div>
          <label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></label>
        </div>
      </div>
    </div>
  `;
}

function addRoleModalHTML() {
  return `
    <div class="form-group">
      <label class="form-label">Role</label>
      <select class="form-control"><option>Select a role...</option><option>@Member</option><option>@Newcomer</option></select>
    </div>
    <div class="form-group">
      <label class="form-label">Delay (seconds)</label>
      <input class="form-control" type="number" placeholder="0" min="0" />
    </div>
    <div class="form-group">
      <label class="form-label">Minimum Account Age (days)</label>
      <input class="form-control" type="number" placeholder="0" min="0" />
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;">
      <button class="btn btn-primary" onclick="showToast('Auto role rule added!','success');closeModal();">Add Rule</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `;
}

function autoRoleRow(role, delay, age, verified) {
  return `<tr>
    <td><span class="badge badge-purple">${role}</span></td>
    <td>${delay}</td>
    <td>${age}</td>
    <td>${verified}</td>
    <td><button class="btn btn-danger btn-sm" onclick="showToast('Rule removed','info')"><i class="fa-solid fa-trash"></i></button></td>
  </tr>`;
}

// ─── Page: Reaction Roles ──────────────────────────────────────────────────
function renderReactionRoles(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Reaction Roles</div>
      <div class="page-subtitle">Assign roles to members based on emoji reactions.</div>
    </div>

    <div class="card glass">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-face-smile"></i> Reaction Role Panels</div>
        <button class="btn btn-primary btn-sm" onclick="showToast('Create panel from Message Builder first','info')">
          <i class="fa-solid fa-plus"></i> New Panel
        </button>
      </div>
      ${rrPanel('Color Roles Panel', '#roles', [
        {emoji:'🔴',role:'@Red'},
        {emoji:'🔵',role:'@Blue'},
        {emoji:'🟢',role:'@Green'},
        {emoji:'🟡',role:'@Yellow'}
      ])}
      ${rrPanel('Notification Roles', '#roles', [
        {emoji:'📢',role:'@Announcements'},
        {emoji:'🎮',role:'@Gaming'},
        {emoji:'🎵',role:'@Music'},
      ])}
    </div>
  `;
}

function rrPanel(name, channel, mappings) {
  const rows = mappings.map(m => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:22px;">${m.emoji}</span>
      <i class="fa-solid fa-arrow-right" style="color:var(--text-dim);font-size:12px;"></i>
      <span class="badge badge-purple">${m.role}</span>
      <button class="btn btn-danger btn-sm" style="margin-left:auto;" onclick="showToast('Mapping removed','info')"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');
  return `
    <div class="glass-inner" style="padding:18px;border-radius:var(--radius);margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-size:14px;font-weight:700;">${name}</div>
          <div style="font-size:12px;color:var(--text-muted);">${channel}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm"><i class="fa-solid fa-plus"></i> Add</button>
          <button class="btn btn-danger btn-sm"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      ${rows}
    </div>
  `;
}

// ─── Page: Tickets ─────────────────────────────────────────────────────────
function renderTickets(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Ticket System</div>
      <div class="page-subtitle">Manage support tickets, categories, and staff permissions.</div>
    </div>

    <div class="stats-grid">
      ${statCard('fa-inbox',   '24',  'Open Tickets',   'blue',   '3 new today',  'up')}
      ${statCard('fa-clock',   '8',   'Awaiting Reply', 'orange', 'Need attention','')}
      ${statCard('fa-check',   '156', 'Closed Tickets', 'green',  'This month',   '')}
      ${statCard('fa-hourglass-half','1.4h','Avg Response','purple','All time',   '')}
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-title" style="margin-bottom:16px;"><i class="fa-solid fa-th-large"></i> Categories</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          ${ticketCategory('🎧','Support','General help & questions','12 open')}
          ${ticketCategory('🚨','Reports','Player or content reports','4 open')}
          ${ticketCategory('📋','Applications','Staff & partner applications','6 open')}
          ${ticketCategory('🤝','Partnerships','Collaboration requests','1 open')}
          ${ticketCategory('⚖️','Appeals','Ban and mute appeals','1 open')}
        </div>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-list"></i> Active Tickets</div>
        </div>
        <table class="data-table">
          <thead><tr><th>#</th><th>User</th><th>Category</th><th>Status</th></tr></thead>
          <tbody>
            ${ticketTableRow('0048','User#1234','Support','Open','blue')}
            ${ticketTableRow('0047','User#5678','Report','In Review','yellow')}
            ${ticketTableRow('0046','User#9012','Appeal','Open','blue')}
            ${ticketTableRow('0045','User#3456','Partnership','Closed','gray')}
            ${ticketTableRow('0044','User#7890','Application','Closed','gray')}
          </tbody>
        </table>

        <div class="card-header" style="margin-top:24px;">
          <div class="card-title"><i class="fa-solid fa-gear"></i> Panel Settings</div>
        </div>
        <div class="form-group">
          <label class="form-label">Ticket Channel</label>
          <select class="form-control">
            <option>#create-ticket</option>
            <option>#support</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Transcript Channel</label>
          <select class="form-control">
            <option>#ticket-logs</option>
            <option>#transcripts</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Support Role</label>
          <select class="form-control">
            <option>@Staff</option>
            <option>@Moderator</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="showToast('Ticket settings saved!','success')">
          <i class="fa-solid fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>
  `;
}

function ticketCategory(emoji, name, desc, count) {
  return `
    <div class="ticket-category glass-inner">
      <div class="tc-icon">${emoji}</div>
      <div class="tc-name">${name}</div>
      <div class="tc-count">${desc}</div>
      <div style="margin-top:8px;"><span class="badge badge-blue">${count}</span></div>
    </div>
  `;
}

function ticketTableRow(id, user, cat, status, color) {
  return `<tr>
    <td>#${id}</td>
    <td>${user}</td>
    <td>${cat}</td>
    <td><span class="badge badge-${color}">${status}</span></td>
  </tr>`;
}

// ─── Page: Staff Applications ──────────────────────────────────────────────
function renderStaff(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Staff Applications</div>
      <div class="page-subtitle">Review and manage staff applications and the vote system.</div>
    </div>

    <div class="stats-grid">
      ${statCard('fa-file','12','Pending','yellow','Awaiting review','')}
      ${statCard('fa-check-circle','4','Approved','green','This month','')}
      ${statCard('fa-x-circle','8','Rejected','red','This month','')}
    </div>

    <div class="section-grid left-heavy">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-file-alt"></i> Pending Applications</div>
        </div>
        ${applicationRow('User#1234','Moderator','2h ago','4/5 votes')}
        ${applicationRow('User#5678','Builder','1d ago','2/5 votes')}
        ${applicationRow('User#9012','Developer','3d ago','0/5 votes')}
        ${applicationRow('User#3456','Tester','4d ago','1/5 votes')}
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-gear"></i> Application Settings</div>
        </div>
        <div class="form-group">
          <label class="form-label">Application Channel</label>
          <select class="form-control">
            <option>#apply-here</option>
            <option>#applications</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Staff Review Channel</label>
          <select class="form-control">
            <option>#staff-applications</option>
            <option>#staff-review</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Votes Required for Approval</label>
          <input class="form-control" type="number" value="5" min="1" />
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-title">Anonymous Voting</div>
            <div class="toggle-desc">Hide who voted on applications</div>
          </div>
          <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
        </div>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="showToast('Settings saved!','success')">
          <i class="fa-solid fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>
  `;
}

function applicationRow(user, role, time, votes) {
  return `
    <div class="mod-action">
      <div class="mod-icon" style="background:rgba(139,92,246,0.1);color:var(--accent-bright);">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="mod-info">
        <div class="mod-title">${user} — <span class="badge badge-purple">${role}</span></div>
        <div class="mod-meta">${time} · ${votes}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-success btn-sm" onclick="showToast('Application approved!','success')"><i class="fa-solid fa-check"></i></button>
        <button class="btn btn-danger btn-sm"  onclick="showToast('Application rejected','info')"><i class="fa-solid fa-xmark"></i></button>
        <button class="btn btn-ghost btn-sm"   onclick="showToast('Viewing application...','info')"><i class="fa-solid fa-eye"></i></button>
      </div>
    </div>
  `;
}

// ─── Page: Moderation ──────────────────────────────────────────────────────
function renderModeration(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Moderation</div>
      <div class="page-subtitle">Execute moderation actions and review the case history.</div>
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-gavel"></i> Quick Actions</div>
        </div>
        <div class="form-group">
          <label class="form-label">Target User (Username or ID)</label>
          <input class="form-control" type="text" placeholder="User#0000 or 123456789..." />
        </div>
        <div class="form-group">
          <label class="form-label">Action</label>
          <select class="form-control">
            <option>Warn</option>
            <option>Timeout</option>
            <option>Kick</option>
            <option>Ban</option>
            <option>Purge Messages</option>
            <option>Slowmode</option>
            <option>Lock Channel</option>
            <option>Unlock Channel</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Reason</label>
          <textarea class="form-control" placeholder="Reason for this action..." style="min-height:70px;"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (for Timeout)</label>
          <select class="form-control">
            <option>60s</option>
            <option>5m</option>
            <option>10m</option>
            <option>1h</option>
            <option>6h</option>
            <option>1d</option>
            <option>1w</option>
          </select>
        </div>
        <button class="btn btn-danger" onclick="showToast('Action queued — confirm in Discord','warning')">
          <i class="fa-solid fa-gavel"></i> Execute Action
        </button>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-history"></i> Case History</div>
        </div>
        ${modLogEntry('fa-ban','red','User#0001 banned','spam and trolling','Case #156','2m ago')}
        ${modLogEntry('fa-clock','orange','User#0002 timed out (10m)','rule violation','Case #155','15m ago')}
        ${modLogEntry('fa-triangle-exclamation','yellow','User#0003 warned','inappropriate language','Case #154','1h ago')}
        ${modLogEntry('fa-trash','blue','50 messages purged in #general','spam cleanup','Case #153','2h ago')}
        ${modLogEntry('fa-ban','red','User#0004 banned','ban evasion','Case #152','1d ago')}
        ${modLogEntry('fa-user-slash','orange','User#0005 kicked','AFK cleanup','Case #151','2d ago')}
      </div>
    </div>

    <div class="card glass">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-gear"></i> Auto-Moderation Settings</div>
      </div>
      <div class="section-grid triple">
        ${autoModToggle('Anti-Spam','Detect and handle message spam')}
        ${autoModToggle('Anti-Raid','Detect mass join events')}
        ${autoModToggle('Link Filter','Block unauthorised links')}
        ${autoModToggle('Word Filter','Block banned words')}
        ${autoModToggle('Caps Filter','Limit excessive caps',false)}
        ${autoModToggle('Mention Limit','Limit mass mentions')}
      </div>
    </div>
  `;
}

function autoModToggle(title, desc, checked = true) {
  return `
    <div class="toggle-row" style="border-bottom:none;padding:10px 0;">
      <div class="toggle-info">
        <div class="toggle-title">${title}</div>
        <div class="toggle-desc">${desc}</div>
      </div>
      <label class="toggle"><input type="checkbox" ${checked ? 'checked' : ''} /><span class="toggle-slider"></span></label>
    </div>
  `;
}

// ─── Page: Level System ────────────────────────────────────────────────────
function renderLevels(container) {
  const leaders = [
    {rank:1, name:'ProGamer#1234', xp:'45,200', level:52},
    {rank:2, name:'CoolUser#5678', xp:'38,900', level:47},
    {rank:3, name:'FastTyper#9012', xp:'32,100', level:41},
    {rank:4, name:'Zenith#3456', xp:'28,500', level:38},
    {rank:5, name:'BotTester#7890', xp:'21,300', level:32},
    {rank:6, name:'Gamer#0001', xp:'18,100', level:28},
    {rank:7, name:'User#0002', xp:'15,400', level:24},
    {rank:8, name:'Member#0003', xp:'12,000', level:20},
  ];

  const rankClasses = ['gold','silver','bronze','','','','',''];

  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Level System</div>
      <div class="page-subtitle">XP tracking, leaderboards, level rewards, and multipliers.</div>
    </div>

    <div class="section-grid left-heavy">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-trophy"></i> Leaderboard</div>
        </div>
        ${leaders.map((u, i) => `
          <div class="leaderboard-item">
            <span class="lb-rank ${rankClasses[i]}">${u.rank}</span>
            <img class="lb-avatar" src="https://cdn.discordapp.com/embed/avatars/${i % 5}.png" alt="${u.name}" />
            <div class="lb-info">
              <div class="lb-name">${u.name}</div>
              <div class="lb-xp">${u.xp} XP</div>
            </div>
            <span class="lb-level">Lvl ${u.level}</span>
          </div>
        `).join('')}
      </div>

      <div>
        <div class="card glass">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-gear"></i> XP Settings</div>
          </div>
          <div class="form-group">
            <label class="form-label">XP Per Message</label>
            <input class="form-control" type="number" value="15" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">XP Cooldown (seconds)</label>
            <input class="form-control" type="number" value="60" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Level-Up Channel</label>
            <select class="form-control">
              <option>#level-up</option>
              <option>Same channel</option>
              <option>DM Only</option>
            </select>
          </div>
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">No XP Channels</div></div>
            <label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-info"><div class="toggle-title">Multiplier Roles</div></div>
            <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          </div>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="showToast('XP settings saved!','success')">
            <i class="fa-solid fa-floppy-disk"></i> Save
          </button>
        </div>

        <div class="card glass" style="margin-top:16px;">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-gift"></i> Level Rewards</div>
            <button class="btn btn-primary btn-sm" onclick="showToast('Add reward modal — coming soon','info')">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          ${levelReward(5,'@Active',false)}
          ${levelReward(10,'@Regular',false)}
          ${levelReward(25,'@Veteran',false)}
          ${levelReward(50,'@Elite',false)}
        </div>
      </div>
    </div>
  `;
}

function levelReward(level, role, special) {
  return `
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-title">Level ${level} → <span class="badge badge-purple">${role}</span></div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="showToast('Reward removed','info')"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;
}

// ─── Page: Settings ────────────────────────────────────────────────────────
function renderSettings(container) {
  container.innerHTML += `
    <div class="page-header">
      <div class="page-title">Settings</div>
      <div class="page-subtitle">Configure dashboard preferences and bot settings.</div>
    </div>

    <div class="section-grid">
      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-robot"></i> Bot Configuration</div>
        </div>
        <div class="form-group">
          <label class="form-label">Bot Prefix</label>
          <input class="form-control" type="text" value="!" />
        </div>
        <div class="form-group">
          <label class="form-label">Bot Status</label>
          <select class="form-control">
            <option>Online</option>
            <option>Idle</option>
            <option>Do Not Disturb</option>
            <option>Invisible</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Activity Type</label>
          <select class="form-control">
            <option>Playing</option>
            <option>Watching</option>
            <option>Listening</option>
            <option>Competing</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Activity Text</label>
          <input class="form-control" type="text" placeholder="e.g. Zenith Community" value="Zenith Community" />
        </div>
        <div class="form-group">
          <label class="form-label">Log Channel</label>
          <select class="form-control">
            <option>#bot-logs</option>
            <option>#audit-log</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="showToast('Bot settings saved!','success')">
          <i class="fa-solid fa-floppy-disk"></i> Save Settings
        </button>
      </div>

      <div class="card glass">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-shield"></i> Permission Roles</div>
        </div>
        <div class="form-group">
          <label class="form-label">Admin Role</label>
          <select class="form-control"><option>@Admin</option><option>@Owner</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Moderator Role</label>
          <select class="form-control"><option>@Moderator</option><option>@Staff</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Support Role</label>
          <select class="form-control"><option>@Helper</option><option>@Support</option></select>
        </div>
        <button class="btn btn-primary" onclick="showToast('Permissions saved!','success')">
          <i class="fa-solid fa-floppy-disk"></i> Save Permissions
        </button>

        <div class="card-header" style="margin-top:24px;">
          <div class="card-title"><i class="fa-solid fa-database"></i> Danger Zone</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
          <button class="btn btn-danger" onclick="showToast('Are you sure? This cannot be undone.','warning')">
            <i class="fa-solid fa-trash"></i> Reset All Settings
          </button>
          <button class="btn btn-danger" onclick="showToast('Clearing all XP data...','warning')">
            <i class="fa-solid fa-star-half-stroke"></i> Reset XP Data
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── 404 ───────────────────────────────────────────────────────────────────
function render404(container) {
  container.innerHTML += `
    <div class="empty-state" style="height:60vh;">
      <i class="fa-solid fa-map" style="font-size:56px;"></i>
      <h3>Page Not Found</h3>
      <p>The route you're looking for doesn't exist.</p>
      <a href="#/" class="btn btn-primary" style="margin-top:16px;">Go Home</a>
    </div>
  `;
}

// ─── Helper Functions ──────────────────────────────────────────────────────
function statCard(icon, value, label, color, change, dir) {
  return `
    <div class="stat-card glass">
      <div class="stat-icon ${color}"><i class="fa-solid ${icon}"></i></div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      ${change ? `<div class="stat-change ${dir}">
        ${dir === 'up' ? '<i class="fa-solid fa-arrow-up"></i>' : dir === 'down' ? '<i class="fa-solid fa-arrow-down"></i>' : ''}
        ${change}
      </div>` : ''}
    </div>
  `;
}

function barChart(data, labels, thin = false) {
  const max = Math.max(...data);
  return data.map((v, i) => {
    const pct = Math.round((v / max) * 100);
    return `<div class="chart-bar" style="height:${pct}%;${thin ? 'flex:0.5;' : ''}" data-label="${labels[i] || ''}">
      <span class="chart-bar-value">${v}</span>
    </div>`;
  }).join('');
}

function channelBar(name, count, pct) {
  return `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;">
        <span style="color:var(--text-muted);">${name}</span>
        <span style="color:var(--accent-bright);font-weight:600;">${count}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function healthRow(name, status, color) {
  return `
    <div class="toggle-row">
      <div class="toggle-info"><div class="toggle-title">${name}</div></div>
      <span class="badge badge-${color}">${status}</span>
    </div>
  `;
}

function logRow(time, event, details, color) {
  return `<tr>
    <td style="color:var(--text-dim);font-size:12px;">${time}</td>
    <td>${event}</td>
    <td style="color:var(--text-muted);font-size:12px;">${details}</td>
    <td><span class="badge badge-${color}">OK</span></td>
  </tr>`;
}

function modLogEntry(icon, color, title, detail, caseId, time) {
  const colorMap = { red:'rgba(239,68,68,0.15)', orange:'rgba(245,158,11,0.15)', yellow:'rgba(234,179,8,0.15)', blue:'rgba(59,130,246,0.15)' };
  const textMap  = { red:'#f87171', orange:'#fbbf24', yellow:'#facc15', blue:'#60a5fa' };
  return `
    <div class="mod-action">
      <div class="mod-icon" style="background:${colorMap[color]};color:${textMap[color]};">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="mod-info">
        <div class="mod-title">${title}</div>
        <div class="mod-meta">${detail} · ${time}</div>
      </div>
      <div class="mod-case">${caseId}</div>
    </div>
  `;
}

function ticketRow(cat, desc, status, color) {
  return `
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-title">${cat}</div>
        <div class="toggle-desc">${desc}</div>
      </div>
      <span class="badge badge-${color}">${status}</span>
    </div>
  `;
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────
async function boot() {
  const isAuthed = await Auth.load();

  if (isAuthed) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // Real user info from Discord OAuth
    if (Auth.user) {
      const avatarUrl = Auth.user.avatar
        ? `https://cdn.discordapp.com/avatars/${Auth.user.id}/${Auth.user.avatar}.png?size=64`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      document.getElementById('user-avatar').src = avatarUrl;
      document.getElementById('user-name').textContent = Auth.user.username;
      document.getElementById('user-tag').textContent = `#${Auth.user.discriminator || '0'}`;
    }

    // Show guild name immediately from basic info
    const guildPreview = Auth.guild;
    if (guildPreview) {
      const iconUrl = guildPreview.icon
        ? `https://cdn.discordapp.com/icons/${guildPreview.id}/${guildPreview.icon}.png?size=64`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
      document.getElementById('guild-icon').src = iconUrl;
      document.getElementById('guild-name').textContent = guildPreview.name || 'Zenith Server';
    }

    initSidebar();
    navigate();
    window.addEventListener('hashchange', navigate);

    // Load guild info and bot status, then refresh UI on success
    await Promise.all([Auth.loadGuildInfo(), loadBotStatus()]);

    if (Auth.guildInfo) {
      const iconUrl = Auth.guildInfo.icon
        ? `https://cdn.discordapp.com/icons/${Auth.guildInfo.id}/${Auth.guildInfo.icon}.png?size=64`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
      document.getElementById('guild-icon').src = iconUrl;
      document.getElementById('guild-name').textContent = Auth.guildInfo.name || 'Zenith Server';
    }

    // Re-render current route after real data loads
    navigate();

  } else {
    document.getElementById('login-page').classList.remove('hidden');
  }
}

boot();
