// Helper: Convert "HH:MM" string to total minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Check if current time falls within active schedule hours
function isWithinSchedule(activeDays, startTime, endTime) {
  // If no schedule parameters saved yet, default to active
  if (!activeDays || activeDays.length === 0 || !startTime || !endTime) {
    return true; 
  }

  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = dayNames[now.getDay()];

  // If today is NOT an active day selected in Options, schedule is inactive (unblock)
  if (!activeDays.includes(currentDay)) {
    return false;
  }

  // Convert current time and schedule bounds to numeric minutes
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin <= endMin) {
    return currentMinutes >= startMin && currentMinutes <= endMin;
  } else {
    // Overnight schedule (e.g. 22:00 to 06:00)
    return currentMinutes >= startMin || currentMinutes <= endMin;
  }
}

// Update dynamic declarativeNetRequest rules AND redirect open tabs
async function updateBlockingRules() {
  const data = await browser.storage.local.get([
    'blockedSites', 'isBlockingActive',
    'activeDays', 'startTime', 'endTime'
  ]);

  const blockedSites = data.blockedSites || [];
  const manualActive = data.isBlockingActive !== false;
  const scheduleActive = isWithinSchedule(
    data.activeDays,
    data.startTime,
    data.endTime
  );

  const shouldBlock = manualActive && scheduleActive;

  const currentRules = await browser.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = currentRules.map(rule => rule.id);

  if (!shouldBlock || blockedSites.length === 0) {
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds,
      addRules: []
    });
    return;
  }

  // 1. Update net request rules (blocking main_frame, sub_frame, xmlhttprequest, etc.)
  const newRules = blockedSites.map((domain, index) => {
    let cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    return {
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { extensionPath: "/views/blocked.html" }
      },
      condition: {
        urlFilter: `||${cleanDomain}`,
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other"]
      }
    };
  });

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds,
    addRules: newRules
  });

  // 2. Immediate redirect for any open matching tabs
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.url) {
      const isBlocked = blockedSites.some(site => {
        let clean = site.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        return tab.url.toLowerCase().includes(clean);
      });

      if (isBlocked && !tab.url.includes("views/blocked.html")) {
        browser.tabs.update(tab.id, {
          url: browser.runtime.getURL("views/blocked.html")
        });
      }
    }
  }
}

// Background alarm every 1 minute
browser.alarms.create("checkScheduleAlarm", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkScheduleAlarm") {
    updateBlockingRules();
  }
});

// Event listeners to wake up script instantly on tab actions
browser.tabs.onActivated.addListener(updateBlockingRules);
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    updateBlockingRules();
  }
});

// Listen for storage changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    updateBlockingRules();
  }
});

// Startup & install listeners
browser.runtime.onInstalled.addListener(async () => {
  const data = await browser.storage.local.get(['blockedSites', 'isBlockingActive']);
  if (!data.blockedSites) {
    await browser.storage.local.set({
      blockedSites: ['facebook.com', 'twitter.com', 'instagram.com'],
      isBlockingActive: true,
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '09:00',
      endTime: '17:00'
    });
  }
  updateBlockingRules();
});

browser.runtime.onStartup.addListener(updateBlockingRules);