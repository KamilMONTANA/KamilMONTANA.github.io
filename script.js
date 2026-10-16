/**
 * Portfolio & Writeups Hub — Live GitHub REST API Reader & Telemetry
 */

const CONFIG = Object.freeze({
  githubUsername: 'KamilMONTANA',

  profiles: Object.freeze({
    htb: 'https://app.hackthebox.com',
    leetcode: 'https://leetcode.com/u/KamilMONTANA/'
  }),

  sections: Object.freeze([
    Object.freeze({
      id: 'overthewire',
      title: 'OverTheWire',
      repo: 'overthewire-bandit',
      accent: '#10b981',
      description: 'Linux command-line fundamentals, Bandit wargame solutions, shell pipelines, and file permissions.'
    }),
    Object.freeze({
      id: 'picoctf',
      title: 'PicoCTF',
      repo: 'picoctf-writeups',
      accent: '#06b6d4',
      description: 'Challenge walkthroughs and solve scripts across Web Exploitation, Cryptography, and Forensics.'
    }),
    Object.freeze({
      id: 'htb',
      title: 'HackTheBox',
      repo: 'htb-writeups',
      accent: '#9fef00',
      description: 'Reconnaissance, enumeration, and privilege escalation documentation for retired HTB boxes.'
    }),
    Object.freeze({
      id: 'tcm-peh',
      title: 'TCM Ethical Hacking',
      repo: 'tcm-ad-homelab',
      accent: '#f43f5e',
      description: 'Virtualized Windows Server AD homelab notes: LLMNR poisoning, AS-REP Roasting, Kerberoasting, and BloodHound.'
    }),
    Object.freeze({
      id: 'leetcode',
      title: 'LeetCode',
      repo: 'leetcode-solutions',
      accent: '#f59e0b',
      description: 'Daily algorithmic problem solving and data structure implementations in Python (synced via LeetHub).'
    }),
    Object.freeze({
      id: 'uwr-python',
      title: 'Python Coursework (II UWr)',
      repo: 'uwr-python-coursework',
      accent: '#8b5cf6',
      description: 'Programming assignments, algorithmic exercises, and lab tasks from the University of Wrocław.'
    })
  ])
});

const IGNORED_FILES = new Set(['.DS_Store', '.gitkeep', '.gitignore']);

const CODE_EXTENSIONS = new Map([
  ['py', 'python'],
  ['sh', 'bash'],
  ['bash', 'bash'],
  ['c', 'c'],
  ['cpp', 'cpp'],
  ['h', 'c'],
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['json', 'json'],
  ['yaml', 'yaml'],
  ['yml', 'yaml'],
  ['sql', 'sql'],
  ['ps1', 'powershell'],
  ['txt', 'plaintext']
]);

document.addEventListener('DOMContentLoaded', () => {
  applyProfileLinks();
  renderSectionCardsAndTelemetry();
  loadGitHubActivityFeed();
  initSearchFilter();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});

function applyProfileLinks() {
  const githubUrl = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}`;

  const navGithub = document.getElementById('nav-github');
  const heroGithub = document.getElementById('hero-github');
  if (navGithub) navGithub.href = githubUrl;
  if (heroGithub) heroGithub.href = githubUrl;

  const heroHtb = document.getElementById('hero-htb');
  const panelHtb = document.getElementById('panel-htb-link');
  if (heroHtb) heroHtb.href = CONFIG.profiles.htb;
  if (panelHtb) panelHtb.href = CONFIG.profiles.htb;

  const heroLeetcode = document.getElementById('hero-leetcode');
  if (heroLeetcode) heroLeetcode.href = CONFIG.profiles.leetcode;
}

function renderSectionCardsAndTelemetry() {
  const grid = document.getElementById('sections-grid');
  if (!grid) return;

  grid.innerHTML = '';

  CONFIG.sections.forEach(sec => {
    const card = document.createElement('a');
    card.href = `#/section/${encodeURIComponent(sec.id)}`;
    card.className = 'section-card';
    card.style.setProperty('--card-accent', sec.accent);
    card.setAttribute('role', 'listitem');

    const top = document.createElement('div');
    top.className = 'card-top';

    const title = document.createElement('div');
    title.className = 'card-title';
    const titleText = document.createElement('span');
    titleText.textContent = sec.title;
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = '→';
    title.append(titleText, arrow);

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = sec.description;

    top.append(title, desc);

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const repoName = document.createElement('span');
    repoName.className = 'card-repo-name';
    repoName.textContent = sec.repo;

    const countText = document.createElement('span');
    countText.className = 'card-count-text';
    countText.textContent = '';

    footer.append(repoName, countText);
    card.append(top, footer);
    grid.appendChild(card);

    fetchGitHubContents(sec.repo, '')
      .then(items => {
        if (Array.isArray(items)) {
          const visible = items.filter(i => !IGNORED_FILES.has(i.name));
          const count = visible.length;
          countText.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;
          updateProgressBarForSection(sec.id, visible);
        }
      })
      .catch(() => {
        countText.textContent = '0 files';
      });
  });
}

