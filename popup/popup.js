document.addEventListener('DOMContentLoaded', async () => {
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');
  const siteCount = document.getElementById('site-count');

  // Load initial storage state
  const data = await browser.storage.local.get(['blockedSites', 'isBlockingActive']);
  let blockedSites = data.blockedSites || [];
  let isBlockingActive = data.isBlockingActive !== false;

  updateStatusUI(isBlockingActive);
  renderList(blockedSites);

  // Open Options page in new tab when clicking ⚙️
  openSettingsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });

  // Pause / Resume button handler
  pauseBtn.addEventListener('click', () => {
    if (isBlockingActive) {
      // Open typing challenge in a new browser tab
      browser.tabs.create({
        url: browser.runtime.getURL("views/challenge.html")
      });
    } else {
      // Resume protection directly (no challenge needed to turn ON)
      isBlockingActive = true;
      browser.storage.local.set({ isBlockingActive });
      updateStatusUI(true);
    }
  });

  // Listen for storage changes (e.g. when challenge.js updates isBlockingActive)
  browser.storage.onChanged.addListener((changes) => {
    if (changes.isBlockingActive !== undefined) {
      isBlockingActive = changes.isBlockingActive.newValue;
      updateStatusUI(isBlockingActive);
    }
    if (changes.blockedSites !== undefined) {
      blockedSites = changes.blockedSites.newValue || [];
      renderList(blockedSites);
    }
  });

  // Update Status UI helper
  function updateStatusUI(active) {
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
  addBtn.addEventListener('click', async () => {
    const domain = siteInput.value.trim().toLowerCase();
    if (domain && !blockedSites.includes(domain)) {
      blockedSites.push(domain);
      await browser.storage.local.set({ blockedSites });
      siteInput.value = '';
      renderList(blockedSites);
    }
  });

  siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  // Render blocked site list helper
  function renderList(sites) {
    siteList.innerHTML = '';
    siteCount.textContent = sites.length;
    if (sites.length === 0) {
      siteList.innerHTML = '<li style="color: #64748b; justify-content: center;">No sites blocked</li>';
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

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = e.target.getAttribute('data-index');
        blockedSites.splice(idx, 1);
        await browser.storage.local.set({ blockedSites });
        renderList(blockedSites);
      });
    });
  }
});
