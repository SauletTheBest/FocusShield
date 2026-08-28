// Check if current time falls within active schedule hours
function isWithinSchedule(enableSchedule, activeDays, startTime, endTime) {
  // If schedule mode is disabled by user, return true (fall back to manual toggle)
  if (!enableSchedule) {
    return true; 
  }

  // If enabled but no times set yet, default to active
  if (!activeDays || activeDays.length === 0 || !startTime || !endTime) {
    return true; 
  }

  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = dayNames[now.getDay()];

  // If today is not an active day, schedule is inactive
  if (!activeDays.includes(currentDay)) {
    return false;
  }

  const currentHHMM = now.toTimeString().slice(0, 5);

  if (startTime <= endTime) {
    return currentHHMM >= startTime && currentHHMM <= endTime;
  } else {
    // Overnight schedule (e.g. 22:00 to 06:00)
    return currentHHMM >= startTime || currentHHMM <= endTime;
  }
}

// Update dynamic declarativeNetRequest rules AND redirect open tabs
async function updateBlockingRules() {
  const data = await browser.storage.local.get([
    'blockedSites', 'isBlockingActive',
    'enableSchedule', 'activeDays', 'startTime', 'endTime'
  ]);

  const blockedSites = data.blockedSites || [];
  const manualActive = data.isBlockingActive !== false;
  
  // Evaluate schedule logic
  const scheduleActive = isWithinSchedule(
    data.enableSchedule,
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

  // 1. Update dynamic rules
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
        resourceTypes: ["main_frame"]
      }
    };
  });

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds,
    addRules: newRules
  });

  // 2. Redirect open tabs matching blocked sites
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.url) {
      const isBlocked = blockedSites.some(site => {
        let clean = site.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        return tab.url.toLowerCase().includes(clean);
      });

      if (isBlocked && !tab.url.includes("blocked.html")) {
        browser.tabs.update(tab.id, {
          url: browser.runtime.getURL("views/blocked.html")
        });
      }
    }
  }
}

// Check schedule every minute
browser.alarms.create("checkScheduleAlarm", { periodInMinutes: 1 });

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkScheduleAlarm") {
    updateBlockingRules();
  }
});

// Storage changes listener
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    updateBlockingRules();
  }
});

// Set sensible defaults on install
browser.runtime.onInstalled.addListener(async () => {
  const data = await browser.storage.local.get(['blockedSites', 'isBlockingActive']);
  if (!data.blockedSites) {
    await browser.storage.local.set({
      blockedSites: ['facebook.com', 'twitter.com', 'instagram.com'],
      isBlockingActive: true,
      enableSchedule: false,
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '09:00',
      endTime: '17:00'
    });
  }
  updateBlockingRules();
});

browser.runtime.onStartup.addListener(updateBlockingRules);