function updateProgressBarForSection(sectionId, items) {
  const writeupEntries = items.filter(i => i.name.toLowerCase() !== 'readme.md');
  const count = writeupEntries.length;

  if (sectionId === 'overthewire') {
    const textEl = document.getElementById('prog-bandit-text');
    const barEl = document.getElementById('prog-bandit-bar');
    if (textEl) textEl.textContent = `${count} / 34`;
    if (barEl) {
      const pct = Math.max(4, Math.min(100, Math.round((count / 34) * 100)));
      barEl.style.width = `${pct}%`;
    }
  } else if (sectionId === 'picoctf') {
    const textEl = document.getElementById('prog-pico-text');
    const barEl = document.getElementById('prog-pico-bar');
    if (textEl) textEl.textContent = `${count} writeups`;
    if (barEl) {
      const pct = Math.max(4, Math.min(100, count * 5));
      barEl.style.width = `${pct}%`;
    }
  } else if (sectionId === 'htb') {
    const textEl = document.getElementById('prog-htb-text');
    const barEl = document.getElementById('prog-htb-bar');
    if (textEl) textEl.textContent = `${count} machines`;
    if (barEl) {
      const pct = Math.max(4, Math.min(100, count * 10));
      barEl.style.width = `${pct}%`;
    }
  } else if (sectionId === 'tcm-peh') {
    const textEl = document.getElementById('prog-tcm-text');
    const barEl = document.getElementById('prog-tcm-bar');
    if (textEl) textEl.textContent = `${count} notes`;
    if (barEl) {
      const pct = Math.max(4, Math.min(100, count * 15));
      barEl.style.width = `${pct}%`;
    }
  }
}

async function loadGitHubActivityFeed() {
  const feedContainer = document.getElementById('github-activity-feed');
  if (!feedContainer) return;

  const url = `https://api.github.com/users/${encodeURIComponent(CONFIG.githubUsername)}/events/public?per_page=15`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const events = await res.json();

    const pushEvents = events.filter(e => e.type === 'PushEvent' || e.type === 'CreateEvent').slice(0, 5);

    if (pushEvents.length === 0) {
      renderStateBox(feedContainer, 'No recent public commits yet.');
      return;
    }

    feedContainer.innerHTML = '';

    pushEvents.forEach(ev => {
      const item = document.createElement('a');
      item.className = 'activity-item';
      const repoShort = ev.repo && ev.repo.name ? ev.repo.name.replace(`${CONFIG.githubUsername}/`, '') : 'repository';
      item.href = `https://github.com/${ev.repo ? ev.repo.name : CONFIG.githubUsername}`;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';

      const left = document.createElement('div');
      left.className = 'activity-left';

      const repoEl = document.createElement('div');
      repoEl.className = 'activity-repo';
      repoEl.textContent = repoShort;

      const msgEl = document.createElement('div');
      msgEl.className = 'activity-msg';
      if (ev.type === 'PushEvent' && ev.payload && Array.isArray(ev.payload.commits) && ev.payload.commits.length > 0) {
        const lastCommit = ev.payload.commits[ev.payload.commits.length - 1];
        msgEl.textContent = lastCommit.message.split('\n')[0];
      } else if (ev.type === 'CreateEvent') {
        msgEl.textContent = `Initialized ${ev.payload.ref_type || 'repository'}`;
      } else {
        msgEl.textContent = 'Pushed update to main';
      }

      left.append(repoEl, msgEl);

      const timeEl = document.createElement('span');
      timeEl.className = 'activity-time';
      timeEl.textContent = formatRelativeTime(ev.created_at);

      item.append(left, timeEl);
      feedContainer.appendChild(item);
    });
  } catch (_) {
    renderStateBox(feedContainer, 'Could not fetch recent events.');
  }
}

function initSearchFilter() {
  const searchInput = document.getElementById('file-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#section-files .file-row');
    rows.forEach(row => {
      const nameEl = row.querySelector('.file-name');
      const name = nameEl ? nameEl.textContent.toLowerCase() : '';
      row.style.display = !query || name.includes(query) ? 'flex' : 'none';
    });
  });
}

