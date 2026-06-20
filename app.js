const DATA_URL = 'https://numerate64.github.io/worldcup2026/world-cup-2026.json';
const REFRESH_KEY = 'fifaKioskRefreshSeconds.v1';
const THEME_KEY = 'fifaKioskTheme.v1';
const SHOW_NON_COMPLETED_KEY = 'fifaKioskShowNonCompleted.v1';
const DISPLAY_ORDER_KEY = 'fifaKioskDisplayOrder.v1';
const MATCH_FILTER_KEY = 'fifaKioskMatchFilter.v1';
const DEFAULT_REFRESH_SECONDS = 3;

const FLAG_IMAGES = {
  Algeria: './flags/twemoji/1f1e9-1f1ff.svg',
  Argentina: './flags/twemoji/1f1e6-1f1f7.svg',
  Australia: './flags/twemoji/1f1e6-1f1fa.svg',
  Austria: './flags/twemoji/1f1e6-1f1f9.svg',
  Belgium: './flags/twemoji/1f1e7-1f1ea.svg',
  'Bosnia & Herzegovina': './flags/twemoji/1f1e7-1f1e6.svg',
  Brazil: './flags/twemoji/1f1e7-1f1f7.svg',
  'Cabo Verde': './flags/twemoji/1f1e8-1f1fb.svg',
  'Cape Verde': './flags/twemoji/1f1e8-1f1fb.svg',
  Canada: './flags/twemoji/1f1e8-1f1e6.svg',
  Colombia: './flags/twemoji/1f1e8-1f1f4.svg',
  Croatia: './flags/twemoji/1f1ed-1f1f7.svg',
  Curaçao: './flags/twemoji/1f1e8-1f1fc.svg',
  'Czech Republic': './flags/twemoji/1f1e8-1f1ff.svg',
  'DR Congo': './flags/twemoji/1f1e8-1f1e9.svg',
  Ecuador: './flags/twemoji/1f1ea-1f1e8.svg',
  Egypt: './flags/twemoji/1f1ea-1f1ec.svg',
  England: './flags/twemoji/1f3f4-e0067-e0062-e0065-e006e-e0067-e007f.svg',
  France: './flags/twemoji/1f1eb-1f1f7.svg',
  Germany: './flags/twemoji/1f1e9-1f1ea.svg',
  Ghana: './flags/twemoji/1f1ec-1f1ed.svg',
  Haiti: './flags/twemoji/1f1ed-1f1f9.svg',
  Iran: './flags/twemoji/1f1ee-1f1f7.svg',
  Iraq: './flags/twemoji/1f1ee-1f1f6.svg',
  'Ivory Coast': './flags/twemoji/1f1e8-1f1ee.svg',
  Japan: './flags/twemoji/1f1ef-1f1f5.svg',
  Jordan: './flags/twemoji/1f1ef-1f1f4.svg',
  Mexico: './flags/twemoji/1f1f2-1f1fd.svg',
  Morocco: './flags/twemoji/1f1f2-1f1e6.svg',
  Netherlands: './flags/twemoji/1f1f3-1f1f1.svg',
  'New Zealand': './flags/twemoji/1f1f3-1f1ff.svg',
  Norway: './flags/twemoji/1f1f3-1f1f4.svg',
  Panama: './flags/twemoji/1f1f5-1f1e6.svg',
  Paraguay: './flags/twemoji/1f1f5-1f1fe.svg',
  Portugal: './flags/twemoji/1f1f5-1f1f9.svg',
  Qatar: './flags/twemoji/1f1f6-1f1e6.svg',
  'Saudi Arabia': './flags/twemoji/1f1f8-1f1e6.svg',
  Scotland: './flags/twemoji/1f3f4-e0067-e0062-e0073-e0063-e0074-e007f.svg',
  Senegal: './flags/twemoji/1f1f8-1f1f3.svg',
  'South Africa': './flags/twemoji/1f1ff-1f1e6.svg',
  'South Korea': './flags/twemoji/1f1f0-1f1f7.svg',
  Spain: './flags/twemoji/1f1ea-1f1f8.svg',
  Sweden: './flags/twemoji/1f1f8-1f1ea.svg',
  Switzerland: './flags/twemoji/1f1e8-1f1ed.svg',
  Tunisia: './flags/twemoji/1f1f9-1f1f3.svg',
  Turkey: './flags/twemoji/1f1f9-1f1f7.svg',
  USA: './flags/twemoji/1f1fa-1f1f8.svg',
  Uruguay: './flags/twemoji/1f1fa-1f1fe.svg',
  Uzbekistan: './flags/twemoji/1f1fa-1f1ff.svg'
};

