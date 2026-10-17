/**
 * Portfolio & Writeups Hub — Two-Column Workspace & Live GitHub REST API Reader
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
      description: 'Bandit wargame writeups'
    }),
    Object.freeze({
      id: 'picoctf',
      title: 'PicoCTF',
      repo: 'picoctf-writeups',
      accent: '#06b6d4',
      description: 'PicoCTF challenge writeups'
    }),
    Object.freeze({
      id: 'htb',
      title: 'HackTheBox',
      repo: 'htb-writeups',
      accent: '#9fef00',
      description: 'HackTheBox machine & challenge writeups'
    }),
    Object.freeze({
      id: 'tcm-peh',
      title: 'TCM Lab',
      repo: 'tcm-ad-homelab',
      accent: '#f43f5e',
      description: 'TCM Ethical Hacking course & lab notes'
    }),
    Object.freeze({
      id: 'leetcode',
      title: 'LeetCode',
      repo: 'leetcode-solutions',
      accent: '#f59e0b',
      description: 'Algorithmic problem solutions'
    }),
    Object.freeze({
      id: 'uwr-python',
      title: 'Python (II UWr)',
      repo: 'uwr-python-coursework',
      accent: '#8b5cf6',
      description: 'Semester 1 programming coursework'
    })
  ])
});

const IGNORED_FILES = new Set(['.DS_Store', '.gitkeep', '.gitignore']);

const TRACKED_REPOS = new Set(CONFIG.sections.map(s => s.repo));

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
  renderSectionIndexAndTelemetry();
  loadGitHubActivityFeed();
  initSearchFilter();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});

/**
 * Filter out system files and empty auto-generated initializer READMEs (< 200B)
 */
function isRealEntry(item) {
  if (!item || IGNORED_FILES.has(item.name)) return false;
  if (item.type === 'file' && item.name.toLowerCase() === 'readme.md' && item.size < 200) {
    return false;
  }
  return true;
}

function applyProfileLinks() {
  const githubUrl = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}`;
  const heroGithub = document.getElementById('hero-github');
  if (heroGithub) heroGithub.href = githubUrl;

  const heroHtb = document.getElementById('hero-htb');
  if (heroHtb) heroHtb.href = CONFIG.profiles.htb;

  const heroLeetcode = document.getElementById('hero-leetcode');
  if (heroLeetcode) heroLeetcode.href = CONFIG.profiles.leetcode;
}

function renderSectionIndexAndTelemetry() {
  const indexContainer = document.getElementById('sections-grid');
  if (!indexContainer) return;

  indexContainer.innerHTML = '';

  CONFIG.sections.forEach(sec => {
    const row = document.createElement('a');
    row.href = `#/section/${encodeURIComponent(sec.id)}`;
    row.className = 'repo-row';
    row.style.setProperty('--row-accent', sec.accent);
    row.setAttribute('role', 'listitem');

    const titleCol = document.createElement('div');
    titleCol.className = 'repo-row-title';

    const dot = document.createElement('span');
    dot.className = 'repo-dot';

    const titleText = document.createElement('span');
    titleText.textContent = sec.title;

    titleCol.append(dot, titleText);

    const descCol = document.createElement('div');
    descCol.className = 'repo-row-desc';
    descCol.textContent = sec.description;

    const metaCol = document.createElement('div');
    metaCol.className = 'repo-row-meta';
    metaCol.textContent = '0 entries';

    row.append(titleCol, descCol, metaCol);
    indexContainer.appendChild(row);

    fetchGitHubContents(sec.repo, '')
      .then(items => {
        if (Array.isArray(items)) {
          const visible = items.filter(isRealEntry);
          const count = visible.length;
          metaCol.textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
          updateProgressBarForSection(sec.id, visible);
        }
      })
      .catch(() => {
        metaCol.textContent = '0 entries';
      });
  });
}

function updateProgressBarForSection(sectionId, items) {
  const count = items.length;

  if (sectionId === 'overthewire') {
    const textEl = document.getElementById('prog-bandit-text');
    const barEl = document.getElementById('prog-bandit-bar');
    if (textEl) textEl.textContent = `${count} / 34`;
    if (barEl) {
      const pct = Math.max(0, Math.min(100, Math.round((count / 34) * 100)));
      barEl.style.width = `${pct}%`;
    }
  } else if (sectionId === 'picoctf') {
    const textEl = document.getElementById('prog-pico-text');
    const barEl = document.getElementById('prog-pico-bar');
    if (textEl) textEl.textContent = `${count}`;
    if (barEl) {
      const pct = Math.max(0, Math.min(100, count * 5));
      barEl.style.width = `${pct}%`;
    }
  } else if (sectionId === 'htb') {
    const textEl = document.getElementById('prog-htb-text');
    const barEl = document.getElementById('prog-htb-bar');
    if (textEl) textEl.textContent = `${count}`;
    if (barEl) {
      const pct = Math.max(0, Math.min(100, count * 10));
      barEl.style.width = `${pct}%`;
    }
  } else if (sectionId === 'tcm-peh') {
    const textEl = document.getElementById('prog-tcm-text');
    const barEl = document.getElementById('prog-tcm-bar');
    if (textEl) textEl.textContent = `${count}`;
    if (barEl) {
      const pct = Math.max(0, Math.min(100, count * 15));
      barEl.style.width = `${pct}%`;
    }
  }
}