function handleRoute() {
  const rawHash = window.location.hash || '#/';
  const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) {
    updateActiveNav('home');
    switchActiveView('view-home');
    return;
  }

  if (parts[0] === 'section' && parts[1]) {
    const sectionId = decodeURIComponent(parts[1]);
    const section = CONFIG.sections.find(s => s.id === sectionId);

    if (!section) {
      updateActiveNav('home');
      switchActiveView('view-home');
      return;
    }

    updateActiveNav(section.id);

    const mode = parts[2];
    const encodedTarget = parts.slice(3).join('/');
    const targetPath = encodedTarget ? decodeURIComponent(encodedTarget) : '';

    if (mode === 'file' && targetPath) {
      loadReaderView(section, targetPath);
    } else if (mode === 'dir' && targetPath) {
      loadSectionView(section, targetPath);
    } else {
      loadSectionView(section, '');
    }
    return;
  }

  updateActiveNav('home');
  switchActiveView('view-home');
}

function updateActiveNav(activeKey) {
  document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
    const key = link.getAttribute('data-nav');
    link.classList.toggle('active', key === activeKey);
  });
}

function switchActiveView(viewId) {
  const views = ['view-home', 'view-section', 'view-reader'];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === viewId) {
      el.hidden = false;
      el.classList.add('active');
    } else {
      el.hidden = true;
      el.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
}

async function loadSectionView(section, dirPath) {
  switchActiveView('view-section');

  const bannerEl = document.getElementById('section-banner');
  const titleEl = document.getElementById('section-title');
  const descEl = document.getElementById('section-description');
  const repoLinkEl = document.getElementById('section-repo-link');
  const searchInput = document.getElementById('file-search-input');
  const filesContainer = document.getElementById('section-files');

  if (bannerEl) bannerEl.style.setProperty('--section-accent', section.accent);
  if (titleEl) titleEl.textContent = section.title;
  if (descEl) descEl.textContent = section.description;
  if (searchInput) searchInput.value = '';
  if (repoLinkEl) {
    const subUrl = dirPath ? `/tree/HEAD/${encodePathSegments(dirPath)}` : '';
    repoLinkEl.href = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(section.repo)}${subUrl}`;
  }

  renderBreadcrumbs(section, dirPath);

  if (!filesContainer) return;
  renderStateBox(filesContainer, 'Loading files...', `${CONFIG.githubUsername}/${section.repo}`);

  try {
    const items = await fetchGitHubContents(section.repo, dirPath);

    if (!Array.isArray(items)) {
      renderStateBox(filesContainer, 'No entries in this repository yet.');
      return;
    }

    const filtered = items.filter(item => !IGNORED_FILES.has(item.name));

    if (filtered.length === 0) {
      renderStateBox(filesContainer, 'No entries in this repository yet.');
      return;
    }

    const sorted = [...filtered].sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
      return a.type === 'dir' ? -1 : 1;
    });

    filesContainer.innerHTML = '';

    sorted.forEach(item => {
      const row = document.createElement('a');
      row.className = 'file-row';

      const encodedItemPath = encodeURIComponent(item.path);
      if (item.type === 'dir') {
        row.href = `#/section/${encodeURIComponent(section.id)}/dir/${encodedItemPath}`;
      } else {
        row.href = `#/section/${encodeURIComponent(section.id)}/file/${encodedItemPath}`;
      }

      const left = document.createElement('div');
      left.className = 'file-row-left';

      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = item.type === 'dir' ? `${item.name}/` : item.name;

      left.appendChild(name);

      const right = document.createElement('span');
      right.className = 'file-row-right';
      right.textContent = item.type === 'dir' ? 'dir' : formatBytes(item.size);

      row.append(left, right);
      filesContainer.appendChild(row);
    });
  } catch (err) {
    renderStateBox(
      filesContainer,
      err.status === 404 ? 'No entries in this repository yet.' : 'Could not load repository contents.'
    );
  }
}

function renderBreadcrumbs(section, dirPath) {
  const nav = document.getElementById('section-breadcrumbs');
  if (!nav) return;

  nav.innerHTML = '';

  const rootLink = document.createElement('a');
  rootLink.href = '#/section/' + encodeURIComponent(section.id);
  rootLink.textContent = section.repo;

  if (!dirPath) {
    rootLink.className = 'current';
    nav.appendChild(rootLink);
    return;
  }

  nav.appendChild(rootLink);

  const segments = dirPath.split('/').filter(Boolean);
  let cumulativePath = '';

  segments.forEach((seg, idx) => {
    cumulativePath = cumulativePath ? `${cumulativePath}/${seg}` : seg;

    const sep = document.createElement('span');
    sep.className = 'sep';
    sep.textContent = '/';
    nav.appendChild(sep);

    if (idx === segments.length - 1) {
      const current = document.createElement('span');
      current.className = 'current';
      current.textContent = seg;
      nav.appendChild(current);
    } else {
      const link = document.createElement('a');
      link.href = `#/section/${encodeURIComponent(section.id)}/dir/${encodeURIComponent(cumulativePath)}`;
      link.textContent = seg;
      nav.appendChild(link);
    }
  });
}