const elements = {
  grid: document.getElementById('scoreGrid'),
  template: document.getElementById('matchTemplate'),
  matchFilter: document.getElementById('matchFilter'),
  refreshSeconds: document.getElementById('refreshSeconds'),
  showNonCompleted: document.getElementById('showNonCompleted'),
  randomOrder: document.getElementById('randomOrder'),
  refreshNow: document.getElementById('refreshNow'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeLabel: document.getElementById('themeLabel'),
  loadStatus: document.getElementById('loadStatus'),
  lastUpdated: document.getElementById('lastUpdated'),
  statusDot: document.getElementById('statusDot')
};

let refreshTimer;
let requestInProgress = false;
let allMatches = [];
let matches = [];
let currentMatchIndex = 0;

function splitTeams(matchup = 'TBD vs TBD') {
  return matchup
    .replace(/^Third-place match:\s*/i, '')
    .split(/\s+vs\.?\s+/i)
    .map(team => team.trim())
    .slice(0, 2);
}

function scoreFor(match, side) {
  if (!match.score || typeof match.score !== 'object') return null;
  const value = match.score[side];
  return value === undefined || value === null || value === '' ? null : value;
}

function matchStatus(match) {
  if (match.status) return match.status;

  const kickoff = Date.parse(match.kickoffEt);
  if (!Number.isFinite(kickoff) || Date.now() < kickoff) return 'Scheduled';
  if (Date.now() < kickoff + (2 * 60 * 60 * 1000)) return 'Live';
  return 'Score pending';
}

function isCompleted(match) {
  return matchStatus(match).toLowerCase().includes('final')
    || (scoreFor(match, 'home') !== null && scoreFor(match, 'away') !== null);
}

function cardClass(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes('live')) return 'is-live';
  if (normalized.includes('final')) return 'is-final';
  return 'is-scheduled';
}

function displayDate(match) {
  const kickoff = new Date(match.kickoffEt);
  if (Number.isNaN(kickoff.getTime())) return match.date || 'Date TBD';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  }).format(kickoff);
}

function setFlag(element, team) {
  const imageUrl = FLAG_IMAGES[team];
  if (!imageUrl) {
    element.textContent = '⚽';
    return;
  }

  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = '';
  element.replaceChildren(image);
}

function createMatchCard(match) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  const [home = 'TBD', away = 'TBD'] = splitTeams(match.matchup);
  const homeScore = scoreFor(match, 'home');
  const awayScore = scoreFor(match, 'away');
  const hasScore = homeScore !== null && awayScore !== null;
  const status = matchStatus(match);

  card.classList.add(cardClass(status));
  card.querySelector('.stage').textContent = [match.stage, match.group].filter(Boolean).join(' · ');
  card.querySelector('.match-status').textContent = status;
  setFlag(card.querySelector('.team-home .flag'), home);
  setFlag(card.querySelector('.team-away .flag'), away);
  card.querySelector('.team-home .team-name').textContent = home;
  card.querySelector('.team-away .team-name').textContent = away;

  const score = card.querySelector('.score');
  if (hasScore) {
    card.querySelector('.home-score').textContent = homeScore;
    card.querySelector('.away-score').textContent = awayScore;
    score.setAttribute('aria-label', `${home} ${homeScore}, ${away} ${awayScore}`);
  } else {
    score.classList.add('pending');
    card.querySelector('.home-score').textContent = '';
    card.querySelector('.divider').textContent = 'VS';
    card.querySelector('.away-score').textContent = '';
    score.setAttribute('aria-label', `${home} versus ${away}`);
  }

  card.querySelector('.date-detail').textContent = displayDate(match);
  card.querySelector('.time-detail').textContent = match.timeEt || 'Time TBD';
  card.querySelector('.venue-detail').textContent = [match.venue, match.location].filter(Boolean).join(' · ') || 'Venue TBD';
  return card;
}

function sortMatches(nextMatches) {
  return [...nextMatches].sort((a, b) => {
    const aTime = Date.parse(a.kickoffEt) || Number.MAX_SAFE_INTEGER;
    const bTime = Date.parse(b.kickoffEt) || Number.MAX_SAFE_INTEGER;
    return aTime - bTime || String(a.id).localeCompare(String(b.id));
  });
}

function normalizedText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesTextFilter(match, query) {
  if (!query) return true;

  const kickoff = new Date(match.kickoffEt);
  const dateVariants = Number.isNaN(kickoff.getTime()) ? [] : [
    kickoff.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    }),
    kickoff.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    }),
    kickoff.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    })
  ];

  const searchable = normalizedText([
    match.matchup,
    match.venue,
    match.location,
    match.date,
    match.sourceDate,
    ...dateVariants
  ].filter(Boolean).join(' '));

  return normalizedText(query)
    .split(' ')
    .every(term => searchable.includes(term));
}

function renderCurrentMatch() {
  if (!matches.length) {
    const hasQuery = elements.matchFilter.value.trim();
    elements.grid.innerHTML = `<p class="empty-state">${
      hasQuery
        ? 'No matches found for that team, venue, or date.'
        : 'No completed matches are available yet.'
    }</p>`;
    setStatus(`0 matches shown · ${allMatches.length} total`);
    return;
  }

  currentMatchIndex = ((currentMatchIndex % matches.length) + matches.length) % matches.length;
  elements.grid.replaceChildren(createMatchCard(matches[currentMatchIndex]));

  const completed = allMatches.filter(isCompleted).length;
  setStatus(`Match ${currentMatchIndex + 1} of ${matches.length} · ${completed} completed`);
}

