document.addEventListener('DOMContentLoaded', async () => {
  // Built-in presets
  const DEFAULT_QUOTES = [
    { id: 'q1', text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell", enabled: true, isDefault: true },
    { id: 'q2', text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill", enabled: true, isDefault: true },
    { id: 'q3', text: "It is not that I am so smart, it is just that I stay with problems longer.", author: "Albert Einstein", enabled: true, isDefault: true },
    { id: 'q4', text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport", enabled: true, isDefault: true },
    { id: 'q5', text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", enabled: true, isDefault: true },
    { id: 'q6', text: "Where focus goes, energy flows.", author: "Tony Robbins", enabled: true, isDefault: true }
  ];

  const DEFAULT_PHRASES = [
    { id: 'p1', text: "I choose focus over distraction", enabled: true, isDefault: true },
    { id: 'p2', text: "I will stay disciplined today", enabled: true, isDefault: true },
    { id: 'p3', text: "Short term pleasure ruins long term goals", enabled: true, isDefault: true },
    { id: 'p4', text: "Deep focus creates great results", enabled: true, isDefault: true }
  ];

  // DOM Elements
  const html = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');

  // Schedule elements
  const dayChips = document.querySelectorAll('.day-chip');
  const startTimeInput = document.getElementById('start-time');
  const endTimeInput = document.getElementById('end-time');

  // Blocked Sites elements
  const optionsSiteInput = document.getElementById('options-site-input');
  const optionsAddBtn = document.getElementById('options-add-btn');
  const optionsSiteList = document.getElementById('options-site-list');
  const optionsSiteCount = document.getElementById('options-site-count');

  // Quotes elements
  const newQuoteText = document.getElementById('new-quote-text');
  const newQuoteAuthor = document.getElementById('new-quote-author');
  const addQuoteBtn = document.getElementById('add-quote-btn');
  const quotesListEl = document.getElementById('quotes-list');
  const quotesActiveCountEl = document.getElementById('quotes-active-count');

  // Phrases elements
  const newPhraseText = document.getElementById('new-phrase-text');
  const addPhraseBtn = document.getElementById('add-phrase-btn');
  const phrasesListEl = document.getElementById('phrases-list');
  const phrasesActiveCountEl = document.getElementById('phrases-active-count');

  // Right Panel Widget elements
  const liveStatusDot = document.getElementById('live-status-dot');
  const liveStatusTitle = document.getElementById('live-status-title');
  const liveStatusSubtitle = document.getElementById('live-status-subtitle');
  const quickToggleShieldBtn = document.getElementById('quick-toggle-shield-btn');
  const toggleShieldIcon = document.getElementById('toggle-shield-icon');
  const toggleShieldText = document.getElementById('toggle-shield-text');

  const statSitesCount = document.getElementById('stat-sites-count');
  const statDaysCount = document.getElementById('stat-days-count');
  const statQuotesCount = document.getElementById('stat-quotes-count');
  const statPhrasesCount = document.getElementById('stat-phrases-count');

  const previewQuoteBody = document.getElementById('preview-quote-body');
  const previewQuoteAuthor = document.getElementById('preview-quote-author');
  const shufflePreviewBtn = document.getElementById('shuffle-preview-btn');

  const saveBtn = document.getElementById('save-btn');
  const toast = document.getElementById('toast');

  // 1. Theme Management
  let currentTheme = 'light';
  function applyTheme(theme) {
    currentTheme = theme;
    html.setAttribute('data-theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
      themeToggleBtn.querySelector('.theme-label').textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', async () => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      await browser.storage.local.set({ theme: nextTheme });
    });
  }

  // 2. Sidebar Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const targetSection = document.getElementById(item.getAttribute('data-section'));
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // Load Data from Local Storage
  const data = await browser.storage.local.get([
    'theme', 'activeDays', 'startTime', 'endTime',
    'blockedSites', 'quotes', 'phrases', 'customQuote', 'customPhrase', 'isBlockingActive'
  ]);

  if (data.theme) {
    applyTheme(data.theme);
  }

  let isBlockingActive = data.isBlockingActive !== false; // default true
  let activeDays = data.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  let blockedSites = data.blockedSites || [];

  // Setup Quotes Array with Backwards Compatibility
  let quotes = data.quotes;
  if (!quotes || !Array.isArray(quotes) || quotes.length === 0) {
    quotes = [...DEFAULT_QUOTES];
    if (data.customQuote && data.customQuote.trim().length > 0) {
      quotes.unshift({
        id: 'legacy_custom_quote',
        text: data.customQuote.trim(),
        author: 'You',
        enabled: true,
        isDefault: false
      });
    }
  }

  // Setup Phrases Array with Backwards Compatibility
  let phrases = data.phrases;
  if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
    phrases = [...DEFAULT_PHRASES];
    if (data.customPhrase && data.customPhrase.trim().length > 0) {
      phrases.unshift({
        id: 'legacy_custom_phrase',
        text: data.customPhrase.trim(),
        enabled: true,
        isDefault: false
      });
    }
  }

  // Populate Schedule Form
  if (startTimeInput && data.startTime) startTimeInput.value = data.startTime;
  if (endTimeInput && data.endTime) endTimeInput.value = data.endTime;

  dayChips.forEach(chip => {
    const day = chip.getAttribute('data-day');
    if (activeDays.includes(day)) chip.classList.add('active');
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateStatsAndStatus();
    });
  });

  // Render Functions
  renderSiteList();
  renderQuotesList();
  renderPhrasesList();
  updateStatsAndStatus();

  // 3. Blocked Sites Operations
  if (optionsAddBtn && optionsSiteInput) {
    const addSite = () => {
      const raw = optionsSiteInput.value.trim().toLowerCase();
      const domain = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (domain && !blockedSites.includes(domain)) {
        blockedSites.push(domain);
        optionsSiteInput.value = '';
        renderSiteList();
        updateStatsAndStatus();
      }
    };

    optionsAddBtn.addEventListener('click', addSite);
    optionsSiteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addSite();
    });
  }

  function renderSiteList() {
    if (!optionsSiteList || !optionsSiteCount) return;
    optionsSiteList.textContent = '';
    optionsSiteCount.textContent = blockedSites.length;

    if (blockedSites.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-msg';
      emptyLi.textContent = 'No websites blocked yet. Add your first site above!';
      optionsSiteList.appendChild(emptyLi);
      return;
    }

    blockedSites.forEach((site, idx) => {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.textContent = site;

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.setAttribute('data-index', idx);
      delBtn.title = 'Remove Domain';
      delBtn.textContent = '×';

      li.appendChild(span);
      li.appendChild(delBtn);
      optionsSiteList.appendChild(li);
    });

    optionsSiteList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        blockedSites.splice(idx, 1);
        renderSiteList();
        updateStatsAndStatus();
      });
    });
  }

  // 4. Quotes Operations
  if (addQuoteBtn && newQuoteText) {
    addQuoteBtn.addEventListener('click', () => {
      const text = newQuoteText.value.trim();
      const author = newQuoteAuthor ? newQuoteAuthor.value.trim() : '';
      if (text.length > 0) {
        quotes.unshift({
          id: 'custom_quote_' + Date.now(),
          text: text,
          author: author || 'You',
          enabled: true,
          isDefault: false
        });
        newQuoteText.value = '';
        if (newQuoteAuthor) newQuoteAuthor.value = '';
        renderQuotesList();
        updateStatsAndStatus();
      }
    });
  }

  function renderQuotesList() {
    if (!quotesListEl) return;
    quotesListEl.textContent = '';
    const enabledCount = quotes.filter(q => q.enabled).length;
    if (quotesActiveCountEl) quotesActiveCountEl.textContent = `${enabledCount} Enabled`;

    if (quotes.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-msg';
      emptyLi.textContent = 'No quotes available. Add your first quote above!';
      quotesListEl.appendChild(emptyLi);
      return;
    }

    quotes.forEach((q, idx) => {
      const li = document.createElement('li');

      const itemLeft = document.createElement('div');
      itemLeft.className = 'item-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'item-checkbox';
      checkbox.setAttribute('data-idx', idx);
      checkbox.checked = !!q.enabled;

      const itemContent = document.createElement('div');
      itemContent.className = 'item-content';

      const textSpan = document.createElement('span');
      textSpan.className = 'item-text';
      textSpan.textContent = `"${q.text}"`;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'item-meta';
      metaSpan.textContent = `— ${q.author || 'Anonymous'} `;

      if (q.isDefault) {
        const presetTag = document.createElement('span');
        presetTag.className = 'preset-tag';
        presetTag.textContent = 'Preset';
        metaSpan.appendChild(presetTag);
      }

      itemContent.appendChild(textSpan);
      itemContent.appendChild(metaSpan);
      itemLeft.appendChild(checkbox);
      itemLeft.appendChild(itemContent);
      li.appendChild(itemLeft);

      if (!q.isDefault) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.setAttribute('data-delete-idx', idx);
        delBtn.title = 'Delete quote';
        delBtn.textContent = '×';
        li.appendChild(delBtn);
      }

      quotesListEl.appendChild(li);
    });

    quotesListEl.querySelectorAll('.item-checkbox').forEach(box => {
      box.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        quotes[idx].enabled = e.target.checked;
        if (quotesActiveCountEl) {
          const count = quotes.filter(item => item.enabled).length;
          quotesActiveCountEl.textContent = `${count} Enabled`;
        }
        updateStatsAndStatus();
      });
    });

    quotesListEl.querySelectorAll('[data-delete-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-delete-idx'), 10);
        quotes.splice(idx, 1);
        renderQuotesList();
        updateStatsAndStatus();
      });
    });
  }

  // 5. Phrases Operations
  if (addPhraseBtn && newPhraseText) {
    addPhraseBtn.addEventListener('click', () => {
      const text = newPhraseText.value.trim();
      if (text.length > 0) {
        phrases.unshift({
          id: 'custom_phrase_' + Date.now(),
          text: text,
          enabled: true,
          isDefault: false
        });
        newPhraseText.value = '';
        renderPhrasesList();
        updateStatsAndStatus();
      }
    });
  }

  function renderPhrasesList() {
    if (!phrasesListEl) return;
    phrasesListEl.textContent = '';
    const enabledCount = phrases.filter(p => p.enabled).length;
    if (phrasesActiveCountEl) phrasesActiveCountEl.textContent = `${enabledCount} Enabled`;

    if (phrases.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-msg';
      emptyLi.textContent = 'No challenge sentences available. Add one above!';
      phrasesListEl.appendChild(emptyLi);
      return;
    }

    phrases.forEach((p, idx) => {
      const li = document.createElement('li');

      const itemLeft = document.createElement('div');
      itemLeft.className = 'item-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'item-checkbox';
      checkbox.setAttribute('data-idx', idx);
      checkbox.checked = !!p.enabled;

      const itemContent = document.createElement('div');
      itemContent.className = 'item-content';

      const textSpan = document.createElement('span');
      textSpan.className = 'item-text';
      textSpan.textContent = p.text;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'item-meta';

      if (p.isDefault) {
        const presetTag = document.createElement('span');
        presetTag.className = 'preset-tag';
        presetTag.textContent = 'Preset';
        metaSpan.appendChild(presetTag);
      } else {
        metaSpan.textContent = 'Custom';
      }

      itemContent.appendChild(textSpan);
      itemContent.appendChild(metaSpan);
      itemLeft.appendChild(checkbox);
      itemLeft.appendChild(itemContent);
      li.appendChild(itemLeft);

      if (!p.isDefault) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.setAttribute('data-delete-idx', idx);
        delBtn.title = 'Delete sentence';
        delBtn.textContent = '×';
        li.appendChild(delBtn);
      }

      phrasesListEl.appendChild(li);
    });

    phrasesListEl.querySelectorAll('.item-checkbox').forEach(box => {
      box.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        phrases[idx].enabled = e.target.checked;
        if (phrasesActiveCountEl) {
          const count = phrases.filter(item => item.enabled).length;
          phrasesActiveCountEl.textContent = `${count} Enabled`;
        }
        updateStatsAndStatus();
      });
    });

    phrasesListEl.querySelectorAll('[data-delete-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-delete-idx'), 10);
        phrases.splice(idx, 1);
        renderPhrasesList();
        updateStatsAndStatus();
      });
    });
  }

  // 6. Right Panel Stats & Live Status Widget Update
  function updateStatsAndStatus() {
    const selectedDaysCount = document.querySelectorAll('.day-chip.active').length;
    const activeQuotesCount = quotes.filter(q => q.enabled).length;
    const activePhrasesCount = phrases.filter(p => p.enabled).length;

    if (statSitesCount) statSitesCount.textContent = blockedSites.length;
    if (statDaysCount) statDaysCount.textContent = selectedDaysCount;
    if (statQuotesCount) statQuotesCount.textContent = activeQuotesCount;
    if (statPhrasesCount) statPhrasesCount.textContent = activePhrasesCount;

    // Live status UI
    if (liveStatusDot && liveStatusTitle && liveStatusSubtitle) {
      if (isBlockingActive) {
        liveStatusDot.className = 'status-indicator active';
        liveStatusTitle.textContent = 'Protection Active';
        liveStatusSubtitle.textContent = `Restricting ${blockedSites.length} domain${blockedSites.length === 1 ? '' : 's'}`;
        if (toggleShieldIcon) toggleShieldIcon.textContent = '⏸️';
        if (toggleShieldText) toggleShieldText.textContent = 'Pause Shield';
      } else {
        liveStatusDot.className = 'status-indicator';
        liveStatusTitle.textContent = 'Protection Paused';
        liveStatusSubtitle.textContent = 'Site restrictions are currently offline';
        if (toggleShieldIcon) toggleShieldIcon.textContent = '▶️';
        if (toggleShieldText) toggleShieldText.textContent = 'Resume Shield';
      }
    }

    shufflePreviewQuote();
  }

  function shufflePreviewQuote() {
    const enabledQuotes = quotes.filter(q => q.enabled);
    if (enabledQuotes.length > 0 && previewQuoteBody && previewQuoteAuthor) {
      const picked = enabledQuotes[Math.floor(Math.random() * enabledQuotes.length)];
      previewQuoteBody.textContent = `"${picked.text}"`;
      previewQuoteAuthor.textContent = `— ${picked.author || 'Anonymous'}`;
    }
  }

  if (shufflePreviewBtn) {
    shufflePreviewBtn.addEventListener('click', shufflePreviewQuote);
  }

  // Master Shield Toggle Quick Action Button
  if (quickToggleShieldBtn) {
    quickToggleShieldBtn.addEventListener('click', async () => {
      if (isBlockingActive) {
        // Redirect to typing challenge page to require typing friction before pausing
        window.location.href = browser.runtime.getURL("views/challenge.html");
      } else {
        // Resume protection directly
        isBlockingActive = true;
        await browser.storage.local.set({ isBlockingActive: true });
        updateStatsAndStatus();
      }
    });
  }

  // Listen for storage changes from popup or challenge page
  browser.storage.onChanged.addListener((changes) => {
    if (changes.theme !== undefined) {
      applyTheme(changes.theme.newValue);
    }
    if (changes.isBlockingActive !== undefined) {
      isBlockingActive = changes.isBlockingActive.newValue;
      updateStatsAndStatus();
    }
    if (changes.blockedSites !== undefined) {
      blockedSites = changes.blockedSites.newValue || [];
      renderSiteList();
      updateStatsAndStatus();
    }
  });

  // 7. Save All Changes
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const selectedDays = Array.from(dayChips)
        .filter(c => c.classList.contains('active'))
        .map(c => c.getAttribute('data-day'));

      const startTimeVal = startTimeInput ? startTimeInput.value : '09:00';
      const endTimeVal = endTimeInput ? endTimeInput.value : '17:00';

      await browser.storage.local.set({
        theme: currentTheme,
        activeDays: selectedDays,
        startTime: startTimeVal,
        endTime: endTimeVal,
        blockedSites: blockedSites,
        quotes: quotes,
        phrases: phrases,
        isBlockingActive: isBlockingActive
      });

      showToast();
    });
  }

  function showToast() {
    if (!toast) return;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
  }
});
