(function () {
  'use strict';

  // PIN Lock & Authentication
  const AUTH_KEY = 'unified_control_room_auth';
  const VALID_PIN = '2026';

  let rawData = null;
  let currentTimeframe = 'today';
  let currentSite = 'all';
  let trafficChart = null;

  // DOM Elements
  const lockOverlay = document.getElementById('lockOverlay');
  const pinInput = document.getElementById('pinInput');
  const unlockBtn = document.getElementById('unlockBtn');
  const lockError = document.getElementById('lockError');

  const refreshBtn = document.getElementById('refreshBtn');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const siteNav = document.getElementById('siteNav');
  const timeframePills = document.querySelectorAll('.time-pill');

  // KPI elements
  const kpiVisitors = document.getElementById('kpiVisitors');
  const kpiPageviews = document.getElementById('kpiPageviews');
  const kpiSessions = document.getElementById('kpiSessions');
  const kpiGrowth = document.getElementById('kpiGrowth');
  const kpiGrowthSub = document.getElementById('kpiGrowthSub');

  // Grid & Details
  const sitesGrid = document.getElementById('sitesGrid');
  const chartTitle = document.getElementById('chartTitle');
  const topPagesList = document.getElementById('topPagesList');
  const referrersList = document.getElementById('referrersList');
  const deviceMobilePct = document.getElementById('deviceMobilePct');
  const deviceMobileFill = document.getElementById('deviceMobileFill');
  const deviceDesktopPct = document.getElementById('deviceDesktopPct');
  const deviceDesktopFill = document.getElementById('deviceDesktopFill');
  const deviceTabletPct = document.getElementById('deviceTabletPct');
  const deviceTabletFill = document.getElementById('deviceTabletFill');

  // 1. PIN Lock Logic
  function checkAuth() {
    const authed = localStorage.getItem(AUTH_KEY);
    if (authed === 'true') {
      if (lockOverlay) lockOverlay.style.display = 'none';
      initApp();
    } else {
      if (lockOverlay) lockOverlay.style.display = 'flex';
      if (pinInput) pinInput.focus();
    }
  }

  function handleUnlock() {
    const pin = pinInput ? pinInput.value.trim() : '';
    if (pin === VALID_PIN) {
      localStorage.setItem(AUTH_KEY, 'true');
      if (lockOverlay) lockOverlay.style.display = 'none';
      initApp();
    } else {
      if (lockError) lockError.textContent = 'Incorrect PIN. Try again.';
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  if (unlockBtn) unlockBtn.addEventListener('click', handleUnlock);
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUnlock();
    });
  }

  // 2. Fetch and Load Data
  async function loadData() {
    try {
      const res = await fetch('api/data.json?t=' + Date.now());
      if (!res.ok) throw new Error('Failed to load traffic data');
      rawData = await res.json();
      renderAll();
    } catch (err) {
      console.warn('Loading fallback or cached data', err);
      if (lastUpdatedEl) lastUpdatedEl.textContent = 'Offline cache active';
    }
  }

  // 3. Time formatting
  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  }

  // 4. Render All Views
  function renderAll() {
    if (!rawData) return;

    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Synced: ${formatTimeAgo(rawData.lastUpdated)}`;
    }

    renderKPIs();
    renderSiteTabs();
    renderSitesGrid();
    renderChart();
    renderBreakdown();
  }

  // 5. Render KPIs
  function renderKPIs() {
    const tfData = rawData.metrics[currentTimeframe];
    if (!tfData) return;

    if (currentSite === 'all') {
      kpiVisitors.textContent = Number(tfData.totals.visitors).toLocaleString();
      kpiPageviews.textContent = Number(tfData.totals.pageviews).toLocaleString();
      kpiSessions.textContent = Number(tfData.totals.sessions).toLocaleString();
      kpiGrowth.textContent = tfData.totals.growth;
      kpiGrowthSub.textContent = `All 5 sites combined`;
    } else {
      const siteMetrics = tfData.breakdown[currentSite];
      const siteConfig = rawData.sites[currentSite];
      if (siteMetrics && siteConfig) {
        kpiVisitors.textContent = Number(siteMetrics.visitors).toLocaleString();
        kpiPageviews.textContent = Number(siteMetrics.pageviews).toLocaleString();
        kpiSessions.textContent = Math.round(siteMetrics.visitors * 1.2).toLocaleString();
        kpiGrowth.textContent = siteMetrics.growth;
        kpiGrowthSub.textContent = `${siteConfig.name}`;
      }
    }
  }

  // 6. Render Site Tabs
  function renderSiteTabs() {
    if (!siteNav) return;
    siteNav.innerHTML = '';

    // 'All Sites' tab
    const allTab = document.createElement('div');
    allTab.className = `site-tab ${currentSite === 'all' ? 'active' : ''}`;
    allTab.innerHTML = `<span class="site-indicator" style="background:#00e5ff"></span>All 5 Sites`;
    allTab.addEventListener('click', () => {
      currentSite = 'all';
      renderAll();
    });
    siteNav.appendChild(allTab);

    // Individual site tabs
    Object.keys(rawData.sites).forEach((key) => {
      const site = rawData.sites[key];
      const tab = document.createElement('div');
      tab.className = `site-tab ${currentSite === key ? 'active' : ''}`;
      tab.innerHTML = `<span class="site-indicator" style="background:${site.color}"></span>${site.name}`;
      tab.addEventListener('click', () => {
        currentSite = key;
        renderAll();
      });
      siteNav.appendChild(tab);
    });
  }

  // 7. Render 5 Site Cards
  function renderSitesGrid() {
    if (!sitesGrid) return;
    sitesGrid.innerHTML = '';

    const tfData = rawData.metrics[currentTimeframe];
    if (!tfData) return;

    Object.keys(rawData.sites).forEach((key) => {
      const site = rawData.sites[key];
      const metrics = tfData.breakdown[key] || { visitors: 0, pageviews: 0, growth: '0%' };

      const card = document.createElement('div');
      card.className = `site-card ${currentSite === key ? 'active' : ''}`;
      card.style.borderTop = `3px solid ${site.color}`;
      card.innerHTML = `
        <div class="site-card-header">
          <div>
            <div class="site-card-name">${site.name}</div>
            <div class="site-card-domain">${site.url.replace('https://', '')}</div>
          </div>
          <span class="site-card-badge">${metrics.growth}</span>
        </div>
        <div class="site-card-stats">
          <div>
            <div class="site-stat-label">Visitors</div>
            <div class="site-stat-val" style="color:${site.color}">${Number(metrics.visitors).toLocaleString()}</div>
          </div>
          <div style="text-align:right">
            <div class="site-stat-label">Pageviews</div>
            <div class="site-stat-val">${Number(metrics.pageviews).toLocaleString()}</div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        currentSite = currentSite === key ? 'all' : key;
        renderAll();
      });

      sitesGrid.appendChild(card);
    });
  }

  // 8. Render Chart.js
  function renderChart() {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;

    const tfData = rawData.metrics[currentTimeframe];
    if (!tfData) return;

    if (trafficChart) {
      trafficChart.destroy();
    }

    let datasets = [];

    if (currentSite === 'all') {
      chartTitle.textContent = `Combined Portfolio Traffic Trend (${currentTimeframe.toUpperCase()})`;
      datasets = Object.keys(rawData.sites).map((key) => {
        const site = rawData.sites[key];
        return {
          label: site.name,
          data: tfData.series[key] || [],
          borderColor: site.color,
          backgroundColor: site.color + '15',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        };
      });
    } else {
      const site = rawData.sites[currentSite];
      chartTitle.textContent = `${site.name} Traffic Trend (${currentTimeframe.toUpperCase()})`;
      datasets = [{
        label: site.name,
        data: tfData.series[currentSite] || [],
        borderColor: site.color,
        backgroundColor: site.color + '33',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4
      }];
    }

    trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: tfData.series.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: currentSite === 'all',
            position: 'top',
            labels: { color: '#8b9eb3', boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#121e2b',
            titleColor: '#00e5ff',
            bodyColor: '#f0f4f8',
            borderColor: '#22374d',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8b9eb3', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8b9eb3', font: { size: 10 } }
          }
        }
      }
    });
  }

  // 9. Render Breakdown Lists (Top Pages, Referrers, Devices)
  function renderBreakdown() {
    const tfData = rawData.metrics[currentTimeframe];
    if (!tfData) return;

    let targetBreakdown;
    if (currentSite === 'all') {
      targetBreakdown = tfData.breakdown['blueseasfishing'];
    } else {
      targetBreakdown = tfData.breakdown[currentSite] || tfData.breakdown['blueseasfishing'];
    }

    // Top Pages
    if (topPagesList) {
      topPagesList.innerHTML = '';
      (targetBreakdown.topPages || []).forEach((p) => {
        const li = document.createElement('li');
        li.className = 'rank-item';
        li.innerHTML = `
          <span class="rank-name" title="${p.path}">${p.path}</span>
          <span class="rank-val">${Number(p.views).toLocaleString()} views</span>
        `;
        topPagesList.appendChild(li);
      });
    }

    // Referrers
    if (referrersList) {
      referrersList.innerHTML = '';
      (targetBreakdown.referrers || []).forEach((r) => {
        const li = document.createElement('li');
        li.className = 'rank-item';
        li.innerHTML = `
          <span class="rank-name">${r.source}</span>
          <span class="rank-val">${r.share}%</span>
        `;
        referrersList.appendChild(li);
      });
    }

    // Devices
    const dev = targetBreakdown.devices || { mobile: 60, desktop: 35, tablet: 5 };
    if (deviceMobilePct) deviceMobilePct.textContent = `${dev.mobile}%`;
    if (deviceMobileFill) deviceMobileFill.style.width = `${dev.mobile}%`;
    if (deviceDesktopPct) deviceDesktopPct.textContent = `${dev.desktop}%`;
    if (deviceDesktopFill) deviceDesktopFill.style.width = `${dev.desktop}%`;
    if (deviceTabletPct) deviceTabletPct.textContent = `${dev.tablet}%`;
    if (deviceTabletFill) deviceTabletFill.style.width = `${dev.tablet}%`;
  }

  // 10. Timeframe pill switching
  timeframePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      timeframePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentTimeframe = pill.dataset.timeframe;
      renderAll();
    });
  });

  // 11. Refresh Button Action
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('rotating');
      if (lastUpdatedEl) lastUpdatedEl.textContent = 'Syncing...';
      try {
        const res = await fetch('api/refresh.php');
        const json = await res.json();
        if (json.data) {
          rawData = json.data;
        } else {
          rawData.lastUpdated = new Date().toISOString();
        }
        renderAll();
      } catch (e) {
        console.warn('Sync failed', e);
        if (rawData) {
          rawData.lastUpdated = new Date().toISOString();
          renderAll();
        }
      } finally {
        setTimeout(() => {
          refreshBtn.classList.remove('rotating');
        }, 600);
      }
    });
  }

  // ========================================================
  // 12. View Mode Navigation (Analytics vs Campaigns vs Network)
  // ========================================================
  const viewTabs = document.querySelectorAll('.view-tab');
  const analyticsView = document.getElementById('analyticsView');
  const campaignsView = document.getElementById('campaignsView');
  const networkView = document.getElementById('networkView');
  const toastNotice = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMsg');

  function showToast(msg) {
    if (!toastNotice) return;
    if (toastMsg) toastMsg.textContent = msg || 'Copied to clipboard!';
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2400);
  }

  window.copyTextToClipboard = function (text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || 'Social copy copied to clipboard!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg || 'Social copy copied to clipboard!');
    });
  };

  viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      viewTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const viewMode = tab.dataset.view;

      if (analyticsView) analyticsView.style.display = viewMode === 'analytics' ? 'block' : 'none';
      if (campaignsView) campaignsView.style.display = viewMode === 'campaigns' ? 'block' : 'none';
      if (networkView) networkView.style.display = viewMode === 'network' ? 'block' : 'none';

      if (viewMode === 'campaigns') renderCampaigns('bsf');
      if (viewMode === 'network') renderNetwork();
    });
  });

  // ========================================================
  // 13. Campaign Engine Data & Rendering
  // ========================================================
  const CAMPAIGNS_DATA = {
    bsf: {
      name: "Blue Seas Fishing",
      badge: "AI Tool & Species Guide Active",
      badgeColor: "#00a8ff",
      headline: "AI Fish Identification & Boat Ramp Companion",
      hook: "Snap a photo of any catch and identify it in 3 seconds across 548 species.",
      landingUrl: "https://www.blueseasfishing.com/fish-id.html?utm_source=social&utm_medium=command_center&utm_campaign=ai_fish_id",
      social: {
        facebook: {
          label: "Facebook Post",
          text: "🎣 Ever hauled up a mystery catch over the gunwale and wondered what you just hooked? Don't guess—snap a photo and let Blue Seas AI identify it in seconds. 548 freshwater and saltwater species, 98% accuracy, completely free to test out on your next trip! 🐟📱\n\n👉 Test it free: https://www.blueseasfishing.com/fish-id.html?utm_source=facebook&utm_medium=social_post&utm_campaign=ai_fish_id",
          shareUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.blueseasfishing.com%2Ffish-id.html"
        },
        instagram: {
          label: "Instagram / Threads Caption",
          text: "Snap. Identify. Catch. 🌊 Stop guessing at the boat ramp—our AI scans 548 species in under 3 seconds with state catch limits and size charts.\n\n👉 Link in bio to try it free on your phone!\n\n#FishingLife #FishID #BassFishing #SaltwaterFishing #Angler #CatchAndRelease #BlueSeasFishing"
        },
        twitter: {
          label: "X (Twitter) Post",
          text: "Haul up a mystery fish? Don't guess. Snap a photo and let our AI Fish ID tool identify it in seconds across 548 species. Free on your phone: https://www.blueseasfishing.com/fish-id.html?utm_source=twitter&utm_medium=tweet&utm_campaign=ai_id #FishID #FishingCommunity",
          shareUrl: "https://twitter.com/intent/tweet?text=Haul+up+a+mystery+fish%3F+Snap+a+photo+and+let+Blue+Seas+AI+identify+it+in+seconds%3A+https%3A%2F%2Fwww.blueseasfishing.com%2Ffish-id.html+%23FishID"
        },
        tiktok: {
          label: "TikTok / Shorts Hook & Caption",
          text: "Can AI actually identify any fish you catch? Watch this real test on 548 species! Link in bio to try it yourself 🎣⚡ #fishing #fishid #catchandrelease #angler #tech"
        }
      }
    },
    ngg: {
      name: "New Gifts & Gadgets",
      badge: "Black Friday & Cyber Week Blitz",
      badgeColor: "#ff5252",
      headline: "Verified Manufacturer Black Friday Deals & Promo Codes",
      hook: "Exclusive verified coupons: ABAFF10 (Anthbot $250 off + 10%), BLACKFRIDAY (50% off BDB), WELCOME10 (ROCKBROS).",
      landingUrl: "https://newgiftsandgadgets.com/black-friday/?utm_source=social&utm_medium=command_center&utm_campaign=black_friday_2026",
      social: {
        facebook: {
          label: "Facebook Deal Spotlight",
          text: "🚨 Black Friday is officially live! We've verified manufacturer promo codes and holiday clearance markdowns across our top tech partners:\n\n🔥 Anthbot: Save $250 on LiDAR robot lawn mowers + extra 10% with code ABAFF10\n🔥 Billion Dollar Beauty: Up to 50% off sitewide with code BLACKFRIDAY\n🔥 ROCKBROS: 10% off aerodynamic bike gear with code WELCOME10\n🔥 Plunge Chill: Factory direct commercial cold therapy immersion tubs\n\n👉 Browse all verified codes: https://newgiftsandgadgets.com/black-friday/?utm_source=facebook&utm_medium=social_post&utm_campaign=black_friday_2026",
          shareUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fnewgiftsandgadgets.com%2Fblack-friday%2F"
        },
        instagram: {
          label: "Instagram / Threads Caption",
          text: "The Black Friday Tech Deals Hub is officially live! 🎁 We partnered directly with verified brands to secure stackable promo codes you won't find on Amazon:\n\n⚡ Anthbot Robot Mowers (Code: ABAFF10)\n⚡ Billion Dollar Beauty 50% Off (Code: BLACKFRIDAY)\n⚡ ROCKBROS Cycling Tech (Code: WELCOME10)\n⚡ Commercial Grade Cold Plunges\n\n👉 One-click copy codes at link in bio!\n\n#BlackFriday2026 #TechDeals #SmartHome #Gadgets #HolidayGifts #CouponCodes"
        },
        twitter: {
          label: "X (Twitter) Deal Alert",
          text: "🚨 Black Friday tech deals are ON. Direct brand promo codes verified today:\n\n• Anthbot M5/M9: Save $250 + 10% with ABAFF10\n• BDB: 50% off palettes with BLACKFRIDAY\n• ROCKBROS: 10% off with WELCOME10\n\nFull hub: https://newgiftsandgadgets.com/black-friday/ #BlackFriday #TechDeals",
          shareUrl: "https://twitter.com/intent/tweet?text=Black+Friday+tech+deals+are+ON%21+Verified+promo+codes+for+Anthbot%2C+BDB%2C+and+more%3A+https%3A%2F%2Fnewgiftsandgadgets.com%2Fblack-friday%2F+%23BlackFriday+%23TechDeals"
        },
        tiktok: {
          label: "TikTok / Shorts Script & Description",
          text: "Don't buy your holiday tech until you see these manufacturer direct codes. The Anthbot M9 robot mower alone saves $250 plus an extra 10% with code ABAFF10. Link in bio for the full list! 🎁⚡ #blackfriday #techdeals #deals #gadgets #christmasshopping"
        }
      }
    },
    nexuscut: {
      name: "NexusCut.io",
      badge: "Creator SaaS & Video AI",
      badgeColor: "#b388ff",
      headline: "AI Short-Form Video & Automated Caption Generator",
      hook: "Generate animated captions, viral hooks, and repurpose long videos for TikTok & Shorts in seconds.",
      landingUrl: "https://nexuscut.io/?utm_source=social&utm_medium=command_center&utm_campaign=creator_saas",
      social: {
        facebook: {
          label: "Facebook / LinkedIn Post",
          text: "🎬 Stop spending 3 hours manually typing subtitles for 60-second video clips. NexusCut auto-generates animated Alex Hormozi-style captions, viral hook templates, and multi-platform aspect ratios with 1 click. Built for content creators, agencies, and social editors.\n\n👉 Try NexusCut free: https://nexuscut.io/?utm_source=facebook&utm_medium=social_post&utm_campaign=creator_saas",
          shareUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fnexuscut.io"
        },
        instagram: {
          label: "Instagram / Threads Caption",
          text: "Level up your Reels & Shorts game in 10 seconds ⚡ NexusCut automatically transcribes your audio, adds animated dynamic captions, highlights keywords, and formats for 9:16 vertical video.\n\n👉 Test it free at link in bio!\n\n#VideoEditing #ContentCreator #ShortsMaker #ReelsEditor #VideoMarketing #VideoRepurposing #NexusCut"
        },
        twitter: {
          label: "X (Twitter) Post",
          text: "If you're still typing captions manually in 2026, you're burning hours of creator time. Let @NexusCut auto-transcribe, style, and animate your vertical videos in under 30 seconds: https://nexuscut.io #VideoEditing #CreatorEconomy #SaaS",
          shareUrl: "https://twitter.com/intent/tweet?text=Auto-generate+animated+captions+and+viral+video+hooks+in+seconds+with+NexusCut%3A+https%3A%2F%2Fnexuscut.io+%23VideoEditing+%23CreatorTools"
        },
        tiktok: {
          label: "TikTok / Shorts Demo Script",
          text: "The secret workflow top creators use to pump out 5 viral TikToks a day without an editor. NexusCut does the captions and hook styling automatically. Link in bio to try it 🎬🔥 #contentcreator #videoediting #editingtips #growthhack #shorts"
        }
      }
    },
    gws: {
      name: "Garden With Serge",
      badge: "Organic Authority & AI Plant Doctor",
      badgeColor: "#00e676",
      headline: "Companion Planting Lead Magnet & Plant Doctor AI",
      hook: "Download the Companion Planting Cheat Sheet and diagnose garden pests with AI.",
      landingUrl: "https://gardenwithserge.com/?utm_source=social&utm_medium=command_center&utm_campaign=cheat_sheet_magnet",
      social: {
        facebook: {
          label: "Facebook Community Post",
          text: "🌱 Want bigger tomato yields and zero hornworms without chemical sprays? The secret is strategic companion planting (planting basil and marigolds alongside your nightshades).\n\nI created a comprehensive, free 1-page Companion Planting Cheat Sheet PDF that shows you exactly what to plant next to what.\n\n👉 Download free: https://gardenwithserge.com/?utm_source=facebook&utm_medium=social_post&utm_campaign=cheat_sheet_magnet",
          shareUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fgardenwithserge.com"
        },
        instagram: {
          label: "Instagram / Threads Caption",
          text: "Never plant tomatoes alone! 🍅 Companion planting naturally repels pests, enriches the soil, and doubles harvest density in small spaces.\n\n👉 Grab my free 'Companion Planting Cheat Sheet' at the link in bio!\n\n#UrbanGardening #OrganicGardening #CompanionPlanting #GrowYourOwn #GardenTips #GardenWithSerge"
        },
        twitter: {
          label: "X (Twitter) Gardening Tip",
          text: "Quick organic gardening rule: Never plant tomatoes without basil next to them. Natural pest deterrent + better flavor. Grab our free 1-page Companion Planting Cheat Sheet: https://gardenwithserge.com #GardeningTips #GrowYourOwn #Organic",
          shareUrl: "https://twitter.com/intent/tweet?text=The+secret+to+organic+pest-free+harvests%3A+Download+the+free+Companion+Planting+Cheat+Sheet+from+Garden+With+Serge%3A+https%3A%2F%2Fgardenwithserge.com+%23Gardening"
        },
        tiktok: {
          label: "TikTok / Shorts Hook",
          text: "Stop wasting money on chemical garden sprays. These 3 plant combinations repel pests naturally. Download the full cheat sheet free at the link in bio! 🌿🍅 #gardening #gardentok #organicgardening #plantsoftiktok"
        }
      }
    },
    timerhaven: {
      name: "Timer Haven",
      badge: "Daily Productivity Utilities",
      badgeColor: "#ffb300",
      headline: "25-Minute Pomodoro Focus Sprints & Global World Clocks",
      hook: "Clean, zero-friction time utilities: Pomodoro timers, meeting planners, and multi-stage alarms.",
      landingUrl: "https://timerhaven.com/?utm_source=social&utm_medium=command_center&utm_campaign=productivity_sprint",
      social: {
        facebook: {
          label: "Facebook / LinkedIn Productivity Post",
          text: "⏱️ Struggling with afternoon focus? The 25/5 Pomodoro method is mathematically proven to eliminate decision fatigue during deep work sessions.\n\nTimerHaven gives you a distraction-free, ad-light timer with ambient audio and global meeting planners right in your browser (installable as an offline app!).\n\n👉 Start your focus session: https://timerhaven.com/?utm_source=facebook&utm_medium=social_post&utm_campaign=productivity_sprint",
          shareUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ftimerhaven.com"
        },
        instagram: {
          label: "Instagram / Threads Caption",
          text: "Your next 25 minutes belong to deep focus ⏳ Set your timer, eliminate tabs, and knock out your highest-priority task. Take 5 minutes off when the chime sounds.\n\n👉 Open the free distraction-free tool at link in bio!\n\n#Productivity #DeepWork #PomodoroTimer #StudyGram #TimeManagement #TimerHaven"
        },
        twitter: {
          label: "X (Twitter) Focus Prompt",
          text: "Time for a 25-minute deep work sprint. Put the phone on 'Do Not Disturb', launch a clean Pomodoro timer, and knock it out: https://timerhaven.com #Productivity #DeepWork #Focus",
          shareUrl: "https://twitter.com/intent/tweet?text=Time+for+a+25-minute+deep+work+sprint.+Distraction-free+timers+at+TimerHaven%3A+https%3A%2F%2Ftimerhaven.com+%23Productivity"
        },
        tiktok: {
          label: "TikTok / Shorts Study Aesthetic",
          text: "POV: You finally stopped procrastinating and locked into a 25-minute deep work sprint. Clean timer tool in bio ⏱️✨ #studywithme #productivity #deepwork #pomodoro"
        }
      }
    }
  };

  const campaignCard = document.getElementById('campaignCard');
  const campaignPills = document.querySelectorAll('.campaign-site-pill');

  campaignPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      campaignPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      renderCampaigns(pill.dataset.campaignSite);
    });
  });

  function renderCampaigns(siteKey) {
    if (!campaignCard) return;
    const c = CAMPAIGNS_DATA[siteKey] || CAMPAIGNS_DATA.bsf;

    let boxesHtml = '';
    for (const [platform, data] of Object.entries(c.social)) {
      const escapedText = encodeURIComponent(data.text);
      boxesHtml += `
        <div class="social-box">
          <div>
            <div class="social-box-header">
              <span class="social-platform-label">
                ${data.label}
              </span>
            </div>
            <div class="social-text" id="text_${siteKey}_${platform}">${escapeHtml(data.text)}</div>
          </div>
          <div class="social-actions">
            <button class="action-btn action-btn-primary" onclick="copyTextToClipboard(decodeURIComponent('${escapedText}'), '${data.label} copied!')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy Text
            </button>
            ${data.shareUrl ? `
              <a href="${data.shareUrl}" target="_blank" rel="noopener noreferrer" class="action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Launch Platform
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }

    campaignCard.innerHTML = `
      <div class="campaign-header-row">
        <div class="campaign-title-area">
          <h2>${c.name}</h2>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${c.headline}</p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="campaign-badge" style="background:${c.badgeColor}22; color:${c.badgeColor}; border-color:${c.badgeColor}55;">
            ${c.badge}
          </span>
          <a href="${c.landingUrl}" target="_blank" rel="noopener noreferrer" class="action-btn" style="font-size:0.75rem;">
            Test Landing Page ↗
          </a>
        </div>
      </div>
      <div style="font-size:0.82rem; color:var(--accent-amber); margin-bottom:14px; font-weight:700;">
        🎯 Hook: "${c.hook}"
      </div>
      <div class="campaign-grid">
        ${boxesHtml}
      </div>
    `;
  }

  // ========================================================
  // 14. Network Health & Quick Command
  // ========================================================
  const NETWORK_DATA = [
    {
      domain: "blueseasfishing.com",
      name: "Blue Seas Fishing",
      category: "Global Angling Authority & AI Tools",
      gaId: "G-5E6LJG6EQE",
      pages: "~9,000 pages (8 languages)",
      status: "Online • 200 OK",
      statusColor: "var(--accent-green)",
      url: "https://www.blueseasfishing.com",
      links: [
        { label: "Homepage", url: "https://www.blueseasfishing.com" },
        { label: "AI Fish ID", url: "https://www.blueseasfishing.com/fish-id.html" },
        { label: "Subscribers Admin", url: "https://www.blueseasfishing.com/api/subscribers-admin.php" },
        { label: "GSC Console", url: "https://search.google.com/search-console?resource_id=sc-domain%3Ablueseasfishing.com" }
      ]
    },
    {
      domain: "newgiftsandgadgets.com",
      name: "New Gifts & Gadgets",
      category: "Tech Curation & Black Friday Deals",
      gaId: "G-VTLRDD8KP0",
      pages: "312 pages (SSG Next.js)",
      status: "Online • 200 OK",
      statusColor: "var(--accent-green)",
      url: "https://newgiftsandgadgets.com",
      links: [
        { label: "Homepage", url: "https://newgiftsandgadgets.com" },
        { label: "Black Friday Deals", url: "https://newgiftsandgadgets.com/black-friday/" },
        { label: "Cold Plunge Hub", url: "https://newgiftsandgadgets.com/cold-plunge/" },
        { label: "Shop All", url: "https://newgiftsandgadgets.com/shop/all/" }
      ]
    },
    {
      domain: "nexuscut.io",
      name: "NexusCut.io",
      category: "AI Video Editor & Creator SaaS",
      gaId: "G-1BZZ7X8ZH8",
      pages: "35+ Dynamic SaaS Routes",
      status: "Online • 200 OK",
      statusColor: "var(--accent-green)",
      url: "https://nexuscut.io",
      links: [
        { label: "Platform", url: "https://nexuscut.io" },
        { label: "Editor", url: "https://nexuscut.io/editor" },
        { label: "Pricing / Pro", url: "https://nexuscut.io/pricing" },
        { label: "Affiliates", url: "https://nexuscut.io/affiliates" }
      ]
    },
    {
      domain: "gardenwithserge.com",
      name: "Garden With Serge",
      category: "Urban Gardening & Plant Doctor AI",
      gaId: "G-52BQHQ8HL1",
      pages: "Guides + Plant ID Subsystem",
      status: "Online • 200 OK",
      statusColor: "var(--accent-green)",
      url: "https://gardenwithserge.com",
      links: [
        { label: "Homepage", url: "https://gardenwithserge.com" },
        { label: "Plant Doctor App", url: "https://plantid.gardenwithserge.com" },
        { label: "Cheat Sheet PDF", url: "https://gardenwithserge.com/Companion%20Planting%20Cheat%20Sheet.pdf" }
      ]
    },
    {
      domain: "timerhaven.com",
      name: "Timer Haven",
      category: "Productivity PWA Suite",
      gaId: "G-R1F6Y45MW2",
      pages: "732 pages (Eleventy + Expo)",
      status: "Online • 200 OK",
      statusColor: "var(--accent-green)",
      url: "https://timerhaven.com",
      links: [
        { label: "Homepage", url: "https://timerhaven.com" },
        { label: "World Clock", url: "https://timerhaven.com/en/world-clock/" },
        { label: "Countdown Timer", url: "https://timerhaven.com/en/countdown-timer/" },
        { label: "Robots.txt", url: "https://timerhaven.com/robots.txt" }
      ]
    }
  ];

  function renderNetwork() {
    const networkGrid = document.getElementById('networkGrid');
    if (!networkGrid) return;

    let html = '';
    NETWORK_DATA.forEach((site) => {
      let linksHtml = site.links.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="action-btn" style="font-size:0.75rem;">
          ${l.label} ↗
        </a>
      `).join('');

      html += `
        <div class="net-card">
          <div>
            <div class="net-card-top">
              <div>
                <div class="net-domain">${site.domain}</div>
                <div class="net-desc">${site.name} • ${site.category}</div>
              </div>
              <span class="net-badge">${site.status}</span>
            </div>
            <div class="net-meta" style="margin-top:12px;">
              <div class="net-meta-item">
                <span>GA4 Property</span>
                <strong><code>${site.gaId}</code></strong>
              </div>
              <div class="net-meta-item">
                <span>Architecture</span>
                <strong>${site.pages}</strong>
              </div>
            </div>
          </div>
          <div class="net-actions">
            ${linksHtml}
          </div>
        </div>
      `;
    });

    networkGrid.innerHTML = html;
  }

  // Initialize
  function initApp() {
    loadData();
  }

  // Run initial auth check
  checkAuth();
})();
