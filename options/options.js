document.addEventListener('DOMContentLoaded', async () => {
  // Navigation elements
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');

  // Form fields
  const enableScheduleToggle = document.getElementById('enable-schedule-toggle');
  const dayChips = document.querySelectorAll('.day-chip');
  const startTimeInput = document.getElementById('start-time');
  const endTimeInput = document.getElementById('end-time');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const customMinutesInput = document.getElementById('custom-minutes');
  const customQuoteInput = document.getElementById('custom-quote');
  const quotePreviewText = document.getElementById('quote-preview-text');
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
    'enableSchedule', 'activeDays', 'startTime', 'endTime',
    'focusMinutes', 'customQuote', 'customPhrase'
  ]);

  enableScheduleToggle.checked = !!data.enableSchedule;

  let activeDays = data.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  if (data.startTime) startTimeInput.value = data.startTime;
  if (data.endTime) endTimeInput.value = data.endTime;
  if (data.focusMinutes) customMinutesInput.value = data.focusMinutes;
  if (data.customQuote) {
    customQuoteInput.value = data.customQuote;
    quotePreviewText.textContent = `"${data.customQuote}"`;
  }
  if (data.customPhrase) customPhraseInput.value = data.customPhrase;

  // Highlight active days
  dayChips.forEach(chip => {
    const day = chip.getAttribute('data-day');
    if (activeDays.includes(day)) chip.classList.add('active');
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });

  // Pomodoro duration presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      customMinutesInput.value = btn.getAttribute('data-minutes');
    });
  });

  // Live quote preview update
  customQuoteInput.addEventListener('input', () => {
    const text = customQuoteInput.value.trim();
    quotePreviewText.textContent = text ? `"${text}"` : '"Concentrate all your thoughts upon the work in hand."';
  });

  // 3. Save Handler
  saveBtn.addEventListener('click', async () => {
    const selectedDays = Array.from(dayChips)
      .filter(c => c.classList.contains('active'))
      .map(c => c.getAttribute('data-day'));

    await browser.storage.local.set({
      enableSchedule: enableScheduleToggle.checked,
      activeDays: selectedDays,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
      focusMinutes: parseInt(customMinutesInput.value, 10) || 25,
      customQuote: customQuoteInput.value.trim(),
      customPhrase: customPhraseInput.value.trim()
    });

    showToast();
  });

  function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }
});
