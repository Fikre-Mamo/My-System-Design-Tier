// ── Data ─────────────────────────────────────────────────────────────────────
const CONCEPTS = [
  { id:'object-storage', name:'Object Storage', icon:'🪣', bg:'#d4f5e0',
    what:'Durable, HTTP-addressable storage for blobs like images, video, backups, and static assets. Effectively infinite.',
    when:'Anytime you store files. Cheaper, more durable, and more scalable than disks.',
    tools:['AWS S3','Cloudflare R2','Google Cloud Storage','Azure Blob'] },

  { id:'load-balancers', name:'Load Balancers', icon:'⚖️', bg:'#ffecd9',
    what:'Distributes incoming network traffic across multiple servers to ensure no single server is overwhelmed.',
    when:'When you have more than one backend instance and need to spread traffic, enable health checks, or do zero-downtime deploys.',
    tools:['AWS ALB','NGINX','HAProxy','Cloudflare'] },

  { id:'databases', name:'Databases', icon:'🐘', bg:'#e8eaf6',
    what:'Structured or unstructured stores that persist, index, and query your application data reliably.',
    when:'Every production application. SQL vs NoSQL depends on access patterns and consistency needs.',
    tools:['PostgreSQL','MySQL','MongoDB','DynamoDB','Redis'] },

  { id:'cdns', name:'CDNs', icon:'🌐', bg:'#fff3e0',
    what:'Content Delivery Networks cache static assets at edge nodes close to your users worldwide.',
    when:'Serving static files, images, JS/CSS bundles, or any content where latency and bandwidth costs matter.',
    tools:['Cloudflare','AWS CloudFront','Fastly','Akamai'] },

  { id:'queues', name:'Queues', icon:'📬', bg:'#fce4ec',
    what:'Message queues decouple producers and consumers, enabling async processing and buffering of work.',
    when:'Background jobs, event-driven architectures, rate-limiting processing, or anywhere you need async handoffs.',
    tools:['RabbitMQ','AWS SQS','Kafka','Redis Streams'] },

  { id:'rest-apis', name:'REST APIs', icon:'🔌', bg:'#e8f4fd',
    what:'Representational State Transfer — a stateless HTTP-based convention for structuring API endpoints around resources.',
    when:'Default choice for most web and mobile backends. Simple, widely understood, and tooled everywhere.',
    tools:['Express','FastAPI','Django REST','Rails API'] },

  { id:'search', name:'Search', icon:'🔍', bg:'#e3f2fd',
    what:'Full-text and semantic search engines that index data and support fast, ranked, fuzzy queries across large datasets.',
    when:'Product search, log analytics, document retrieval — anywhere SQL LIKE queries become too slow or inflexible.',
    tools:['Elasticsearch','OpenSearch','Typesense','Meilisearch'] },

  { id:'realtime', name:'Real-time Arch.', icon:'⚡', bg:'#fff8e1',
    what:'Systems that push data to clients instantly as events occur, using WebSockets, SSE, or streaming pipelines.',
    when:'Chat, live dashboards, collaborative editing, gaming, financial tickers — anywhere stale data breaks the UX.',
    tools:['Kafka','Socket.io','Pusher','Ably','AWS Kinesis'] },

  { id:'serverless', name:'Serverless', icon:'☁️', bg:'#fbe9e7',
    what:'Function-as-a-Service platforms that run your code on-demand without managing server infrastructure.',
    when:'Event-driven workloads, webhooks, scheduled jobs, or bursty traffic. Bad fit for long-running tasks.',
    tools:['AWS Lambda','Cloudflare Workers','Vercel Functions','Cloud Run'] },

  { id:'microservices', name:'Microservices', icon:'🧩', bg:'#e8eaf6',
    what:'An architectural style that structures an application as a collection of small, independently deployable services.',
    when:'Large engineering orgs with separate teams, strict per-domain scaling, or polyglot technology needs.',
    tools:['Kubernetes','Docker','Istio','gRPC','Consul'] },

  { id:'graphql', name:'GraphQL', icon:'◈', bg:'#fce4ec',
    what:'A query language for APIs that lets clients request exactly the data they need, reducing over- and under-fetching.',
    when:'Complex frontends with many different data requirements, or public APIs consumed by diverse clients.',
    tools:['Apollo Server','Hasura','Strawberry','GraphQL Yoga'] },

  { id:'caching', name:'Caching', icon:'⚡', bg:'#e0f7fa',
    what:'In-memory or distributed caches that store computed results to reduce latency and database load.',
    when:'Expensive queries, hot reads, session storage, or rate-limiting. One of the highest-ROI performance moves.',
    tools:['Redis','Memcached','Varnish','CDN edge caching'] },

  { id:'api-gateway', name:'API Gateway', icon:'🚪', bg:'#f3e5f5',
    what:'A single entry point for API traffic that handles routing, auth, rate limiting, and observability.',
    when:'Microservices environments, public APIs, or whenever you need centralised cross-cutting concerns.',
    tools:['AWS API Gateway','Kong','Traefik','NGINX'] },

  { id:'ci-cd', name:'CI / CD', icon:'🔄', bg:'#e8f5e9',
    what:'Automated pipelines that build, test, and deploy code on every commit, enabling fast and reliable releases.',
    when:'Every serious software project. Reduces human error, enables rollbacks, and enforces quality gates.',
    tools:['GitHub Actions','GitLab CI','CircleCI','Jenkins'] },

  { id:'rate-limiting', name:'Rate Limiting', icon:'🚦', bg:'#fff9c4',
    what:'Controls how many requests a client can make in a time window to protect infrastructure and enforce fair usage.',
    when:'Public APIs, auth endpoints, or any service susceptible to abuse, scraping, or accidental flood traffic.',
    tools:['Redis + Lua','Nginx limit_req','Kong','AWS WAF'] },
];