async function loadGitHubActivityFeed() {
  const feedContainer = document.getElementById('github-activity-feed');
  if (!feedContainer) return;

  const url = `https://api.github.com/users/${encodeURIComponent(CONFIG.githubUsername)}/events/public?per_page=30`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const events = await res.json();

    // Only show real commits to the 6 tracked repositories (ignore repo initialization commits)
    const realCommits = [];
    for (const ev of events) {
      if (ev.type !== 'PushEvent' || !ev.repo || !ev.repo.name) continue;
      const repoShort = ev.repo.name.replace(`${CONFIG.githubUsername}/`, '');
      if (!TRACKED_REPOS.has(repoShort)) continue;

      const commits = (ev.payload && Array.isArray(ev.payload.commits)) ? ev.payload.commits : [];
      const nonInitCommits = commits.filter(c => c.message && !c.message.startsWith('chore: initialize repository'));
      if (nonInitCommits.length > 0) {
        realCommits.push({
          repoShort,
          fullRepo: ev.repo.name,
          message: nonInitCommits[nonInitCommits.length - 1].message.split('\n')[0],
          createdAt: ev.created_at
        });
      }
      if (realCommits.length >= 5) break;
    }

    if (realCommits.length === 0) {
      feedContainer.innerHTML = '<p class="muted-note">No commits yet.</p>';
      return;
    }

    feedContainer.innerHTML = '';

    realCommits.forEach(entry => {
      const item = document.createElement('a');
      item.className = 'activity-item';
      item.href = `https://github.com/${entry.fullRepo}`;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';

      const topLine = document.createElement('div');
      topLine.className = 'activity-top-line';

      const repoEl = document.createElement('span');
      repoEl.className = 'activity-repo';
      repoEl.textContent = entry.repoShort;

      const timeEl = document.createElement('span');
      timeEl.className = 'activity-time';
      timeEl.textContent = formatRelativeTime(entry.createdAt);

      topLine.append(repoEl, timeEl);

      const msgEl = document.createElement('div');
      msgEl.className = 'activity-msg';
      msgEl.textContent = entry.message;

      item.append(topLine, msgEl);
      feedContainer.appendChild(item);
    });
  } catch (_) {
    feedContainer.innerHTML = '<p class="muted-note">No commits yet.</p>';
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

  const titleEl = document.getElementById('section-title');
  const descEl = document.getElementById('section-description');
  const repoLinkEl = document.getElementById('section-repo-link');
  const searchInput = document.getElementById('file-search-input');
  const filesContainer = document.getElementById('section-files');

  if (titleEl) titleEl.textContent = section.title;
  if (descEl) descEl.textContent = section.description;
  if (searchInput) searchInput.value = '';
  if (repoLinkEl) {
    const subUrl = dirPath ? `/tree/HEAD/${encodePathSegments(dirPath)}` : '';
    repoLinkEl.href = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(section.repo)}${subUrl}`;
  }

  renderBreadcrumbs(section, dirPath);

  if (!filesContainer) return;
  renderStateBox(filesContainer, 'Loading files...');

  try {
    const items = await fetchGitHubContents(section.repo, dirPath);

    if (!Array.isArray(items)) {
      renderStateBox(filesContainer, 'No entries in this repository yet.');
      return;
    }

    const filtered = items.filter(isRealEntry);

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

      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = item.type === 'dir' ? `${item.name}/` : item.name;

      const right = document.createElement('span');
      right.className = 'file-row-right';
      right.textContent = item.type === 'dir' ? 'dir' : formatBytes(item.size);

      row.append(name, right);
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
  renderStateBox(contentEl, 'Loading file...');

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
  const cacheKey = `gh_cache_v7:${CONFIG.githubUsername}/${repo}:${path}`;

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

function renderStateBox(container, primaryText) {
  container.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'state-box';
  box.textContent = primaryText;
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
  if (diffSec < 60) return 'now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