function applyMatchFilter(preferredMatchId) {
  const statusFilteredMatches = elements.showNonCompleted.checked
    ? [...allMatches]
    : allMatches.filter(isCompleted);
  matches = statusFilteredMatches.filter(match => matchesTextFilter(match, elements.matchFilter.value));

  const preferredIndex = preferredMatchId
    ? matches.findIndex(match => match.id === preferredMatchId)
    : -1;
  currentMatchIndex = preferredIndex >= 0 ? preferredIndex : 0;
  renderCurrentMatch();
}

function nextMatchIndex() {
  if (matches.length < 2) return 0;
  if (!elements.randomOrder.checked) {
    return (currentMatchIndex + 1) % matches.length;
  }

  const offset = 1 + Math.floor(Math.random() * (matches.length - 1));
  return (currentMatchIndex + offset) % matches.length;
}

function setStatus(message, isError = false) {
  elements.loadStatus.textContent = message;
  elements.statusDot.classList.toggle('error', isError);
}

async function loadMatches({ advance = false } = {}) {
  if (requestInProgress) return;
  requestInProgress = true;

  if (advance && matches.length) {
    currentMatchIndex = nextMatchIndex();
    renderCurrentMatch();
  }

  const currentMatchId = matches[currentMatchIndex]?.id;
  setStatus(advance ? 'Loading next match…' : 'Refreshing current match…');

  try {
    const url = new URL(DATA_URL);
    url.searchParams.set('_', Date.now());
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);

    const data = await response.json();
    if (!Array.isArray(data.matches)) throw new Error('The match feed has an unexpected format');

    allMatches = sortMatches(data.matches);
    applyMatchFilter(currentMatchId);

    const sourceTime = data.updatedAt ? new Date(data.updatedAt) : new Date();
    elements.lastUpdated.textContent = `Feed updated ${sourceTime.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    })}`;
  } catch (error) {
    setStatus(error.message || 'Unable to load match data', true);
    if (matches.length) {
      renderCurrentMatch();
    } else if (!elements.grid.children.length) {
      elements.grid.innerHTML = '<p class="empty-state">⚠️ Match data is temporarily unavailable. The kiosk will keep trying.</p>';
    }
  } finally {
    requestInProgress = false;
  }
}

function normalizeRefreshSeconds(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return DEFAULT_REFRESH_SECONDS;
  return Math.min(3600, Math.max(1, number));
}

function scheduleRefresh() {
  clearInterval(refreshTimer);
  const seconds = normalizeRefreshSeconds(elements.refreshSeconds.value);
  elements.refreshSeconds.value = seconds;
  localStorage.setItem(REFRESH_KEY, String(seconds));
  refreshTimer = setInterval(() => loadMatches({ advance: true }), seconds * 1000);
}

function applyTheme(theme, save = true) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  const isLight = nextTheme === 'light';
  document.documentElement.dataset.theme = nextTheme;
  elements.themeToggle.setAttribute('aria-pressed', String(isLight));
  elements.themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  elements.themeIcon.textContent = isLight ? '🌙' : '☀️';
  elements.themeLabel.textContent = isLight ? 'Dark' : 'Light';
  if (save) localStorage.setItem(THEME_KEY, nextTheme);
}

function initialize() {
  const savedRefresh = normalizeRefreshSeconds(localStorage.getItem(REFRESH_KEY));
  elements.refreshSeconds.value = savedRefresh;
  elements.showNonCompleted.checked = localStorage.getItem(SHOW_NON_COMPLETED_KEY) === 'true';
  elements.matchFilter.value = localStorage.getItem(MATCH_FILTER_KEY) || '';
  elements.randomOrder.checked = localStorage.getItem(DISPLAY_ORDER_KEY) === 'random';
  applyTheme(document.documentElement.dataset.theme, false);

  elements.refreshSeconds.addEventListener('change', scheduleRefresh);
  elements.refreshSeconds.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
      scheduleRefresh();
    }
  });
  elements.refreshNow.addEventListener('click', () => loadMatches());
  elements.matchFilter.addEventListener('input', () => {
    const currentMatchId = matches[currentMatchIndex]?.id;
    localStorage.setItem(MATCH_FILTER_KEY, elements.matchFilter.value);
    applyMatchFilter(currentMatchId);
  });
  elements.showNonCompleted.addEventListener('change', () => {
    const currentMatchId = matches[currentMatchIndex]?.id;
    localStorage.setItem(SHOW_NON_COMPLETED_KEY, String(elements.showNonCompleted.checked));
    applyMatchFilter(currentMatchId);
  });
  elements.randomOrder.addEventListener('change', () => {
    localStorage.setItem(
      DISPLAY_ORDER_KEY,
      elements.randomOrder.checked ? 'random' : 'sequential'
    );
  });
  elements.themeToggle.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });

  loadMatches();
  scheduleRefresh();
}

initialize();