const TIERS = [
  { key:'S', color:'#ff6b6b' },
  { key:'A', color:'#ff9f43' },
  { key:'B', color:'#feca57' },
  { key:'C', color:'#1dd1a1' },
  { key:'D', color:'#54a0ff' },
];

// ── State ─────────────────────────────────────────────────────────────────────
let state = { S:[], A:[], B:[], C:[], D:[], unranked: CONCEPTS.map(c => c.id) };
let activePanelId = null;

// ── Touch drag state ──────────────────────────────────────────────────────────
let touchDragId = null;
let ghost = null;
let touchStartX = 0, touchStartY = 0;
let touchMoved = false;

// ── Build DOM ─────────────────────────────────────────────────────────────────
function buildTierRows() {
  const container = document.getElementById('tier-container');
  container.innerHTML = '';
  TIERS.forEach(({ key, color }) => {
    const row = document.createElement('div');
    row.className = 'tier-row';
    row.innerHTML = `
      <div class="tier-label" style="background:${color}">${key}</div>
      <div class="tier-zone" id="zone-${key}" data-zone="${key}"></div>
    `;
    container.appendChild(row);
  });
}

function buildCard(concept) {
  const div = document.createElement('div');
  div.className = 'card';
  div.dataset.id = concept.id;
  div.draggable = true;
  div.innerHTML = `
    <div class="card-emoji" style="background:${concept.bg}">${concept.icon}</div>
    <span class="card-name">${concept.name}</span>
  `;
  // Mouse drag
  div.addEventListener('dragstart', onDragStart);
  div.addEventListener('dragend', onDragEnd);
  // Touch drag
  div.addEventListener('touchstart', onTouchStart, { passive: false });
  div.addEventListener('touchmove', onTouchMove, { passive: false });
  div.addEventListener('touchend', onTouchEnd);
  // Click / tap info
  div.addEventListener('click', (e) => {
    if (!touchMoved) openPanel(concept.id);
  });
  return div;
}

function render() {
  // Rebuild tier zones
  TIERS.forEach(({ key }) => {
    const zone = document.getElementById(`zone-${key}`);
    if (!zone) return;
    zone.innerHTML = '';
    const ids = state[key];
    if (ids.length === 0) {
      zone.innerHTML = '<span class="empty-hint">Drop here</span>';
    } else {
      ids.forEach(id => {
        const c = CONCEPTS.find(x => x.id === id);
        if (c) zone.appendChild(buildCard(c));
      });
    }
  });

  // Unranked
  const uz = document.getElementById('zone-unranked');
  uz.innerHTML = '';
  const uids = state.unranked;
  if (uids.length === 0) {
    uz.innerHTML = '<span class="empty-hint">All concepts ranked!</span>';
  } else {
    uids.forEach(id => {
      const c = CONCEPTS.find(x => x.id === id);
      if (c) uz.appendChild(buildCard(c));
    });
  }

  // Attach zone events
  document.querySelectorAll('[data-zone]').forEach(zone => {
    zone.addEventListener('dragover', onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop', onDrop);
  });
}

// ── Mouse Drag ────────────────────────────────────────────────────────────────
let dragId = null;

function onDragStart(e) {
  dragId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragId);
}

