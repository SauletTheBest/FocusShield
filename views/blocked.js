document.addEventListener('DOMContentLoaded', async () => {
  const closeBtn = document.getElementById('close-tab-btn');
  const quoteText = document.getElementById('quote');

  // Fetch custom quote from storage
  const data = await browser.storage.local.get(['customQuote']);
  if (data.customQuote) {
    quoteText.textContent = `"${data.customQuote}"`;
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