async function loadReaderView(section, filePath) {
  switchActiveView('view-reader');

  const backLink = document.getElementById('reader-back-link');
  const githubLink = document.getElementById('reader-github-link');
  const filepathEl = document.getElementById('reader-filepath');
  const contentEl = document.getElementById('reader-content');

  const lastSlash = filePath.lastIndexOf('/');
  const parentDir = lastSlash > 0 ? filePath.slice(0, lastSlash) : '';
  if (backLink) {
    backLink.href = parentDir
      ? `#/section/${encodeURIComponent(section.id)}/dir/${encodeURIComponent(parentDir)}`
      : `#/section/${encodeURIComponent(section.id)}`;
    backLink.textContent = parentDir ? `← ${parentDir}` : `← ${section.title}`;
  }

  if (filepathEl) filepathEl.textContent = `${section.repo}/${filePath}`;

  const ext = getFileExtension(filePath);

  if (githubLink) {
    githubLink.href = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(section.repo)}/blob/HEAD/${encodePathSegments(filePath)}`;
  }

  if (!contentEl) return;
  renderStateBox(contentEl, 'Loading file...', filePath);

  try {
    const fileData = await fetchGitHubContents(section.repo, filePath);

    if (!fileData || Array.isArray(fileData)) {
      renderStateBox(contentEl, 'File could not be displayed.');
      return;
    }

    if (githubLink && fileData.html_url) {
      githubLink.href = fileData.html_url;
    }

    const rawText = await extractFileText(fileData);

    if (ext === 'md' || ext === 'markdown') {
      renderMarkdownContent(contentEl, rawText, fileData.download_url);
    } else {
      renderSourceCodeContent(contentEl, rawText, ext);
    }
  } catch (_) {
    renderStateBox(contentEl, 'Could not load file from GitHub.');
  }
}

function renderMarkdownContent(container, markdownText, downloadUrl) {
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    renderSourceCodeContent(container, markdownText, 'md');
    return;
  }

  const rawHtml = marked.parse(markdownText, { gfm: true, breaks: false });
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true }
  });

  container.innerHTML = cleanHtml;

  if (downloadUrl) {
    const baseRawDir = downloadUrl.slice(0, downloadUrl.lastIndexOf('/') + 1);
    container.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        const normalized = src.replace(/^\.\//, '');
        img.src = baseRawDir + normalized;
      }
    });
  }

  if (typeof hljs !== 'undefined') {
    container.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  }
}

function renderSourceCodeContent(container, codeText, ext) {
  container.innerHTML = '';
  const pre = document.createElement('pre');
  const code = document.createElement('code');

  const lang = CODE_EXTENSIONS.get(ext) || 'plaintext';
  code.className = `language-${lang}`;
  code.textContent = codeText;

  pre.appendChild(code);
  container.appendChild(pre);

  if (typeof hljs !== 'undefined') {
    hljs.highlightElement(code);
  }
}

async function fetchGitHubContents(repo, path = '') {
  const cleanPath = path ? `/${encodePathSegments(path)}` : '';
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(repo)}/contents${cleanPath}`;
  const cacheKey = `gh_cache:${CONFIG.githubUsername}/${repo}:${path}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 2 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (_) {}

  const response = await fetch(apiUrl, {
    headers: { 'Accept': 'application/vnd.github+json' }
  });

  if (!response.ok) {
    const error = new Error(`GitHub API returned status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (_) {}

  return data;
}

async function extractFileText(fileData) {
  if (fileData.content && fileData.encoding === 'base64') {
    const base64Clean = fileData.content.replace(/\s/g, '');
    const binaryString = atob(base64Clean);
    const bytes = Uint8Array.from(binaryString, ch => ch.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  if (fileData.download_url) {
    const res = await fetch(fileData.download_url);
    if (!res.ok) throw new Error(`Failed to fetch raw file (${res.status})`);
    return await res.text();
  }

  return '';
}

function renderStateBox(container, primaryText, secondaryText = '') {
  container.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'state-box';

  const p = document.createElement('p');
  p.textContent = primaryText;
  box.appendChild(p);

  if (secondaryText) {
    const sub = document.createElement('div');
    sub.className = 'state-sub';
    sub.textContent = secondaryText;
    box.appendChild(sub);
  }

  container.appendChild(box);
}

function encodePathSegments(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function getFileExtension(filename) {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
