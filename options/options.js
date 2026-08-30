document.addEventListener('DOMContentLoaded', async () => {
  // Navigation elements
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');

  // Schedule fields
  const dayChips = document.querySelectorAll('.day-chip');
  const startTimeInput = document.getElementById('start-time');
  const endTimeInput = document.getElementById('end-time');

  // Blocked Sites fields
  const optionsSiteInput = document.getElementById('options-site-input');
  const optionsAddBtn = document.getElementById('options-add-btn');
  const optionsSiteList = document.getElementById('options-site-list');
  const optionsSiteCount = document.getElementById('options-site-count');

  // Timer fields
  const presetBtns = document.querySelectorAll('.preset-btn');
  const customMinutesInput = document.getElementById('custom-minutes');

  // Quotes fields
  const customQuoteInput = document.getElementById('custom-quote');
  const quotePreviewText = document.getElementById('quote-preview-text');

  // Security fields
  const customPhraseInput = document.getElementById('custom-phrase');

  const saveBtn = document.getElementById('save-btn');
  const toast = document.getElementById('toast');

  // 1. Sidebar Tab Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const targetSection = document.getElementById(item.getAttribute('data-section'));
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // 2. Load stored settings
  const data = await browser.storage.local.get([
    'activeDays', 'startTime', 'endTime',
    'blockedSites', 'focusMinutes', 'customQuote', 'customPhrase'
  ]);

  // Schedule
  let activeDays = data.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  if (startTimeInput && data.startTime) startTimeInput.value = data.startTime;
  if (endTimeInput && data.endTime) endTimeInput.value = data.endTime;

  dayChips.forEach(chip => {
    const day = chip.getAttribute('data-day');
    if (activeDays.includes(day)) chip.classList.add('active');
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });

  // Blocked Sites
  let blockedSites = data.blockedSites || [];
  if (optionsSiteList && optionsSiteCount) {
    renderSiteList(blockedSites);
  }

  // Timer (safe check if timer section is in HTML)
  if (customMinutesInput && data.focusMinutes) {
    customMinutesInput.value = data.focusMinutes;
  }
  if (presetBtns) {
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (customMinutesInput) {
          customMinutesInput.value = btn.getAttribute('data-minutes');
        }
      });
    });
  }

  // Quotes
  if (customQuoteInput && data.customQuote) {
    customQuoteInput.value = data.customQuote;
    if (quotePreviewText) quotePreviewText.textContent = `"${data.customQuote}"`;
  }
  if (customQuoteInput) {
    customQuoteInput.addEventListener('input', () => {
      const text = customQuoteInput.value.trim();
      if (quotePreviewText) {
        quotePreviewText.textContent = text
          ? `"${text}"`
          : '"Concentrate all your thoughts upon the work in hand."';
      }
    });
  }

  // Security
  if (customPhraseInput && data.customPhrase) {
    customPhraseInput.value = data.customPhrase;
  }

  // 3. Blocked Sites Management
  if (optionsAddBtn) {
    optionsAddBtn.addEventListener('click', () => {
      const raw = optionsSiteInput.value.trim().toLowerCase();
      const domain = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (domain && !blockedSites.includes(domain)) {
        blockedSites.push(domain);
        optionsSiteInput.value = '';
        renderSiteList(blockedSites);
      }
    });
  }

  if (optionsSiteInput) {
    optionsSiteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && optionsAddBtn) optionsAddBtn.click();
    });
  }

  function renderSiteList(sites) {
    if (!optionsSiteList || !optionsSiteCount) return;

    optionsSiteList.innerHTML = '';
    optionsSiteCount.textContent = sites.length;

    if (sites.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-msg';
      li.textContent = 'No sites blocked yet.';
      optionsSiteList.appendChild(li);
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
      optionsSiteList.appendChild(li);
    });

    optionsSiteList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        blockedSites.splice(idx, 1);
        renderSiteList(blockedSites);
      });
    });
  }

  // 4. Save Handler
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const selectedDays = Array.from(dayChips)
        .filter(c => c.classList.contains('active'))
        .map(c => c.getAttribute('data-day'));

      const startTimeVal = startTimeInput ? startTimeInput.value : '09:00';
      const endTimeVal = endTimeInput ? endTimeInput.value : '17:00';
      const focusMins = customMinutesInput ? (parseInt(customMinutesInput.value, 10) || 25) : 25;
      const quoteVal = customQuoteInput ? customQuoteInput.value.trim() : '';
      const phraseVal = customPhraseInput ? customPhraseInput.value.trim() : '';

      await browser.storage.local.set({
        activeDays: selectedDays,
        startTime: startTimeVal,
        endTime: endTimeVal,
        blockedSites: blockedSites,
        focusMinutes: focusMins,
        customQuote: quoteVal,
        customPhrase: phraseVal
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
