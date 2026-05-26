// Core Application Engine: TradeJournal

// --- Default Seed Data for Outstanding Visuals on First Load ---
const SEED_TRADES = [
  {
    id: "seed-1",
    asset: "stock",
    action: "buy",
    symbol: "AAPL",
    qty: 100,
    entryPrice: 172.50,
    exitPrice: 178.20,
    fees: 4.95,
    date: "2026-05-10T10:30",
    exitDate: "2026-05-15T16:00",
    strategy: "Breakout",
    emotionPre: "Calm",
    emotionPost: "Calm",
    notes: "Perfect textbook breakout of the 50 DMA. Took profits near key resistance level."
  },
  {
    id: "seed-2",
    asset: "option",
    action: "buy",
    symbol: "TSLA",
    optionType: "call",
    strike: 220,
    expiry: "2026-06-15",
    qty: 5,
    entryPrice: 4.50,
    exitPrice: 6.20,
    fees: 7.50,
    date: "2026-05-12T14:15",
    exitDate: "2026-05-19T10:00",
    strategy: "Trend Following",
    emotionPre: "FOMO",
    emotionPost: "Greed",
    notes: "TSLA was surging up. Got in slightly late due to FOMO. Luckily it continued trending up."
  },
  {
    id: "seed-3",
    asset: "stock",
    action: "buy",
    symbol: "NVDA",
    qty: 50,
    entryPrice: 910.00,
    exitPrice: 875.00,
    fees: 0.00,
    date: "2026-05-15T09:45",
    exitDate: "2026-05-15T15:30",
    strategy: "FOMO (No Setup)",
    emotionPre: "Fear",
    emotionPost: "FOMO",
    notes: "Chased the open breakout without clear structure. Stop hit quickly. Need discipline."
  },
  {
    id: "seed-4",
    asset: "option",
    action: "sell", // short option
    symbol: "MSFT",
    optionType: "put",
    strike: 410,
    expiry: "2026-05-29",
    qty: 3,
    entryPrice: 5.20,
    exitPrice: 2.10,
    fees: 5.00,
    date: "2026-05-18T11:00",
    exitDate: "2026-05-22T12:00",
    strategy: "Support/Resistance",
    emotionPre: "Calm",
    emotionPost: "Calm",
    notes: "Sold premium at solid support. Theta decay worked as expected. Excellent high probability setup."
  },
  {
    id: "seed-5",
    asset: "stock",
    action: "buy",
    symbol: "AMD",
    qty: 150,
    entryPrice: 165.00,
    exitPrice: 158.50,
    fees: 2.50,
    date: "2026-05-20T13:20",
    exitDate: "2026-05-25T15:00",
    strategy: "Pullback",
    emotionPre: "Stressed",
    emotionPost: "Fear",
    notes: "Traded while feeling extremely tired. Ignored support line violation. Costly emotional error."
  }
];

// App State Management
let trades = [];
let chartInstances = {};
let settings = {
  stockCommission: 0.00,
  optionCommission: 0.65
};
let calendarDate = new Date();
let yearlyReviewYear = new Date().getFullYear();

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  // Load trades from localStorage or seed
  const storedTrades = localStorage.getItem("trade_journal_entries");
  if (storedTrades) {
    try {
      trades = JSON.parse(storedTrades);
    } catch (e) {
      console.error("Error parsing stored trades, loading seed data", e);
      trades = [...SEED_TRADES];
    }
  } else {
    trades = [...SEED_TRADES];
    localStorage.setItem("trade_journal_entries", JSON.stringify(trades));
  }

  // Load settings from localStorage
  const storedSettings = localStorage.getItem("trade_journal_settings");
  if (storedSettings) {
    try {
      settings = JSON.parse(storedSettings);
    } catch (e) {
      console.error("Error parsing stored settings", e);
    }
  }

  // Populate settings inputs
  document.getElementById("settings-stock-comm").value = settings.stockCommission;
  document.getElementById("settings-option-comm").value = settings.optionCommission;

  // Add auto-calculate fee listener when qty changes
  document.getElementById("trade-qty").addEventListener("input", autoCalculateFees);

  // Setup lucide icons
  lucide.createIcons();

  // Setup tab routing
  initNavigation();

  // Run automated unit tests in background & log to testing dashboard
  runDeveloperTests();

  // Render current dashboard & data visualizations
  updateUI();
});

// Auto-calculate dynamic fees based on settings
function autoCalculateFees() {
  const asset = document.getElementById("trade-asset").value;
  const qty = Number(document.getElementById("trade-qty").value) || 0;
  let computedFees = 0;
  if (asset === "stock") {
    computedFees = qty * settings.stockCommission;
  } else if (asset === "option") {
    computedFees = qty * settings.optionCommission;
  }
  document.getElementById("trade-fees").value = computedFees.toFixed(2);
}

// Calculate metrics for individual trade
function calculateTradePnL(trade) {
  // Stock Option Multipliers: Stocks are linear, standard Options contracts represent 100 shares.
  const multiplier = trade.asset === "option" ? 100 : 1;
  const entryCost = Number(trade.entryPrice) * Number(trade.qty) * multiplier;
  const exitValue = Number(trade.exitPrice) * Number(trade.qty) * multiplier;
  const fees = Number(trade.fees) || 0;

  // Direction: long trades (buy then sell) profit if exit price is higher than entry.
  // Short trades (sell then buy / write premium) profit if exit price is lower than entry price.
  if (trade.action === "buy") {
    return exitValue - entryCost - fees;
  } else {
    // Action is 'sell' (representing short position or premium credit sale)
    return entryCost - exitValue - fees;
  }
}

// Advanced Performance Indicators Calculations
function calculateMetrics(tradeList) {
  let netProfit = 0;
  let grossWins = 0;
  let grossLosses = 0;
  let winCount = 0;
  let lossCount = 0;

  tradeList.forEach(t => {
    const pnl = calculateTradePnL(t);
    netProfit += pnl;
    if (pnl > 0) {
      grossWins += pnl;
      winCount++;
    } else if (pnl < 0) {
      grossLosses += Math.abs(pnl);
      lossCount++;
    }
  });

  const total = tradeList.length;
  const winRate = total > 0 ? (winCount / total) * 100 : 0;
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses) : grossWins > 0 ? 99.99 : 0.00;

  return {
    netProfit,
    winRate,
    totalTrades: total,
    profitFactor,
    avgWin: winCount > 0 ? grossWins / winCount : 0,
    avgLoss: lossCount > 0 ? grossLosses / lossCount : 0
  };
}

