document.addEventListener('DOMContentLoaded', async () => {
  const phraseBox = document.getElementById('challenge-phrase');
  const input = document.getElementById('challenge-input');
  const confirmBtn = document.getElementById('confirm-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const progressFill = document.getElementById('progress-fill');

  const defaultPhrases = [
    "I choose focus over distraction",
    "I will stay disciplined today",
    "Short term pleasure ruins long term goals",
    "Deep focus creates great results"
  ];

  // Fetch data from storage
  const data = await browser.storage.local.get(['theme', 'phrases', 'customPhrase']);

  if (data.theme) {
    document.documentElement.setAttribute('data-theme', data.theme);
  }

  let phrasePool = [];
  if (Array.isArray(data.phrases) && data.phrases.length > 0) {
    phrasePool = data.phrases.filter(p => p.enabled).map(p => p.text);
  }

  let target = "";
  if (phrasePool.length > 0) {
    target = phrasePool[Math.floor(Math.random() * phrasePool.length)];
  } else if (data.customPhrase && data.customPhrase.trim().length > 0) {
    target = data.customPhrase.trim();
  } else {
    target = defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
  }

  phraseBox.textContent = target;
  input.focus();

  // Handle typing progress
  input.addEventListener('input', () => {
    const typed = input.value.trim();
    const progress = Math.min((input.value.length / target.length) * 100, 100);
    progressFill.style.width = progress + '%';

    const isCorrect = typed === target;
    confirmBtn.disabled = !isCorrect;

    if (isCorrect) {
      input.classList.add('correct');
    } else {
      input.classList.remove('correct');
    }
  });

  async function closeCurrentTab() {
    try {
      const tab = await browser.tabs.getCurrent();
      if (tab && tab.id) {
        await browser.tabs.remove(tab.id);
      } else {
        window.close();
      }
    } catch (err) {
      window.close();
    }
  }

  cancelBtn.addEventListener('click', closeCurrentTab);

  confirmBtn.addEventListener('click', async () => {
    if (input.value.trim() === target) {
      await browser.storage.local.set({ isBlockingActive: false });
      await closeCurrentTab();
    }
  });
});
