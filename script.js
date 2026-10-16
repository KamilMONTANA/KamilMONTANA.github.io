/**
 * Portfolio & Writeups Hub — Live GitHub REST API Reader
 * Zero build step, pure vanilla JavaScript, automatic Markdown & code rendering.
 */

const CONFIG = Object.freeze({
  // Change this single field after updating your GitHub username
  githubUsername: 'KamilMONTANA',

  profiles: Object.freeze({
    htb: 'https://app.hackthebox.com',
    leetcode: 'https://leetcode.com/u/KamilMONTANA/'
  }),

  sections: Object.freeze([
    Object.freeze({
      id: 'overthewire',
      category: 'Wargames',
      title: 'OverTheWire',
      repo: 'overthewire-bandit',
      description: 'Linux command-line fundamentals, Bandit wargame solutions, shell pipelines, and file permissions.'
    }),
    Object.freeze({
      id: 'picoctf',
      category: 'CTF Writeups',
      title: 'PicoCTF',
      repo: 'picoctf-writeups',
      description: 'Challenge walkthroughs and solve scripts across Web Exploitation, Cryptography, and Forensics.'
    }),
    Object.freeze({
      id: 'htb',
      category: 'Retired Machines',
      title: 'HackTheBox',
      repo: 'htb-writeups',
      description: 'Reconnaissance, enumeration, and privilege escalation documentation for retired HTB boxes.'
    }),
    Object.freeze({
      id: 'tcm-peh',
      category: 'Active Directory Lab',
      title: 'TCM Ethical Hacking',
      repo: 'tcm-ad-homelab',
      description: 'Virtualized Windows Server AD homelab notes: LLMNR poisoning, AS-REP Roasting, Kerberoasting, and BloodHound.'
    }),
    Object.freeze({
      id: 'leetcode',
      category: 'Algorithms',
      title: 'LeetCode',
      repo: 'leetcode-solutions',
      description: 'Daily algorithmic problem solving and data structure implementations in Python (synced via LeetHub).'
    }),
    Object.freeze({
      id: 'uwr-python',
      category: 'II UWr · Semester 1',
      title: 'Python Coursework',
      repo: 'uwr-python-coursework',
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
  renderSectionCards();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});

/**
 * Sync header and hero profile links with CONFIG
 */
function applyProfileLinks() {
  const githubUrl = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}`;

  const navGithub = document.getElementById('nav-github');
  const heroGithub = document.getElementById('hero-github');
  if (navGithub) navGithub.href = githubUrl;
  if (heroGithub) heroGithub.href = githubUrl;

  const navHtb = document.getElementById('nav-htb');
  const heroHtb = document.getElementById('hero-htb');
  if (navHtb) navHtb.href = CONFIG.profiles.htb;
  if (heroHtb) heroHtb.href = CONFIG.profiles.htb;

  const navLeetcode = document.getElementById('nav-leetcode');
  const heroLeetcode = document.getElementById('hero-leetcode');
  if (navLeetcode) navLeetcode.href = CONFIG.profiles.leetcode;
  if (heroLeetcode) heroLeetcode.href = CONFIG.profiles.leetcode;
}

/**
 * Render the 6 section shortcut cards on the Home view
 */
function renderSectionCards() {
  const grid = document.getElementById('sections-grid');
  if (!grid) return;

  grid.innerHTML = '';

  CONFIG.sections.forEach(sec => {
    const card = document.createElement('a');
    card.href = `#/section/${encodeURIComponent(sec.id)}`;
    card.className = 'section-card';
    card.setAttribute('role', 'listitem');

    const top = document.createElement('div');
    top.className = 'card-top';

    const cat = document.createElement('span');
    cat.className = 'card-category';
    cat.textContent = sec.category;

    const title = document.createElement('div');
    title.className = 'card-title';
    const titleText = document.createElement('span');
    titleText.textContent = sec.title;
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    arrow.style.color = 'var(--text-muted)';
    title.append(titleText, arrow);

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = sec.description;

    top.append(cat, title, desc);

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const repoName = document.createElement('span');
    repoName.className = 'card-repo-name';
    repoName.textContent = `${CONFIG.githubUsername}/${sec.repo}`;
    footer.appendChild(repoName);

    card.append(top, footer);
    grid.appendChild(card);
  });
}

/**
 * Client-side hash router
 * Supported routes:
 *  - #/
 *  - #/section/:id
 *  - #/section/:id/dir/:encodedPath
 *  - #/section/:id/file/:encodedPath
 */
function handleRoute() {
  const rawHash = window.location.hash || '#/';
  const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) {
    switchActiveView('view-home');
    return;
  }

  if (parts[0] === 'section' && parts[1]) {
    const sectionId = decodeURIComponent(parts[1]);
    const section = CONFIG.sections.find(s => s.id === sectionId);

    if (!section) {
      switchActiveView('view-home');
      return;
    }

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

  switchActiveView('view-home');
}

/**
 * Toggle visibility between the 3 primary views
 */
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

  const navHome = document.getElementById('nav-home');
  if (navHome) {
    navHome.classList.toggle('active', viewId === 'view-home');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Load directory contents for a section (or subfolder) from GitHub API
 */
async function loadSectionView(section, dirPath) {
  switchActiveView('view-section');

  const titleEl = document.getElementById('section-title');
  const badgeEl = document.getElementById('section-repo-badge');
  const descEl = document.getElementById('section-description');
  const repoLinkEl = document.getElementById('section-repo-link');
  const filesContainer = document.getElementById('section-files');

  if (titleEl) titleEl.textContent = section.title;
  if (badgeEl) badgeEl.textContent = section.repo;
  if (descEl) descEl.textContent = section.description;
  if (repoLinkEl) {
    const subUrl = dirPath ? `/tree/HEAD/${encodePathSegments(dirPath)}` : '';
    repoLinkEl.href = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(section.repo)}${subUrl}`;
  }

  renderBreadcrumbs(section, dirPath);

  if (!filesContainer) return;
  renderStateBox(filesContainer, 'Fetching repository contents from GitHub...', `${CONFIG.githubUsername}/${section.repo}`);

  try {
    const items = await fetchGitHubContents(section.repo, dirPath);

    if (!Array.isArray(items)) {
      renderStateBox(
        filesContainer,
        'No entries published in this repository yet.',
        `Repository: github.com/${CONFIG.githubUsername}/${section.repo}`
      );
      return;
    }

    const filtered = items.filter(item => !IGNORED_FILES.has(item.name));

    if (filtered.length === 0) {
      renderStateBox(
        filesContainer,
        'No entries published in this repository yet.',
        `Push your first Markdown writeup or code file to ${CONFIG.githubUsername}/${section.repo} to see it here.`
      );
      return;
    }

    // Sort directories first, then natural alphanumeric order (e.g. level2 before level10)
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

      const icon = document.createElement('span');
      icon.className = 'file-icon';
      icon.textContent = item.type === 'dir' ? '📁' : '📄';

      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = item.type === 'dir' ? `${item.name}/` : item.name;

      left.append(icon, name);

      const right = document.createElement('span');
      right.className = 'file-row-right';
      right.textContent = item.type === 'dir' ? 'folder' : formatBytes(item.size);

      row.append(left, right);
      filesContainer.appendChild(row);
    });
  } catch (err) {
    if (err.status === 404) {
      renderStateBox(
        filesContainer,
        'No entries published in this repository yet.',
        `Create public repository "${CONFIG.githubUsername}/${section.repo}" on GitHub and push files to populate this section.`
      );
    } else {
      renderStateBox(
        filesContainer,
        'Could not load repository contents from GitHub API.',
        err.message || 'Check your connection or GitHub API rate limit.'
      );
    }
  }
}

/**
 * Render breadcrumb navigation for section & subdirectories
 */
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

/**
 * Load and render an individual Markdown writeup or source code file
 */
async function loadReaderView(section, filePath) {
  switchActiveView('view-reader');

  const backLink = document.getElementById('reader-back-link');
  const githubLink = document.getElementById('reader-github-link');
  const filepathEl = document.getElementById('reader-filepath');
  const filetypeEl = document.getElementById('reader-filetype');
  const contentEl = document.getElementById('reader-content');

  // Determine parent directory for the Back button
  const lastSlash = filePath.lastIndexOf('/');
  const parentDir = lastSlash > 0 ? filePath.slice(0, lastSlash) : '';
  if (backLink) {
    backLink.href = parentDir
      ? `#/section/${encodeURIComponent(section.id)}/dir/${encodeURIComponent(parentDir)}`
      : `#/section/${encodeURIComponent(section.id)}`;
    backLink.textContent = parentDir ? `← Back to ${parentDir}` : `← Back to ${section.title}`;
  }

  if (filepathEl) filepathEl.textContent = `${section.repo}/${filePath}`;

  const ext = getFileExtension(filePath);
  if (filetypeEl) {
    filetypeEl.textContent = ext === 'md' ? 'markdown' : (CODE_EXTENSIONS.get(ext) || ext || 'file');
  }

  if (githubLink) {
    githubLink.href = `https://github.com/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(section.repo)}/blob/HEAD/${encodePathSegments(filePath)}`;
  }

  if (!contentEl) return;
  renderStateBox(contentEl, 'Loading file from GitHub...', filePath);

  try {
    const fileData = await fetchGitHubContents(section.repo, filePath);

    if (!fileData || Array.isArray(fileData)) {
      renderStateBox(contentEl, 'File could not be displayed.', filePath);
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
  } catch (err) {
    renderStateBox(
      contentEl,
      'Could not load file from GitHub.',
      err.status === 404 ? 'File not found (404).' : (err.message || 'Check connection.')
    );
  }
}

/**
 * Render Markdown safely with DOMPurify and syntax highlighting
 */
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

  // Rewrite relative image paths so screenshots committed in the repo render properly
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

  // Highlight code blocks
  if (typeof hljs !== 'undefined') {
    container.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  }
}

/**
 * Render source code (.py, .sh, .c, etc.) inside a syntax-highlighted block
 */
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

/**
 * Fetch repository contents from GitHub REST API with sessionStorage cache
 */
async function fetchGitHubContents(repo, path = '') {
  const cleanPath = path ? `/${encodePathSegments(path)}` : '';
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(CONFIG.githubUsername)}/${encodeURIComponent(repo)}/contents${cleanPath}`;
  const cacheKey = `gh_cache:${CONFIG.githubUsername}/${repo}:${path}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (_) {
    // Ignore storage access errors
  }

  const response = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/vnd.github+json'
    }
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
  } catch (_) {
    // Ignore quota errors
  }

  return data;
}

/**
 * Decode UTF-8 text from GitHub API file object (base64 or download_url fallback)
 */
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

/**
 * Helper to render loading / empty / error boxes safely without innerHTML injection
 */
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
