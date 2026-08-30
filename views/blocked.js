document.addEventListener('DOMContentLoaded', async () => {
  const closeBtn = document.getElementById('close-tab-btn');
  const quoteText = document.getElementById('quote');
  const authorText = document.getElementById('author');

  // Built-in curated quotes with authors
  const quotes = [
    { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },
    { text: "It is not that I am so smart, it is just that I stay with problems longer.", author: "Albert Einstein" },
    { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
    { text: "My productivity secret: I create large uninterrupted blocks of time.", author: "Elon Musk" },
    { text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.", author: "Zig Ziglar" },
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { text: "One reason so few of us achieve what we truly want is that we never direct our focus.", author: "Tony Robbins" }
  ];

  // Fetch custom quote from storage
  const data = await browser.storage.local.get(['customQuote']);

  if (data.customQuote && data.customQuote.trim().length > 0) {
    // User has set a personal quote — display it without author attribution
    quoteText.textContent = `"${data.customQuote.trim()}"`;
    authorText.textContent = '— You';
  } else {
    // Pick a random quote from built-in list
    const picked = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = `"${picked.text}"`;
    authorText.textContent = `— ${picked.author}`;
  }

  closeBtn.addEventListener('click', async () => {
    try {
      const tab = await browser.tabs.getCurrent();
      if (tab && tab.id) {
        await browser.tabs.remove(tab.id);
      } else {
        window.close();
      }
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  });
});
