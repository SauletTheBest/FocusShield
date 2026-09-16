document.addEventListener('DOMContentLoaded', async () => {
  const closeBtn = document.getElementById('close-tab-btn');
  const quoteText = document.getElementById('quote');
  const authorText = document.getElementById('author');

  const DEFAULT_QUOTES = [
    { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },
    { text: "It is not that I am so smart, it is just that I stay with problems longer.", author: "Albert Einstein" },
    { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "Where focus goes, energy flows.", author: "Tony Robbins" }
  ];

  // Fetch data from storage
  const data = await browser.storage.local.get(['theme', 'quotes', 'customQuote']);

  if (data.theme) {
    document.documentElement.setAttribute('data-theme', data.theme);
  }

  let quotesPool = [];

  if (Array.isArray(data.quotes) && data.quotes.length > 0) {
    // Filter only enabled quotes
    quotesPool = data.quotes.filter(q => q.enabled);
  }

  // Fallback if no enabled quotes exist
  if (quotesPool.length === 0) {
    if (data.customQuote && data.customQuote.trim().length > 0) {
      quotesPool = [{ text: data.customQuote.trim(), author: 'You' }];
    } else {
      quotesPool = DEFAULT_QUOTES;
    }
  }

  // Pick random quote
  const picked = quotesPool[Math.floor(Math.random() * quotesPool.length)];
  quoteText.textContent = `"${picked.text}"`;
  authorText.textContent = `— ${picked.author || 'Anonymous'}`;

  closeBtn.addEventListener('click', async () => {
    try {
      const tab = await browser.tabs.getCurrent();
      if (tab && tab.id) {
        await browser.tabs.remove(tab.id);
      } else {
        window.close();
      }
    } catch (error) {
      window.close();
    }
  });
});