function onDragEnd() {
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function onDragLeave(e) {
  if (!this.contains(e.relatedTarget)) this.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const id = e.dataTransfer.getData('text/plain') || dragId;
  if (!id) return;
  moveCard(id, this.dataset.zone);
}

// ── Touch Drag ────────────────────────────────────────────────────────────────
function onTouchStart(e) {
  touchMoved = false;
  touchDragId = this.dataset.id;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function onTouchMove(e) {
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  if (!touchMoved && Math.sqrt(dx*dx + dy*dy) > 6) {
    touchMoved = true;
    const card = this;
    const concept = CONCEPTS.find(c => c.id === touchDragId);
    if (!concept) return;

    // Create ghost
    ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `<div class="card-emoji" style="background:${concept.bg};width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px">${concept.icon}</div><span>${concept.name}</span>`;
    document.body.appendChild(ghost);
    card.classList.add('dragging');
  }

  if (touchMoved && ghost) {
    e.preventDefault();
    ghost.style.left = (e.touches[0].clientX - 60) + 'px';
    ghost.style.top  = (e.touches[0].clientY - 22) + 'px';

    // Highlight zone under finger
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    const zone = el?.closest('[data-zone]');
    if (zone) zone.classList.add('drag-over');
  }
}

function onTouchEnd(e) {
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

  if (ghost) { ghost.remove(); ghost = null; }

  if (touchMoved && touchDragId) {
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = el?.closest('[data-zone]');
    if (zone) moveCard(touchDragId, zone.dataset.zone);
  }

  touchDragId = null;
  touchMoved = false;
}

// ── Move logic ────────────────────────────────────────────────────────────────
function moveCard(id, destZone) {
  // Remove from all
  Object.keys(state).forEach(k => { state[k] = state[k].filter(i => i !== id); });
  state[destZone].push(id);
  render();
  if (activePanelId === id) openPanel(id);
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function populatePanel(prefix, concept) {
  document.getElementById(`${prefix}-icon`).textContent = concept.icon;
  document.getElementById(`${prefix}-icon-bg`).style.background = concept.bg;
  document.getElementById(`${prefix}-title`).textContent = concept.name;
  document.getElementById(`${prefix}-what`).textContent = concept.what;
  document.getElementById(`${prefix}-when`).textContent = concept.when;
  const toolsEl = document.getElementById(`${prefix}-tools`);
  toolsEl.innerHTML = '';
  concept.tools.forEach(t => {
    const s = document.createElement('span');
    s.className = 'tool-tag';
    s.textContent = t;
    toolsEl.appendChild(s);
  });
}

function openPanel(id) {
  const concept = CONCEPTS.find(c => c.id === id);
  if (!concept) return;
  activePanelId = id;

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    populatePanel('bs', concept);
    document.getElementById('sheet-backdrop').style.display = 'block';
    document.getElementById('bottom-sheet').style.display = 'block';
    requestAnimationFrame(() => {
      document.getElementById('sheet-backdrop').classList.add('open');
      document.getElementById('bottom-sheet').classList.add('open');
    });
  } else {
    populatePanel('dp', concept);
    document.getElementById('side-panel').classList.remove('closed');
  }
}

function closeDesktopPanel() {
  document.getElementById('side-panel').classList.add('closed');
  activePanelId = null;
}

function closeMobileSheet() {
  document.getElementById('sheet-backdrop').classList.remove('open');
  document.getElementById('bottom-sheet').classList.remove('open');
  setTimeout(() => {
    document.getElementById('sheet-backdrop').style.display = '';
    document.getElementById('bottom-sheet').style.display = '';
  }, 300);
  activePanelId = null;
}

document.getElementById('dp-close').addEventListener('click', closeDesktopPanel);
document.getElementById('bs-close').addEventListener('click', closeMobileSheet);
document.getElementById('sheet-backdrop').addEventListener('click', closeMobileSheet);

// ── Reset ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', () => {
  state = { S:[], A:[], B:[], C:[], D:[], unranked: CONCEPTS.map(c => c.id) };
  closeDesktopPanel();
  closeMobileSheet();
  render();
});

// ── Download PNG ──────────────────────────────────────────────────────────────
document.getElementById('btn-download').addEventListener('click', async () => {
  const btn = document.getElementById('btn-download');
  btn.textContent = 'Generating…';
  btn.disabled = true;

  try {
    // Load html2canvas
    if (!window.html2canvas) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    // Temporarily close panel for cleaner screenshot
    const panelWasClosed = document.getElementById('side-panel').classList.contains('closed');
    if (!panelWasClosed) document.getElementById('side-panel').classList.add('closed');

    const el = document.getElementById('board');
    const canvas = await html2canvas(el, {
      backgroundColor: '#f0f2f5',
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
    });

    if (!panelWasClosed) document.getElementById('side-panel').classList.remove('closed');

    const a = document.createElement('a');
    a.download = 'system-design-tier-list.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch (err) {
    alert('Download failed. Please try again.');
  }

  btn.textContent = 'Download PNG';
  btn.disabled = false;
});

// ── Init ──────────────────────────────────────────────────────────────────────
buildTierRows();
render();