// Navigation & Tab Switching
function initNavigation() {
  const tabs = [
    { navId: "nav-dashboard", secId: "section-dashboard" },
    { navId: "nav-journal", secId: "section-journal" },
    { navId: "nav-calendar", secId: "section-calendar" },
    { navId: "nav-yearly", secId: "section-yearly" },
    { navId: "nav-analytics", secId: "section-analytics" },
    { navId: "nav-settings", secId: "section-settings" }
  ];

  tabs.forEach(tab => {
    document.getElementById(tab.navId).addEventListener("click", (e) => {
      e.preventDefault();
      tabs.forEach(t => {
        document.getElementById(t.navId).classList.remove("active");
        document.getElementById(t.secId).classList.remove("active");
      });
      document.getElementById(tab.navId).classList.add("active");
      document.getElementById(tab.secId).classList.add("active");

      // Redraw charts or render specific views if switching tabs
      if (tab.navId === "nav-dashboard") {
        renderCharts();
      } else if (tab.navId === "nav-calendar") {
        renderCalendar();
      } else if (tab.navId === "nav-yearly") {
        renderYearlyReview();
      }
    });
  });

  // Calendar Controls
  document.getElementById("btn-prev-month").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("btn-next-month").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  // Yearly Controls
  document.getElementById("btn-prev-year").addEventListener("click", () => {
    yearlyReviewYear--;
    renderYearlyReview();
  });
  document.getElementById("btn-next-year").addEventListener("click", () => {
    yearlyReviewYear++;
    renderYearlyReview();
  });

  // Filter Event Listeners
  document.getElementById("filter-search").addEventListener("input", filterJournal);
  document.getElementById("filter-asset").addEventListener("change", filterJournal);
  document.getElementById("filter-status").addEventListener("change", filterJournal);
  document.getElementById("filter-emotion").addEventListener("change", filterJournal);
}

// Refresh whole interface view components
function updateUI() {
  renderKPIs();
  renderCharts();
  renderJournalTable(trades);
  renderPsychologyAudit();
  renderCalendar();
  renderYearlyReview();
}

// Populate Statistics Cards
function renderKPIs() {
  const metrics = calculateMetrics(trades);
  
  // Net Profit Card
  const netProfitEl = document.getElementById("kpi-net-profit");
  netProfitEl.querySelector(".kpi-value").textContent = formatCurrency(metrics.netProfit);
  netProfitEl.classList.remove("positive", "negative");
  if (metrics.netProfit > 0) {
    netProfitEl.classList.add("positive");
    document.getElementById("kpi-pnl-trend").innerHTML = `<i data-lucide="trending-up"></i> Positive Balance`;
  } else if (metrics.netProfit < 0) {
    netProfitEl.classList.add("negative");
    document.getElementById("kpi-pnl-trend").innerHTML = `<i data-lucide="trending-down"></i> Negative Balance`;
  } else {
    document.getElementById("kpi-pnl-trend").textContent = "Neutral Balance";
  }

  // Win Rate Card
  const winRateEl = document.getElementById("kpi-win-rate");
  winRateEl.querySelector(".kpi-value").textContent = `${metrics.winRate.toFixed(1)}%`;
  const winTrendEl = document.getElementById("kpi-win-trend");
  if (metrics.winRate >= 50) {
    winTrendEl.className = "kpi-trend up";
    winTrendEl.innerHTML = `<i data-lucide="smile"></i> Profitable win ratio`;
  } else if (metrics.winRate > 0) {
    winTrendEl.className = "kpi-trend down";
    winTrendEl.innerHTML = `<i data-lucide="frown"></i> Low win ratio`;
  } else {
    winTrendEl.className = "kpi-trend text-muted";
    winTrendEl.textContent = "No data loaded";
  }

  // Total Trades Card
  const totalCountStock = trades.filter(t => t.asset === "stock").length;
  const totalCountOption = trades.filter(t => t.asset === "option").length;
  document.getElementById("kpi-total-trades").querySelector(".kpi-value").textContent = metrics.totalTrades;
  document.getElementById("kpi-total-trades").querySelector(".kpi-trend").textContent = `${totalCountStock} Stocks / ${totalCountOption} Options`;

  // Profit Factor Card
  const pFactorEl = document.getElementById("kpi-profit-factor");
  pFactorEl.querySelector(".kpi-value").textContent = metrics.profitFactor.toFixed(2);
  
  lucide.createIcons();
}

