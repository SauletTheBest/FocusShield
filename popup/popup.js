document.addEventListener('DOMContentLoaded', async () => {
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');
  const siteCount = document.getElementById('site-count');

  // Load storage state
  const data = await browser.storage.local.get(['theme', 'blockedSites', 'isBlockingActive']);
  let currentTheme = data.theme || 'light';
  let blockedSites = data.blockedSites || [];
  let isBlockingActive = data.isBlockingActive !== false;

  applyTheme(currentTheme);
  updateStatusUI(isBlockingActive);
  renderList(blockedSites);

  // Theme switch logic
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', async () => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      await browser.storage.local.set({ theme: nextTheme });
    });
  }

  // Open Options page in new tab
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      browser.runtime.openOptionsPage();
    });
  }

  // Pause / Resume button handler
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (isBlockingActive) {
        browser.tabs.create({
          url: browser.runtime.getURL("views/challenge.html")
        });
      } else {
        isBlockingActive = true;
        browser.storage.local.set({ isBlockingActive: true });
        updateStatusUI(true);
      }
    });
  }

  // Storage listener
  browser.storage.onChanged.addListener((changes) => {
    if (changes.theme !== undefined) {
      applyTheme(changes.theme.newValue);
    }
    if (changes.isBlockingActive !== undefined) {
      isBlockingActive = changes.isBlockingActive.newValue;
      updateStatusUI(isBlockingActive);
    }
    if (changes.blockedSites !== undefined) {
      blockedSites = changes.blockedSites.newValue || [];
      renderList(blockedSites);
    }
  });

  function updateStatusUI(active) {
    if (!statusText || !statusDot || !pauseBtn) return;
    if (active) {
      statusText.textContent = "Protection Active";
      statusDot.classList.add('active');
      pauseBtn.textContent = "Pause";
    } else {
      statusText.textContent = "Protection Paused";
      statusDot.classList.remove('active');
      pauseBtn.textContent = "Resume";
    }
  }

  // Add site handler
  if (addBtn && siteInput) {
    const addDomain = async () => {
      const raw = siteInput.value.trim().toLowerCase();
      const domain = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (domain && !blockedSites.includes(domain)) {
        blockedSites.push(domain);
        await browser.storage.local.set({ blockedSites });
        siteInput.value = '';
        renderList(blockedSites);
      }
    };

    addBtn.addEventListener('click', addDomain);
    siteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addDomain();
    });
  }

  function renderList(sites) {
    if (!siteList || !siteCount) return;
    siteList.textContent = '';
    siteCount.textContent = sites.length;

    if (sites.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.style.color = 'var(--text-muted)';
      emptyLi.style.justifyContent = 'center';
      emptyLi.textContent = 'No sites blocked';
      siteList.appendChild(emptyLi);
      return;
    }

    sites.forEach((site, index) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = site;

      const btn = document.createElement('button');
      btn.className = 'delete-btn';
      btn.setAttribute('data-index', index);
      btn.textContent = '×';

      li.appendChild(span);
      li.appendChild(btn);
      siteList.appendChild(li);
    });

    siteList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        blockedSites.splice(idx, 1);
        await browser.storage.local.set({ blockedSites });
        renderList(blockedSites);
      });
    });
  }
});