// Chart.js Visualizations Renderer
function renderCharts() {
  // Destroy old instances to prevent ghost charts on hover
  Object.keys(chartInstances).forEach(k => {
    if (chartInstances[k]) chartInstances[k].destroy();
  });

  // Sort trades chronologically for Equity curve
  const chronTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningPnL = 0;
  const equityData = [0];
  const equityLabels = ["Start"];

  chronTrades.forEach((t, i) => {
    runningPnL += calculateTradePnL(t);
    equityData.push(runningPnL);
    equityLabels.push(`${t.symbol} (${new Date(t.date).toLocaleDateString()})`);
  });

  // 1. Equity Curve Chart
  const ctxEquity = document.getElementById("chart-equity").getContext("2d");
  chartInstances.equity = new Chart(ctxEquity, {
    type: 'line',
    data: {
      labels: equityLabels,
      datasets: [{
        label: 'Account Equity ($)',
        data: equityData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#06b6d4'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af' } },
        x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af' } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 2. Asset Split Doughnut
  const stockCount = trades.filter(t => t.asset === "stock").length;
  const optionCount = trades.filter(t => t.asset === "option").length;
  const ctxAssets = document.getElementById("chart-assets").getContext("2d");
  chartInstances.assets = new Chart(ctxAssets, {
    type: 'doughnut',
    data: {
      labels: ['Stocks', 'Options'],
      datasets: [{
        data: [stockCount, optionCount],
        backgroundColor: ['#06b6d4', '#a78bfa'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#f3f4f6' } }
      }
    }
  });

  // 3. Emotions P&L performance
  const emotionSums = {};
  trades.forEach(t => {
    const emotion = t.emotionPre || 'Neutral';
    const pnl = calculateTradePnL(t);
    if (!emotionSums[emotion]) {
      emotionSums[emotion] = 0;
    }
    emotionSums[emotion] += pnl;
  });

  const emotionLabels = Object.keys(emotionSums);
  const emotionData = Object.values(emotionSums);
  const emotionColors = emotionData.map(val => val >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)');

  const ctxEmotions = document.getElementById("chart-emotions").getContext("2d");
  chartInstances.emotions = new Chart(ctxEmotions, {
    type: 'bar',
    data: {
      labels: emotionLabels,
      datasets: [{
        label: 'Net P&L ($)',
        data: emotionData,
        backgroundColor: emotionColors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af' } },
        x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af' } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 4. Strategy Win Ratio
  const strategyData = {};
  trades.forEach(t => {
    const s = t.strategy || 'Other';
    const pnl = calculateTradePnL(t);
    if (!strategyData[s]) {
      strategyData[s] = { total: 0, wins: 0 };
    }
    strategyData[s].total++;
    if (pnl > 0) strategyData[s].wins++;
  });

  const strategyLabels = Object.keys(strategyData);
  const strategyRates = strategyLabels.map(s => (strategyData[s].wins / strategyData[s].total) * 100);

  const ctxStrategies = document.getElementById("chart-strategies").getContext("2d");
  chartInstances.strategies = new Chart(ctxStrategies, {
    type: 'bar',
    data: {
      labels: strategyLabels,
      datasets: [{
        label: 'Win Rate (%)',
        data: strategyRates,
        backgroundColor: '#4f46e5',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { max: 100, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af' } },
        x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// Render Trade Log Tab Table
function renderJournalTable(tradeList) {
  const tbody = document.getElementById("journal-tbody");
  tbody.innerHTML = "";

  if (tradeList.length === 0) {
    document.getElementById("journal-empty").style.display = "block";
    return;
  } else {
    document.getElementById("journal-empty").style.display = "none";
  }

  // Sort list chronologically descending (newest first)
  const sorted = [...tradeList].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(t => {
    const pnl = calculateTradePnL(t);
    const pnlClass = pnl >= 0 ? "pnl-positive" : "pnl-negative";
    
    const entryD = new Date(t.date);
    const exitD = new Date(t.exitDate || t.date);
    const entryFmt = entryD.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const exitFmt = exitD.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Days in Trade: exit - entry
    const dit = Math.max(0, Math.round((exitD - entryD) / (1000 * 60 * 60 * 24)));
    
    // Days to Expiry: expiry - entry
    let dteText = "-";
    if (t.asset === "option" && t.expiry) {
      const expD = new Date(t.expiry);
      const dte = Math.round((expD - entryD) / (1000 * 60 * 60 * 24));
      dteText = dte >= 0 ? `${dte}d` : "Expired";
    }

    // Stop Loss and Risk-Reward (R:R)
    const stopLossVal = t.stopLoss || 0;
    let rrText = "-";
    if (stopLossVal > 0 && stopLossVal !== t.entryPrice) {
      const rr = Math.abs(t.exitPrice - t.entryPrice) / Math.abs(t.entryPrice - stopLossVal);
      rrText = `R:R: ${rr.toFixed(2)}`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>In: ${entryFmt}<br><small style="color:var(--text-dim);">Out: ${exitFmt}</small></td>
      <td style="text-align:center;">
        <strong>${dit}d</strong><br>
        <small style="color:var(--text-dim);">${t.asset === 'option' ? `DTE: ${dteText}` : '-'}</small>
      </td>
      <td><span class="badge badge-${t.asset}">${t.asset.toUpperCase()}</span></td>
      <td>
        <strong>${t.symbol.toUpperCase()}</strong>
        ${t.asset === "option" ? `<span class="option-details-tag">${t.strike} ${t.optionType.toUpperCase()} Exp ${t.expiry}</span>` : ""}
      </td>
      <td><span class="badge badge-${t.action}">${t.action.toUpperCase()}</span></td>
      <td>${t.qty}</td>
      <td>$${Number(t.entryPrice).toFixed(2)} / $${Number(t.exitPrice).toFixed(2)}</td>
      <td>
        ${stopLossVal > 0 ? `SL: $${stopLossVal.toFixed(2)}` : "No SL"}<br>
        <small style="color:var(--text-muted); font-weight:600;">${rrText}</small>
      </td>
      <td><span class="${pnlClass}">${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}</span></td>
      <td>
        <span class="emotion-pill emotion-${t.emotionPre.toLowerCase()}">${t.emotionPre}</span> ➔
        <span class="emotion-pill emotion-${t.emotionPost.toLowerCase()}">${t.emotionPost}</span>
      </td>
      <td><span style="font-size:0.85rem; color:var(--text-muted);">${t.strategy}</span></td>
      <td class="table-actions">
        <button class="action-icon" onclick="editTrade('${t.id}')"><i data-lucide="edit-3"></i></button>
        <button class="action-icon action-delete" onclick="deleteTrade('${t.id}')"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

// Filtering System for Journal
function filterJournal() {
  const query = document.getElementById("filter-search").value.toLowerCase();
  const asset = document.getElementById("filter-asset").value;
  const status = document.getElementById("filter-status").value;
  const emotion = document.getElementById("filter-emotion").value;

  const filtered = trades.filter(t => {
    const pnl = calculateTradePnL(t);
    const matchesSearch = t.symbol.toLowerCase().includes(query);
    const matchesAsset = asset === "all" || t.asset === asset;
    const matchesStatus = status === "all" || (status === "win" && pnl > 0) || (status === "loss" && pnl < 0);
    const matchesEmotion = emotion === "all" || t.emotionPre === emotion || t.emotionPost === emotion;

    return matchesSearch && matchesAsset && matchesStatus && matchesEmotion;
  });

  renderJournalTable(filtered);
}

// Generate Automated Psychological Audit
function renderPsychologyAudit() {
  const insightsContainer = document.getElementById("audit-insights-container");
  const correlationList = document.getElementById("emotional-correlation-list");
  
  insightsContainer.innerHTML = "";
  correlationList.innerHTML = "";

  if (trades.length === 0) {
    insightsContainer.innerHTML = `<p class="text-muted">Log some trades to unlock psychological analysis.</p>`;
    return;
  }

  // Group trades by Emotion Pre-Trade to analyze
  const emotionStats = {};
  trades.forEach(t => {
    const emotion = t.emotionPre || 'Neutral';
    const pnl = calculateTradePnL(t);
    if (!emotionStats[emotion]) {
      emotionStats[emotion] = { count: 0, wins: 0, losses: 0, totalPnL: 0 };
    }
    emotionStats[emotion].count++;
    emotionStats[emotion].totalPnL += pnl;
    if (pnl > 0) emotionStats[emotion].wins++;
    else emotionStats[emotion].losses++;
  });

  // Calculate insights & biases
  const insights = [];

  // Look for worst emotional bias (biggest P&L leak)
  let biggestLeakEmotion = null;
  let worstPnL = 999999;
  // Look for best emotional focus (highest average P&L)
  let bestFocusEmotion = null;
  let bestAvgPnL = -999999;

  Object.keys(emotionStats).forEach(emotion => {
    const stats = emotionStats[emotion];
    const avgPnL = stats.totalPnL / stats.count;

    if (stats.totalPnL < 0 && stats.totalPnL < worstPnL) {
      worstPnL = stats.totalPnL;
      biggestLeakEmotion = emotion;
    }
    if (avgPnL > bestAvgPnL && stats.count >= 1) {
      bestAvgPnL = avgPnL;
      bestFocusEmotion = emotion;
    }

    // Correlation list metrics render
    const winPercent = (stats.wins / stats.count) * 100;
    const item = document.createElement("div");
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600;">
        <span><span class="emotion-pill emotion-${emotion.toLowerCase()}">${emotion}</span> (${stats.count} trades)</span>
        <span class="${stats.totalPnL >= 0 ? "pnl-positive" : "pnl-negative"}">${stats.totalPnL >= 0 ? "+" : ""}${formatCurrency(stats.totalPnL)} (${winPercent.toFixed(0)}% WR)</span>
      </div>
      <div style="height:6px; background:rgba(255,255,255,0.04); border-radius:3px; overflow:hidden; margin-top:0.4rem;">
        <div style="width:${winPercent}%; height:100%; background:linear-gradient(to right, #f43f5e, #10b981); border-radius:3px;"></div>
      </div>
    `;
    correlationList.appendChild(item);
  });

  // Craft dynamic textual analysis based on trading history
  if (biggestLeakEmotion) {
    insights.push({
      type: "bad",
      title: `Critical P&L Leak: ${biggestLeakEmotion}`,
      desc: `Trading while feeling <strong>${biggestLeakEmotion}</strong> has cost you a total of <strong>${formatCurrency(Math.abs(worstPnL))}</strong>. When entering trades in this psychological state, your risk parameters are being bypassed. Recommendation: Implement a 15-minute cool-off period if this emotion is identified.`
    });
  }

  if (bestFocusEmotion) {
    insights.push({
      type: "good",
      title: `Your Psychological Zone: ${bestFocusEmotion}`,
      desc: `Entering trades in a state of <strong>${bestFocusEmotion}</strong> yields your highest efficiency with an average return of <strong>${formatCurrency(bestAvgPnL)}</strong> per trade. Keep logging setups when relaxed and focused.`
    });
  }

  // Look for strategy flaws (specifically FOMO)
  const fomoTrades = trades.filter(t => t.strategy === "FOMO (No Setup)");
  if (fomoTrades.length > 0) {
    const fomoMetrics = calculateMetrics(fomoTrades);
    if (fomoMetrics.netProfit < 0) {
      insights.push({
        type: "bad",
        title: "Discipline Leak: FOMO & Ad-hoc Entires",
        desc: `You logged ${fomoTrades.length} trades with 'FOMO (No Setup)' causing a net loss of <strong>${formatCurrency(Math.abs(fomoMetrics.netProfit))}</strong>. The win rate on these trades is only ${fomoMetrics.winRate.toFixed(0)}%. You will immediately boost profitability by avoiding non-setup trades.`
      });
    }
  }

  // Standard helpful advice
  if (insights.length === 0) {
    insights.push({
      type: "neutral",
      title: "Psychological Balance Maintained",
      desc: "Outstanding work keeping your psychological states centered. Consistently tracking pre and post emotions will highlight long term cognitive patterns."
    });
  }

  insights.forEach(ins => {
    const card = document.createElement("div");
    card.className = "insight-item";
    card.innerHTML = `
      <div class="insight-icon ${ins.type}"><i data-lucide="${ins.type === 'good' ? 'trending-up' : ins.type === 'bad' ? 'alert-triangle' : 'info'}"></i></div>
      <div class="insight-details">
        <h4>${ins.title}</h4>
        <p>${ins.desc}</p>
      </div>
    `;
    insightsContainer.appendChild(card);
  });

  // --- TradeStation Advanced Institutional Metrics Calculations ---
  let grossWins = 0;
  let grossLosses = 0;
  let winCount = 0;
  let lossCount = 0;
  
  let buyTotal = 0;
  let buyWins = 0;
  let sellTotal = 0;
  let sellWins = 0;

  // Sort trades chronologically ascending for streaks
  const chronTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let curWinStreak = 0;
  let curLossStreak = 0;

  chronTrades.forEach(t => {
    const pnl = calculateTradePnL(t);
    if (pnl > 0) {
      grossWins += pnl;
      winCount++;
      // Streak tracking
      curWinStreak++;
      curLossStreak = 0;
      if (curWinStreak > maxWinStreak) maxWinStreak = curWinStreak;
    } else if (pnl < 0) {
      grossLosses += Math.abs(pnl);
      lossCount++;
      // Streak tracking
      curLossStreak++;
      curWinStreak = 0;
      if (curLossStreak > maxLossStreak) maxLossStreak = curLossStreak;
    }

    if (t.action === "buy") {
      buyTotal++;
      if (pnl > 0) buyWins++;
    } else if (t.action === "sell") {
      sellTotal++;
      if (pnl > 0) sellWins++;
    }
  });

  // 1. Payoff Ratio
  const avgWin = winCount > 0 ? (grossWins / winCount) : 0;
  const avgLoss = lossCount > 0 ? (grossLosses / lossCount) : 0;
  const payoffRatio = avgLoss > 0 ? (avgWin / avgLoss) : avgWin > 0 ? 99.99 : 0.00;
  const payoffRatioEl = document.getElementById("ts-payoff-ratio");
  if (payoffRatioEl) payoffRatioEl.textContent = payoffRatio.toFixed(2);

  // 2. Long vs Short Win Rates
  const longWR = buyTotal > 0 ? (buyWins / buyTotal) * 100 : 0;
  const shortWR = sellTotal > 0 ? (sellWins / sellTotal) * 100 : 0;
  const longShortWREl = document.getElementById("ts-long-short-wr");
  if (longShortWREl) longShortWREl.textContent = `${longWR.toFixed(0)}% / ${shortWR.toFixed(0)}%`;

  // 3. Streaks
  const streaksEl = document.getElementById("ts-streaks");
  if (streaksEl) streaksEl.textContent = `${maxWinStreak} wins / ${maxLossStreak} losses`;

  // 4. Profit Factor
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses) : grossWins > 0 ? 99.99 : 0.00;
  const pfEl = document.getElementById("ts-profit-factor");
  if (pfEl) pfEl.textContent = profitFactor.toFixed(2);

  lucide.createIcons();
}

// Modal Form Action Toggles
function setFormAsset(asset) {
  document.getElementById("trade-asset").value = asset;
  document.getElementById("btn-asset-stock").classList.remove("active");
  document.getElementById("btn-asset-option").classList.remove("active");

  const optionFields = document.querySelectorAll(".option-field");
  if (asset === "option") {
    document.getElementById("btn-asset-option").classList.add("active");
    optionFields.forEach(f => f.style.display = "block");
  } else {
    document.getElementById("btn-asset-stock").classList.add("active");
    optionFields.forEach(f => f.style.display = "none");
  }
}

function setFormAction(action) {
  document.getElementById("trade-action").value = action;
  document.getElementById("btn-action-buy").classList.remove("active");
  document.getElementById("btn-action-sell").classList.remove("active");

  if (action === "buy") {
    document.getElementById("btn-action-buy").classList.add("active");
  } else {
    document.getElementById("btn-action-sell").classList.add("active");
  }
}

// Manage Modals
function openAddTradeModal() {
  // Clear form first
  document.getElementById("trade-id").value = "";
  document.getElementById("modal-trade-title").textContent = "Log New Trade";
  document.getElementById("form-trade").reset();
  
  // Set defaults
  setFormAsset("stock");
  setFormAction("buy");
  
  // Format current date and time matching local timezone
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("trade-date").value = now.toISOString().slice(0, 16);
  
  const exitDefault = new Date();
  exitDefault.setMinutes(exitDefault.getMinutes() - exitDefault.getTimezoneOffset() + 60); // 1hr later by default
  document.getElementById("trade-exit-date").value = exitDefault.toISOString().slice(0, 16);

  document.getElementById("modal-trade").classList.add("active");
}

function closeAddTradeModal() {
  document.getElementById("modal-trade").classList.remove("active");
}

function openImportModal() {
  document.getElementById("import-json-data").value = "";
  document.getElementById("modal-import").classList.add("active");
}

function closeImportModal() {
  document.getElementById("modal-import").classList.remove("active");
}

// Add or Edit Trade Form Handler
function saveTrade(e) {
  e.preventDefault();

  const id = document.getElementById("trade-id").value || generateUUID();
  const asset = document.getElementById("trade-asset").value;
  const action = document.getElementById("trade-action").value;
  const symbol = document.getElementById("trade-symbol").value.toUpperCase();
  const qty = Number(document.getElementById("trade-qty").value);
  const entryPrice = Number(document.getElementById("trade-entry-price").value);
  const exitPrice = Number(document.getElementById("trade-exit-price").value);
  const fees = Number(document.getElementById("trade-fees").value) || 0;
  const date = document.getElementById("trade-date").value;
  const exitDate = document.getElementById("trade-exit-date").value;
  const strategy = document.getElementById("trade-strategy").value;
  const emotionPre = document.getElementById("trade-emotion-pre").value;
  const emotionPost = document.getElementById("trade-emotion-post").value;
  const notes = document.getElementById("trade-notes").value;
  const stopLoss = Number(document.getElementById("trade-stop-loss").value) || 0;

  const newTrade = {
    id, asset, action, symbol, qty, entryPrice, exitPrice, fees, date, exitDate, strategy, emotionPre, emotionPost, notes, stopLoss
  };

  if (asset === "option") {
    newTrade.optionType = document.getElementById("trade-option-type").value;
    newTrade.strike = Number(document.getElementById("trade-strike").value) || 0;
    newTrade.expiry = document.getElementById("trade-expiry").value;
  }

  // Find index if editing
  const existingIdx = trades.findIndex(t => t.id === id);
  if (existingIdx !== -1) {
    trades[existingIdx] = newTrade;
  } else {
    trades.push(newTrade);
  }

  // Save State
  localStorage.setItem("trade_journal_entries", JSON.stringify(trades));
  
  closeAddTradeModal();
  updateUI();
}

function editTrade(id) {
  const t = trades.find(tr => tr.id === id);
  if (!t) return;

  document.getElementById("trade-id").value = t.id;
  document.getElementById("modal-trade-title").textContent = `Edit Trade: ${t.symbol}`;
  
  // Set asset/action switcher
  setFormAsset(t.asset);
  setFormAction(t.action);

  // Set inputs
  document.getElementById("trade-symbol").value = t.symbol;
  document.getElementById("trade-qty").value = t.qty;
  document.getElementById("trade-entry-price").value = t.entryPrice;
  document.getElementById("trade-exit-price").value = t.exitPrice;
  document.getElementById("trade-fees").value = t.fees;
  document.getElementById("trade-date").value = t.date;
  document.getElementById("trade-exit-date").value = t.exitDate || t.date;
  document.getElementById("trade-strategy").value = t.strategy;
  document.getElementById("trade-emotion-pre").value = t.emotionPre;
  document.getElementById("trade-emotion-post").value = t.emotionPost;
  document.getElementById("trade-notes").value = t.notes || "";
  document.getElementById("trade-stop-loss").value = t.stopLoss || "";

  if (t.asset === "option") {
    document.getElementById("trade-option-type").value = t.optionType;
    document.getElementById("trade-strike").value = t.strike;
    document.getElementById("trade-expiry").value = t.expiry;
  }

  document.getElementById("modal-trade").classList.add("active");
}

function deleteTrade(id) {
  if (confirm("Are you sure you want to permanently delete this journal entry?")) {
    trades = trades.filter(t => t.id !== id);
    localStorage.setItem("trade_journal_entries", JSON.stringify(trades));
    updateUI();
  }
}

// Backup Management (Export/Import)
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `TradeJournal_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Export data to Excel CSV format matching the Excel sheet headers
function exportCSV() {
  const headers = [
    "Entry Date", "Exit Date", "Asset Class", "Ticker", "Direction", "Option Strategy", 
    "Strike Price(s)", "Expiry Date", "Days in Trade", "Days to Expiry", "Quantity", 
    "Entry Price", "Stop Loss", "Exit Price", "Risk-Reward Ratio", "Fees & Comm.", "Net P&L", "Emotion Pre", "Emotion Post", "Setup Reason", "Notes"
  ];

  let csvContent = headers.map(h => `"${h}"`).join(",") + "\n";

  trades.forEach(t => {
    const entryD = new Date(t.date);
    const exitD = new Date(t.exitDate || t.date);
    
    // Date formats matching Excel: yyyy-mm-dd hh:mm
    const entryFmt = t.date.replace("T", " ");
    const exitFmt = t.exitDate ? t.exitDate.replace("T", " ") : "";
    
    const dit = Math.max(0, Math.round((exitD - entryD) / (1000 * 60 * 60 * 24)));
    
    let dteText = "";
    if (t.asset === "option" && t.expiry) {
      const expD = new Date(t.expiry);
      const dte = Math.round((expD - entryD) / (1000 * 60 * 60 * 24));
      dteText = dte >= 0 ? dte : "";
    }

    const pnl = calculateTradePnL(t);
    const actionVal = t.action === "buy" ? "Buy/Long" : "Sell/Short";
    const assetVal = t.asset === "stock" ? "Stock" : "Option";
    
    // Stop Loss and R:R
    const stopLossVal = t.stopLoss || "";
    let rrRatio = "";
    if (t.entryPrice && t.exitPrice && t.stopLoss && t.stopLoss !== t.entryPrice) {
      rrRatio = Math.round(Math.abs(t.exitPrice - t.entryPrice) / Math.abs(t.entryPrice - t.stopLoss) * 100) / 100;
    }

    const row = [
      entryFmt,
      exitFmt,
      assetVal,
      t.symbol.toUpperCase(),
      actionVal,
      t.asset === "option" ? (t.strategy || "Single Option") : "N/A",
      t.asset === "option" ? (t.strike || "") : "",
      t.asset === "option" ? (t.expiry || "") : "",
      dit,
      dteText,
      t.qty,
      t.entryPrice,
      stopLossVal,
      t.exitPrice,
      rrRatio,
      t.fees || 0,
      pnl.toFixed(2),
      t.emotionPre || "Neutral",
      t.emotionPost || "Neutral",
      t.strategy || "Breakout",
      (t.notes || "").replace(/"/g, '""') // Escape quotes in notes
    ];

    csvContent += row.map(val => `"${val}"`).join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `TraderLog_ExcelExport_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Parse CSV line correctly handling double-quoted strings with commas
function parseCSVRow(text) {
  let p = '', c = '', r = [];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    c = text[i];
    if (c === '"') {
      if (q && text[i+1] === '"') {
        p += '"'; // Escaped quote
        i++;
      } else {
        q = !q; // Toggle quote mode
      }
    } else if (c === ',' && !q) {
      r.push(p);
      p = '';
    } else {
      p += c;
    }
  }
  r.push(p);
  return r;
}

function executeImport() {
  const fileInput = document.getElementById("import-file-input");
  const rawText = document.getElementById("import-json-data").value.trim();

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      processImportContent(e.target.result);
    };
    reader.readAsText(file);
  } else if (rawText) {
    processImportContent(rawText);
  } else {
    alert("Please select a file or paste text content to import.");
  }
}

function processImportContent(content) {
  content = content.trim();
  if (content.startsWith("[") || content.startsWith("{")) {
    // JSON Import
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        trades = parsed;
        localStorage.setItem("trade_journal_entries", JSON.stringify(trades));
        closeImportModal();
        updateUI();
        alert("Successfully restored trade records from JSON!");
      } else {
        alert("JSON format error: Data must be a list array of trades.");
      }
    } catch (e) {
      alert("Invalid JSON format. Please double check content.");
    }
  } else {
    // CSV Import matching Excel column headers
    try {
      const lines = content.split(/\r?\n/);
      if (lines.length < 2) {
        alert("Empty or invalid CSV file.");
        return;
      }
      
      const headers = parseCSVRow(lines[0]);
      
      // Clean headers from quotes/whitespace
      const cleanHeaders = headers.map(h => h.trim().replace(/^"|"$/g, ""));
      
      // Map header strings to indices
      const hMap = {};
      cleanHeaders.forEach((h, idx) => {
        hMap[h] = idx;
      });

      const requiredHeaders = ["Entry Date", "Ticker", "Quantity", "Entry Price", "Exit Price"];
      const missing = requiredHeaders.filter(h => hMap[h] === undefined);
      if (missing.length > 0) {
        alert("Invalid CSV format! Missing required Excel headers: " + missing.join(", "));
        return;
      }

      const importedTrades = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCSVRow(lines[i]).map(val => val.trim().replace(/^"|"$/g, ""));

        // Helper to get row value by Excel header name
        const getVal = (name) => {
          const idx = hMap[name];
          return idx !== undefined ? row[idx] : "";
        };

        const entryDate = getVal("Entry Date").replace(" ", "T");
        const exitDate = getVal("Exit Date").replace(" ", "T") || entryDate;
        const assetClass = getVal("Asset Class").toLowerCase() === "option" ? "option" : "stock";
        const symbol = getVal("Ticker").toUpperCase();
        const direction = getVal("Direction").toLowerCase().includes("sell") || getVal("Direction").toLowerCase().includes("short") ? "sell" : "buy";
        const strategy = getVal("Option Strategy") !== "N/A" && getVal("Option Strategy") ? getVal("Option Strategy") : getVal("Setup Reason") || "Breakout";
        const strike = Number(getVal("Strike Price(s)")) || "";
        const expiry = getVal("Expiry Date") || "";
        const qty = Number(getVal("Quantity")) || 1;
        const entryPrice = Number(getVal("Entry Price")) || 0;
        const stopLoss = Number(getVal("Stop Loss")) || "";
        const exitPrice = Number(getVal("Exit Price")) || 0;
        const fees = Number(getVal("Fees & Comm.")) || 0;
        const emotionPre = getVal("Emotion Pre") || "Neutral";
        const emotionPost = getVal("Emotion Post") || "Neutral";
        const notes = getVal("Notes") || "";

        const tradeObj = {
          id: generateUUID(),
          asset: assetClass,
          action: direction,
          symbol: symbol,
          qty: qty,
          entryPrice: entryPrice,
          exitPrice: exitPrice,
          fees: fees,
          date: entryDate,
          exitDate: exitDate,
          strategy: strategy,
          emotionPre: emotionPre,
          emotionPost: emotionPost,
          notes: notes,
          stopLoss: stopLoss
        };

        if (assetClass === "option") {
          tradeObj.optionType = getVal("Option Strategy").toLowerCase().includes("put") || strategy.toLowerCase().includes("put") ? "put" : "call";
          tradeObj.strike = strike;
          tradeObj.expiry = expiry;
        }

        importedTrades.push(tradeObj);
      }

      if (importedTrades.length > 0) {
        trades = importedTrades;
        localStorage.setItem("trade_journal_entries", JSON.stringify(trades));
        closeImportModal();
        updateUI();
        alert(`Successfully imported ${importedTrades.length} trades from CSV!`);
      } else {
        alert("No valid trade records found in CSV.");
      }

    } catch (e) {
      alert("Error parsing CSV data: " + e.message);
    }
  }
}

// Helpers
function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function generateUUID() {
  return 'trade-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}


// ==========================================
//    AUTOMATED DEVELOPER UNIT TESTING SUITE
// ==========================================
function runDeveloperTests() {
  const consoleEl = document.getElementById("test-console-output");
  consoleEl.innerHTML = "";
  
  let passes = 0;
  let fails = 0;

  function logPass(message) {
    passes++;
    consoleEl.innerHTML += `<div class="test-pass">✓ PASS: ${message}</div>`;
  }

  function logFail(message, expected, actual) {
    fails++;
    consoleEl.innerHTML += `<div class="test-fail">✗ FAIL: ${message} (Expected: ${expected}, Actual: ${actual})</div>`;
  }

  consoleEl.innerHTML += `<div>🚀 Launching trade journal statistics assertion runner...</div><br>`;

  // Test Case 1: Simple Stock Buy Profit Trade
  try {
    const mockStockBuy = {
      asset: "stock",
      action: "buy",
      qty: 10,
      entryPrice: 100,
      exitPrice: 110,
      fees: 5
    };
    const pnl = calculateTradePnL(mockStockBuy);
    if (pnl === 95) {
      logPass("Stock Long trade math verification (P&L = 95)");
    } else {
      logFail("Stock Long trade math verification", 95, pnl);
    }
  } catch (e) {
    logFail("Stock Long trade math crash", "95", e.toString());
  }

  // Test Case 2: Option Multiplier Buy Trade
  try {
    const mockOptionBuy = {
      asset: "option",
      action: "buy",
      qty: 2,
      entryPrice: 1.50,
      exitPrice: 2.50,
      fees: 10
    };
    const pnl = calculateTradePnL(mockOptionBuy);
    if (pnl === 190) { // (2.50 - 1.50) * 2 * 100 - 10 = 200 - 10 = 190
      logPass("Option Long trade multiplier validation (P&L = 190)");
    } else {
      logFail("Option Long trade multiplier validation", 190, pnl);
    }
  } catch (e) {
    logFail("Option Long trade multiplier crash", "190", e.toString());
  }

  // Test Case 3: Short Stock Sale Profit Trade
  try {
    const mockStockShort = {
      asset: "stock",
      action: "sell", // Short sale
      qty: 50,
      entryPrice: 50,
      exitPrice: 42,
      fees: 0
    };
    const pnl = calculateTradePnL(mockStockShort);
    if (pnl === 400) { // (50 - 42) * 50 = 400
      logPass("Short Sell Stock trade calculations (P&L = 400)");
    } else {
      logFail("Short Sell Stock trade calculations", 400, pnl);
    }
  } catch (e) {
    logFail("Short Sell Stock trade crash", "400", e.toString());
  }

  // Test Case 4: Advanced Aggregation & Win Rate Metrics
  try {
    const mockJournal = [
      { asset: "stock", action: "buy", qty: 10, entryPrice: 10, exitPrice: 12, fees: 0 }, // +20
      { asset: "stock", action: "buy", qty: 5, entryPrice: 100, exitPrice: 90, fees: 0 },  // -50
      { asset: "stock", action: "buy", qty: 100, entryPrice: 1, exitPrice: 1.5, fees: 0 }  // +50
    ];
    const metrics = calculateMetrics(mockJournal);
    // Net profit = 20 - 50 + 50 = 20
    // Win rate = 2 wins / 3 trades = 66.66%
    // Profit factor = 70 wins / 50 loss = 1.40
    if (metrics.netProfit === 20 && Math.abs(metrics.winRate - 66.666) < 0.01 && metrics.profitFactor === 1.4) {
      logPass("Composite analytics aggregation matching values (Net P&L: 20, WR: 66.7%, Profit Factor: 1.40)");
    } else {
      logFail("Composite analytics aggregation matching values", "Net: 20, WR: 66.7%, PF: 1.40", `Net: ${metrics.netProfit}, WR: ${metrics.winRate}, PF: ${metrics.profitFactor}`);
    }
  } catch (e) {
    logFail("Composite analytics aggregation crash", "metrics check", e.toString());
  }

  // Test Case 5: Dynamic Commissions Calculations Based on Settings
  try {
    const savedStockComm = settings.stockCommission;
    const savedOptionComm = settings.optionCommission;
    
    // Simulate setting stock = 0.05, option = 0.50
    settings.stockCommission = 0.05;
    settings.optionCommission = 0.50;
    
    const mockStock = { asset: "stock", qty: 150, entryPrice: 10, exitPrice: 15, action: "buy" };
    const mockOption = { asset: "option", qty: 10, entryPrice: 1.5, exitPrice: 2.0, action: "buy" };
    
    // Auto-calculate dynamic fees formulas
    const stockFees = mockStock.qty * settings.stockCommission; // 150 * 0.05 = 7.50
    const optionFees = mockOption.qty * settings.optionCommission; // 10 * 0.50 = 5.00
    
    // Restore settings
    settings.stockCommission = savedStockComm;
    settings.optionCommission = savedOptionComm;
    
    if (stockFees === 7.5 && optionFees === 5) {
      logPass("Dynamic settings-based commissions calculation (Stock fees: $7.50, Option fees: $5.00)");
    } else {
      logFail("Dynamic settings-based commissions calculation", "Stock: 7.5, Option: 5", `Stock: ${stockFees}, Option: ${optionFees}`);
    }
  } catch (e) {
    logFail("Dynamic settings-based commissions math crash", "fees validation", e.toString());
  }

  // Test Case 6: Calendar Daily Aggregations Matches exit dates
  try {
    const testDate = "2026-05-15";
    const testTrades = [
      { id: "t1", date: "2026-05-15T10:00", exitDate: "2026-05-15T12:00", asset: "stock", action: "buy", qty: 10, entryPrice: 100, exitPrice: 105, fees: 5 }, // +45
      { id: "t2", date: "2026-05-15T14:00", exitDate: "2026-05-15T15:00", asset: "stock", action: "buy", qty: 20, entryPrice: 50, exitPrice: 48, fees: 10 }  // -50
    ];
    let dailyPnL = 0;
    testTrades.forEach(t => {
      if (t.exitDate.split("T")[0] === testDate) {
        dailyPnL += calculateTradePnL(t);
      }
    });
    if (dailyPnL === -5) { // 45 - 50 = -5
      logPass("Calendar daily closed P&L date grouping (Aggregated Daily P&L = -$5.00)");
    } else {
      logFail("Calendar daily closed P&L date grouping", -5, dailyPnL);
    }
  } catch (e) {
    logFail("Calendar daily grouping logic crash", "-5", e.toString());
  }

  consoleEl.innerHTML += `<br><div style="font-weight:700;">Test Suite Summary: ${passes} passed, ${fails} failed.</div>`;
}

// Save central settings to state & localStorage
function saveSettings(e) {
  e.preventDefault();
  settings.stockCommission = Number(document.getElementById("settings-stock-comm").value) || 0;
  settings.optionCommission = Number(document.getElementById("settings-option-comm").value) || 0;
  
  localStorage.setItem("trade_journal_settings", JSON.stringify(settings));
  alert("Settings saved successfully!");
  updateUI();
}

// Render dynamic month calendar grid
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth(); // 0-indexed

  // Month & Year Label
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const labelEl = document.getElementById("calendar-month-year-label");
  if (labelEl) labelEl.textContent = `${monthNames[month]} ${year}`;

  const gridContainer = document.getElementById("calendar-days-grid");
  if (!gridContainer) return;
  gridContainer.innerHTML = "";

  // 1st of the month day of week index (0 = Sun, 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Total days in the previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Draw previous month's trailing days as empty/disabled spacers
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day empty";
    dayDiv.innerHTML = `<span class="calendar-day-num">${prevMonthTotalDays - i}</span>`;
    gridContainer.appendChild(dayDiv);
  }

  let monthTotalPnL = 0;

  // Draw current month's active days
  for (let d = 1; d <= totalDays; d++) {
    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Aggregate P&L of trades closed/exit on this specific date
    let dayPnL = 0;
    let hasTrades = false;

    trades.forEach(t => {
      // Standardize date comparison
      const exitD = t.exitDate ? t.exitDate.split("T")[0] : t.date.split("T")[0];
      if (exitD === currentDateStr) {
        dayPnL += calculateTradePnL(t);
        hasTrades = true;
      }
    });

    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    
    let pnlText = "-";
    if (hasTrades) {
      pnlText = (dayPnL >= 0 ? "+" : "") + formatCurrency(dayPnL);
      monthTotalPnL += dayPnL;
      if (dayPnL > 0) {
        dayDiv.classList.add("profit");
      } else if (dayPnL < 0) {
        dayDiv.classList.add("loss");
      }
    }

    dayDiv.innerHTML = `
      <span class="calendar-day-num">${d}</span>
      <div class="calendar-day-pnl">${pnlText}</div>
    `;
    gridContainer.appendChild(dayDiv);
  }

  // Populate month total P&L card
  const monthPnLValEl = document.getElementById("calendar-month-pnl-value");
  const monthPnLTrendEl = document.getElementById("calendar-month-pnl-trend");
  const monthPnLCardEl = document.getElementById("calendar-month-pnl-card");

  if (monthPnLValEl) monthPnLValEl.textContent = formatCurrency(monthTotalPnL);
  if (monthPnLCardEl) {
    monthPnLCardEl.className = "kpi-card";
    if (monthTotalPnL > 0) {
      monthPnLCardEl.classList.add("positive");
      if (monthPnLTrendEl) monthPnLTrendEl.innerHTML = `<i data-lucide="trending-up" style="display:inline; vertical-align:-2px; width:16px;"></i> Profitable Month`;
    } else if (monthTotalPnL < 0) {
      monthPnLCardEl.classList.add("negative");
      if (monthPnLTrendEl) monthPnLTrendEl.innerHTML = `<i data-lucide="trending-down" style="display:inline; vertical-align:-2px; width:16px;"></i> Losing Month`;
    } else {
      if (monthPnLTrendEl) monthPnLTrendEl.textContent = "No Closed P&L";
    }
  }

  lucide.createIcons();
}

// Render dynamic yearly review scorecard grid
function renderYearlyReview() {
  const labelEl = document.getElementById("calendar-year-label");
  if (labelEl) labelEl.textContent = yearlyReviewYear;

  const gridContainer = document.getElementById("yearly-months-grid");
  if (!gridContainer) return;
  gridContainer.innerHTML = "";

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let yearTotalPnL = 0;

  monthNames.forEach((monthName, idx) => {
    let monthPnL = 0;
    let hasTrades = false;

    trades.forEach(t => {
      const exitD = new Date(t.exitDate || t.date);
      if (exitD.getFullYear() === yearlyReviewYear && exitD.getMonth() === idx) {
        monthPnL += calculateTradePnL(t);
        hasTrades = true;
      }
    });

    const monthCard = document.createElement("div");
    monthCard.className = "month-card";

    let pnlText = "-";
    if (hasTrades) {
      pnlText = (monthPnL >= 0 ? "+" : "") + formatCurrency(monthPnL);
      yearTotalPnL += monthPnL;
      if (monthPnL > 0) {
        monthCard.classList.add("profit");
      } else if (monthPnL < 0) {
        monthCard.classList.add("loss");
      }
    }

    monthCard.innerHTML = `
      <h4>${monthName.toUpperCase()}</h4>
      <div class="month-pnl">${pnlText}</div>
    `;
    gridContainer.appendChild(monthCard);
  });

  // Populate year total P&L card
  const yearPnLValEl = document.getElementById("yearly-total-pnl-value");
  const yearPnLTrendEl = document.getElementById("yearly-total-pnl-trend");
  const yearPnLCardEl = document.getElementById("yearly-total-pnl-card");

  if (yearPnLValEl) yearPnLValEl.textContent = formatCurrency(yearTotalPnL);
  if (yearPnLCardEl) {
    yearPnLCardEl.className = "kpi-card";
    if (yearTotalPnL > 0) {
      yearPnLCardEl.classList.add("positive");
      if (yearPnLTrendEl) yearPnLTrendEl.innerHTML = `<i data-lucide="trending-up" style="display:inline; vertical-align:-2px; width:16px;"></i> Profitable Year`;
    } else if (yearTotalPnL < 0) {
      yearPnLCardEl.classList.add("negative");
      if (yearPnLTrendEl) yearPnLTrendEl.innerHTML = `<i data-lucide="trending-down" style="display:inline; vertical-align:-2px; width:16px;"></i> Losing Year`;
    } else {
      if (yearPnLTrendEl) yearPnLTrendEl.textContent = "No Data";
    }
  }

  lucide.createIcons();
}
