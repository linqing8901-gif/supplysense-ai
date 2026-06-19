const state = {
  rawRows: [],
  rows: [],
  selectedSku: null,
  filter: "all",
  dataQuality: {
    rowCount: 0,
    missingRequiredCount: 0,
    historyCoverage: 0,
    readiness: "Waiting",
    missingFields: [],
  },
  baselineSnapshot: null,
  calibration: {
    mode: "Baseline",
    safetyBuffer: 1,
    supplierWeight: 1,
    riskAdjustment: 0,
    confidence: "Baseline",
    demandVolatility: 0,
  },
};

const SAMPLE_CSV = `sku,name,category,current_stock,lead_time_days,supplier,on_order,last_14d_sales,unit_cost,supplier_reliability,avg_delay_days,defect_rate,region_risk,hist_wk_8,hist_wk_7,hist_wk_6,hist_wk_5,hist_wk_4,hist_wk_3,hist_wk_2,hist_wk_1
SKU-1001,Insulin Cold Pack,Healthcare Logistics,180,9,NorthBridge Medical,40,312,12.50,91,1.2,0.8,Low,118,132,141,149,156,168,151,161
SKU-1002,Portable Glucose Strip,Healthcare Logistics,620,6,MedAxis Supply,150,498,4.10,95,0.4,0.5,Low,220,238,246,252,261,249,254,244
SKU-1003,N95 Respirator Box,Protective Equipment,95,12,ShieldWorks,0,210,8.75,78,3.8,2.1,Medium,66,72,84,101,95,118,102,108
SKU-1004,IV Starter Kit,Clinical Supplies,260,8,NorthBridge Medical,60,226,14.20,91,1.2,0.8,Low,98,104,111,108,116,123,112,114
SKU-1005,Smart Thermometer,Devices,48,15,Quantiva Devices,20,84,19.90,71,4.6,2.8,High,20,31,28,36,42,39,46,38
SKU-1006,Disposable Syringe Pack,Clinical Supplies,980,5,MedAxis Supply,300,770,2.40,95,0.4,0.5,Low,330,350,368,372,386,398,391,379
SKU-1007,First Aid Refill Kit,Emergency Supplies,130,10,SafeRoute Global,50,112,7.60,82,2.2,1.2,Medium,46,50,54,52,60,57,56,61
SKU-1008,Electrolyte Sachet,Pharmacy,340,7,VitaLink Pharma,120,392,1.20,88,1.6,0.9,Medium,146,152,178,165,190,205,198,194
SKU-1009,Digital BP Monitor,Devices,26,18,Quantiva Devices,10,38,34.00,71,4.6,2.8,High,10,13,15,14,18,22,19,20
SKU-1010,Wound Dressing Roll,Clinical Supplies,410,6,ShieldWorks,80,280,3.80,78,3.8,2.1,Medium,118,126,134,142,139,156,151,149
SKU-1011,Cold Chain Label,Logistics,220,14,SafeRoute Global,0,168,0.95,82,2.2,1.2,Medium,62,68,71,78,84,88,80,86
SKU-1012,Sanitizer Refill Can,Facility Supplies,560,5,CleanCore,200,455,5.50,93,0.8,0.4,Low,196,204,220,218,230,236,224,231`;

const els = {
  csvInput: document.getElementById("csvInput"),
  loadSample: document.getElementById("loadSample"),
  optimizeModel: document.getElementById("optimizeModel"),
  exportPo: document.getElementById("exportPo"),
  copySummary: document.getElementById("copySummary"),
  riskFilter: document.getElementById("riskFilter"),
  inventoryRows: document.getElementById("inventoryRows"),
  criticalCount: document.getElementById("criticalCount"),
  riskValue: document.getElementById("riskValue"),
  reorderValue: document.getElementById("reorderValue"),
  medianCover: document.getElementById("medianCover"),
  supplierRisk: document.getElementById("supplierRisk"),
  selectedSku: document.getElementById("selectedSku"),
  insightText: document.getElementById("insightText"),
  riskGauge: document.querySelector("#riskGauge span"),
  summaryDraft: document.getElementById("summaryDraft"),
  timelineChart: document.getElementById("timelineChart"),
  timelineSummary: document.getElementById("timelineSummary"),
  statusToast: document.getElementById("statusToast"),
  calibrationSummary: document.getElementById("calibrationSummary"),
  safetyBuffer: document.getElementById("safetyBuffer"),
  supplierWeight: document.getElementById("supplierWeight"),
  riskAdjustment: document.getElementById("riskAdjustment"),
  calibrationConfidence: document.getElementById("calibrationConfidence"),
  rowsLoaded: document.getElementById("rowsLoaded"),
  missingFields: document.getElementById("missingFields"),
  historyCoverage: document.getElementById("historyCoverage"),
  readinessStatus: document.getElementById("readinessStatus"),
  readinessSummary: document.getElementById("readinessSummary"),
  beforeCritical: document.getElementById("beforeCritical"),
  afterCritical: document.getElementById("afterCritical"),
  beforeReorder: document.getElementById("beforeReorder"),
  afterReorder: document.getElementById("afterReorder"),
  beforeCover: document.getElementById("beforeCover"),
  afterCover: document.getElementById("afterCover"),
};

els.loadSample.addEventListener("click", async () => {
  try {
    const response = await fetch("data/sample_inventory.csv");
    loadCsv(await response.text());
  } catch {
    loadCsv(SAMPLE_CSV);
  }
  showToast("Sample inventory loaded");
});

els.csvInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  loadCsv(await file.text());
  showToast(`${file.name} uploaded`);
});

els.riskFilter.addEventListener("change", (event) => {
  state.filter = event.target.value;
  render();
});

els.exportPo.addEventListener("click", () => {
  exportPurchaseOrders();
});

els.optimizeModel.addEventListener("click", () => {
  optimizeModelFromHistory();
});

els.copySummary.addEventListener("click", async () => {
  await copyText(els.summaryDraft.textContent.trim());
  showToast("Submission summary copied");
});

function loadCsv(csvText) {
  state.rawRows = parseCsv(csvText);
  state.dataQuality = analyzeDataQuality(state.rawRows);
  resetCalibration();
  rescoreRows();
  state.baselineSnapshot = getPlanningSnapshot(state.rows);
  state.selectedSku = state.rows[0]?.sku ?? null;
  render();
}

function rescoreRows() {
  state.rows = state.rawRows.map(scoreInventoryRow);
  state.rows.sort((a, b) => b.riskScore - a.riskScore || b.reorderCash - a.reorderCash);
}

function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });
}

function analyzeDataQuality(rows) {
  const requiredFields = [
    "sku",
    "name",
    "current_stock",
    "lead_time_days",
    "supplier",
    "on_order",
    "last_14d_sales",
    "unit_cost",
  ];
  const missingFields = new Set();
  let missingRequiredCount = 0;

  rows.forEach((row) => {
    requiredFields.forEach((field) => {
      if (row[field] === undefined || row[field] === "") {
        missingFields.add(field);
        missingRequiredCount += 1;
      }
    });
  });

  const historyRows = rows.filter((row) => getHistoricalDemand(row).length >= 4).length;
  const historyCoverage = rows.length ? historyRows / rows.length : 0;
  let readiness = "Ready";
  if (missingRequiredCount > 0) {
    readiness = "Needs Cleanup";
  } else if (historyCoverage < 0.5) {
    readiness = "Limited";
  }

  return {
    rowCount: rows.length,
    missingRequiredCount,
    historyCoverage,
    readiness,
    missingFields: Array.from(missingFields),
  };
}

function splitCsvLine(line) {
  const result = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  result.push(value);
  return result;
}

function scoreInventoryRow(row) {
  const currentStock = number(row.current_stock);
  const leadTimeDays = number(row.lead_time_days);
  const onOrder = number(row.on_order);
  const last14dSales = number(row.last_14d_sales);
  const unitCost = number(row.unit_cost);
  const supplierReliability = number(row.supplier_reliability || 90);
  const avgDelayDays = number(row.avg_delay_days);
  const defectRate = number(row.defect_rate);
  const regionRisk = row.region_risk || "Low";
  const dailyDemand = Math.max(last14dSales / 14, 0.1);
  const availableBeforeReplenishment = currentStock + onOrder;
  const daysCover = availableBeforeReplenishment / dailyDemand;
  const supplierRiskScore = getSupplierRiskScore(supplierReliability, avgDelayDays, defectRate, regionRisk);
  const effectiveLeadTime = leadTimeDays + Math.ceil(avgDelayDays);
  const adjustedSupplierRisk = supplierRiskScore * state.calibration.supplierWeight;
  const safetyDays = Math.max(3, Math.ceil(effectiveLeadTime * (0.3 + adjustedSupplierRisk / 250) * state.calibration.safetyBuffer));
  const targetStock = Math.ceil(dailyDemand * (effectiveLeadTime + safetyDays + 7));
  const reorderQty = Math.max(0, targetStock - availableBeforeReplenishment);
  const reorderCash = reorderQty * unitCost;
  const leadTimeGap = effectiveLeadTime - daysCover;
  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(46 + leadTimeGap * 7 + adjustedSupplierRisk * 0.35 + (reorderQty / Math.max(dailyDemand, 1)) * 1.8 + state.calibration.riskAdjustment),
    ),
  );
  const riskLevel = getRiskLevel(riskScore, daysCover, effectiveLeadTime);

  return {
    ...row,
    currentStock,
    leadTimeDays,
    onOrder,
    last14dSales,
    unitCost,
    supplierReliability,
    avgDelayDays,
    defectRate,
    regionRisk,
    supplierRiskScore,
    effectiveLeadTime,
    dailyDemand,
    daysCover,
    safetyDays,
    targetStock,
    reorderQty,
    reorderCash,
    riskScore,
    riskLevel,
  };
}

function getRiskLevel(score, daysCover, leadTimeDays) {
  if (daysCover < leadTimeDays * 0.75 || score >= 82) return "Critical";
  if (daysCover < leadTimeDays || score >= 68) return "High";
  if (daysCover < leadTimeDays + 5 || score >= 50) return "Watch";
  return "Stable";
}

function getSupplierRiskScore(reliability, delayDays, defectRate, regionRisk) {
  const regionScore = { Low: 4, Medium: 12, High: 22 }[regionRisk] ?? 8;
  const reliabilityPenalty = Math.max(0, 100 - reliability) * 0.75;
  const delayPenalty = delayDays * 5;
  const defectPenalty = defectRate * 4;
  return Math.max(0, Math.min(100, Math.round(reliabilityPenalty + delayPenalty + defectPenalty + regionScore)));
}

function getSupplierRiskLevel(score) {
  if (score >= 55) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function resetCalibration() {
  state.calibration = {
    mode: "Baseline",
    safetyBuffer: 1,
    supplierWeight: 1,
    riskAdjustment: 0,
    confidence: "Baseline",
    demandVolatility: 0,
  };
}

function optimizeModelFromHistory() {
  if (!state.rawRows.length) {
    showToast("Load inventory data before optimizing");
    return;
  }

  const historyRows = state.rawRows.filter((row) => getHistoricalDemand(row).length >= 4);
  if (historyRows.length < Math.max(4, state.rawRows.length * 0.5)) {
    showToast("Not enough historical demand fields to optimize");
    return;
  }

  const volatility = average(historyRows.map((row) => coefficientOfVariation(getHistoricalDemand(row))));
  const supplierPressure = average(state.rows.map((row) => row.supplierRiskScore)) / 100;
  const baselineStockoutExposure = state.rows.filter((row) => row.daysCover < row.effectiveLeadTime).length / state.rows.length;
  const safetyBuffer = clamp(1 + volatility * 0.55 + baselineStockoutExposure * 0.18, 1, 1.35);
  const supplierWeight = clamp(1 + supplierPressure * 0.32, 1, 1.28);
  const riskAdjustment = Math.round(clamp(volatility * 18 + baselineStockoutExposure * 8 - 2, 0, 10));

  state.calibration = {
    mode: "Optimized",
    safetyBuffer,
    supplierWeight,
    riskAdjustment,
    confidence: historyRows.length >= 10 ? "High" : "Medium",
    demandVolatility: volatility,
  };

  rescoreRows();
  state.selectedSku = state.rows[0]?.sku ?? state.selectedSku;
  render();
  showToast("Model optimized from historical demand");
}

function render() {
  const filteredRows = state.filter === "all" ? state.rows : state.rows.filter((row) => row.riskLevel === state.filter);
  renderMetrics();
  renderDataQuality();
  renderCalibration();
  renderComparison();
  renderTable(filteredRows);
  const selectedRow = state.rows.find((row) => row.sku === state.selectedSku) ?? state.rows[0];
  renderInsight(selectedRow);
  renderTimeline(selectedRow);
}

function renderDataQuality() {
  els.rowsLoaded.textContent = state.dataQuality.rowCount;
  els.missingFields.textContent = state.dataQuality.missingRequiredCount;
  els.historyCoverage.textContent = `${Math.round(state.dataQuality.historyCoverage * 100)}%`;
  els.readinessStatus.textContent = state.dataQuality.readiness;

  if (!state.dataQuality.rowCount) {
    els.readinessSummary.textContent = "Load inventory data to validate required fields and historical coverage.";
    return;
  }

  const missing = state.dataQuality.missingFields.length ? ` Missing fields: ${state.dataQuality.missingFields.join(", ")}.` : "";
  els.readinessSummary.textContent = `${state.dataQuality.rowCount} rows loaded with ${Math.round(state.dataQuality.historyCoverage * 100)}% historical coverage. Calibration readiness is ${state.dataQuality.readiness}.${missing}`;
}

function renderCalibration() {
  els.safetyBuffer.textContent = `${state.calibration.safetyBuffer.toFixed(2)}x`;
  els.supplierWeight.textContent = `${state.calibration.supplierWeight.toFixed(2)}x`;
  els.riskAdjustment.textContent = state.calibration.riskAdjustment ? `+${state.calibration.riskAdjustment} risk pts` : "Baseline";
  els.calibrationConfidence.textContent = state.calibration.confidence;

  if (state.calibration.mode === "Optimized") {
    els.calibrationSummary.textContent = `Optimized mode used 8-week demand history to estimate ${(state.calibration.demandVolatility * 100).toFixed(1)}% demand volatility, then tuned safety buffer, supplier risk weight, and risk scoring conservatism.`;
  } else {
    els.calibrationSummary.textContent =
      "Baseline mode uses transparent default thresholds. Click Optimize Model to tune buffers using historical weekly demand and supplier risk signals.";
  }
}

function renderComparison() {
  const current = getPlanningSnapshot(state.rows);
  const baseline = state.baselineSnapshot ?? current;

  els.beforeCritical.textContent = baseline.criticalCount;
  els.afterCritical.textContent = current.criticalCount;
  els.beforeReorder.textContent = money(baseline.reorderValue);
  els.afterReorder.textContent = money(current.reorderValue);
  els.beforeCover.textContent = `${baseline.medianCover.toFixed(1)} days`;
  els.afterCover.textContent = `${current.medianCover.toFixed(1)} days`;
}

function renderMetrics() {
  const criticalRows = state.rows.filter((row) => row.riskLevel === "Critical");
  const riskyRows = state.rows.filter((row) => ["Critical", "High"].includes(row.riskLevel));
  const covers = state.rows.map((row) => row.daysCover).sort((a, b) => a - b);
  const median = covers.length ? covers[Math.floor(covers.length / 2)] : 0;
  const supplierRiskRows = state.rows.filter((row) => row.supplierRiskScore >= 35);

  els.criticalCount.textContent = criticalRows.length;
  els.riskValue.textContent = money(sum(riskyRows, (row) => row.currentStock * row.unitCost));
  els.reorderValue.textContent = money(sum(state.rows, (row) => row.reorderCash));
  els.medianCover.textContent = `${median.toFixed(1)} days`;
  els.supplierRisk.textContent = supplierRiskRows.length;
}

function getPlanningSnapshot(rows) {
  const criticalCount = rows.filter((row) => row.riskLevel === "Critical").length;
  const reorderValue = sum(rows, (row) => row.reorderCash);
  const covers = rows.map((row) => row.daysCover).sort((a, b) => a - b);
  const medianCover = covers.length ? covers[Math.floor(covers.length / 2)] : 0;

  return {
    criticalCount,
    reorderValue,
    medianCover,
  };
}

function renderTable(rows) {
  els.inventoryRows.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = row.sku === state.selectedSku ? "selected" : "";
    tr.innerHTML = `
      <td><strong>${escapeHtml(row.sku)}</strong></td>
      <td>${escapeHtml(row.name)}<br><small>${escapeHtml(row.supplier)}</small></td>
      <td><span class="risk-pill risk-${row.riskLevel}">${row.riskLevel}</span></td>
      <td>${row.daysCover.toFixed(1)}</td>
      <td>${row.effectiveLeadTime} days</td>
      <td><span class="supplier-pill supplier-${getSupplierRiskLevel(row.supplierRiskScore)}">${getSupplierRiskLevel(row.supplierRiskScore)}</span></td>
      <td>${row.reorderQty.toLocaleString()}</td>
      <td>${money(row.reorderCash)}</td>
    `;
    tr.addEventListener("click", () => {
      state.selectedSku = row.sku;
      render();
    });
    els.inventoryRows.appendChild(tr);
  });
}

function renderInsight(row) {
  if (!row) return;

  els.selectedSku.textContent = `${row.sku} - ${row.name}`;
  els.riskGauge.style.width = `${row.riskScore}%`;
  els.insightText.innerHTML = `
    <p><strong>${row.riskLevel} risk:</strong> ${escapeHtml(row.name)} has ${row.daysCover.toFixed(1)} days of cover against a ${row.effectiveLeadTime}-day effective lead time.</p>
    <ul>
      <li>Recent demand is ${row.dailyDemand.toFixed(1)} units per day based on the last 14 days.</li>
      <li>Available supply before replenishment is ${Math.round(row.currentStock + row.onOrder).toLocaleString()} units.</li>
      <li>Recommended reorder is ${row.reorderQty.toLocaleString()} units, requiring about ${money(row.reorderCash)}.</li>
      <li>Supplier risk is ${getSupplierRiskLevel(row.supplierRiskScore)}: ${row.supplierReliability}% reliability, ${row.avgDelayDays.toFixed(1)} average delay days, ${row.defectRate.toFixed(1)}% defect rate, and ${escapeHtml(row.regionRisk)} regional risk.</li>
      <li>Planning buffer uses ${row.safetyDays} safety days because supplier risk extends the base ${row.leadTimeDays}-day lead time.</li>
      <li>Calibration mode is ${state.calibration.mode}, with a ${state.calibration.safetyBuffer.toFixed(2)}x safety buffer and ${state.calibration.supplierWeight.toFixed(2)}x supplier risk weight.</li>
    </ul>
    <p><strong>Action:</strong> prioritize purchase approval, confirm supplier capacity with ${escapeHtml(row.supplier)}, and monitor daily demand until the order is acknowledged.</p>
  `;
  els.summaryDraft.textContent = buildSummary();
}

function renderTimeline(row) {
  if (!row || !els.timelineChart) return;

  const horizon = 30;
  const points = buildTimelinePoints(row, horizon);
  const maxInventory = Math.max(row.currentStock + row.onOrder + row.reorderQty, row.targetStock, ...points.map((point) => point.inventory), 1);
  const stockoutDay = points.find((point) => point.inventory <= 0)?.day;
  const reorderArrivalDay = row.effectiveLeadTime;
  const width = 760;
  const height = 260;
  const pad = { left: 56, right: 24, top: 28, bottom: 42 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const x = (day) => pad.left + (day / horizon) * chartWidth;
  const y = (inventory) => pad.top + chartHeight - (Math.max(inventory, 0) / maxInventory) * chartHeight;
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.day).toFixed(1)} ${y(point.inventory).toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L ${x(horizon).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
  const stockoutBand = stockoutDay !== undefined ? `<rect class="chart-danger" x="${x(stockoutDay)}" y="${pad.top}" width="${x(horizon) - x(stockoutDay)}" height="${chartHeight}" />` : "";
  const stockoutMarker =
    stockoutDay !== undefined
      ? `<line class="chart-stockout" x1="${x(stockoutDay)}" x2="${x(stockoutDay)}" y1="${pad.top}" y2="${pad.top + chartHeight}" />
         <text class="chart-callout" x="${x(stockoutDay) + 8}" y="${pad.top + 18}">Stockout day ${stockoutDay}</text>`
      : "";

  if (stockoutDay !== undefined) {
    const timing = stockoutDay < reorderArrivalDay ? "before" : "after";
    els.timelineSummary.textContent = `${row.name} is projected to stock out around day ${stockoutDay}, ${timing} the effective replenishment lead time of ${reorderArrivalDay} days.`;
  } else {
    els.timelineSummary.textContent = `${row.name} stays above zero through the 30-day horizon after planned replenishment timing.`;
  }

  els.timelineChart.innerHTML = `
    <line class="chart-axis" x1="${pad.left}" x2="${pad.left}" y1="${pad.top}" y2="${pad.top + chartHeight}" />
    <line class="chart-axis" x1="${pad.left}" x2="${pad.left + chartWidth}" y1="${pad.top + chartHeight}" y2="${pad.top + chartHeight}" />
    <line class="chart-grid" x1="${pad.left}" x2="${pad.left + chartWidth}" y1="${y(maxInventory / 2)}" y2="${y(maxInventory / 2)}" />
    <line class="chart-grid" x1="${pad.left}" x2="${pad.left + chartWidth}" y1="${y(maxInventory * 0.25)}" y2="${y(maxInventory * 0.25)}" />
    ${stockoutBand}
    <path class="chart-fill" d="${fillPath}" />
    <path class="chart-line" d="${linePath}" />
    <line class="chart-marker" x1="${x(reorderArrivalDay)}" x2="${x(reorderArrivalDay)}" y1="${pad.top}" y2="${pad.top + chartHeight}" />
    ${stockoutMarker}
    <text class="chart-label" x="${pad.left}" y="${height - 12}">Today</text>
    <text class="chart-label" x="${x(10) - 18}" y="${height - 12}">Day 10</text>
    <text class="chart-label" x="${x(20) - 18}" y="${height - 12}">Day 20</text>
    <text class="chart-label" x="${x(30) - 28}" y="${height - 12}">Day 30</text>
    <text class="chart-callout" x="${Math.min(x(reorderArrivalDay) + 8, width - 210)}" y="${pad.top + chartHeight - 10}">Replenishment ETA</text>
    <text class="chart-label" x="8" y="${y(maxInventory)}">${Math.round(maxInventory).toLocaleString()}</text>
    <text class="chart-label" x="22" y="${y(0) + 4}">0</text>
  `;
}

function buildTimelinePoints(row, horizon) {
  const points = [];
  let inventory = row.currentStock;

  for (let day = 0; day <= horizon; day += 1) {
    if (day === row.leadTimeDays) {
      inventory += row.onOrder;
    }
    if (day === row.effectiveLeadTime) {
      inventory += row.reorderQty;
    }
    points.push({ day, inventory: Math.max(0, inventory) });
    inventory -= row.dailyDemand;
  }

  return points;
}

function buildSummary() {
  const critical = state.rows.filter((row) => row.riskLevel === "Critical").length;
  const high = state.rows.filter((row) => row.riskLevel === "High").length;
  const reorder = money(sum(state.rows, (row) => row.reorderCash));
  const supplierRisk = state.rows.filter((row) => row.supplierRiskScore >= 35).length;

  return `SupplySense AI is a supply chain decision assistant that predicts SKU-level stockout risk from current inventory, recent demand, open orders, unit cost, supplier lead time, and supplier reliability signals. In the demo dataset, it identifies ${critical} critical SKUs, ${high} high-risk SKUs, and ${supplierRisk} supplier-risk exposures, then recommends ${reorder} in replenishment actions. The system turns operational data into a prioritized planner queue, calculates days of cover, estimates reorder quantities with safety stock, and explains each recommendation in business language so inventory teams can act before service levels are impacted.`;
}

function exportPurchaseOrders() {
  const rows = state.rows.filter((row) => row.reorderQty > 0);
  if (!rows.length) {
    showToast("No purchase orders needed");
    return;
  }

  const headers = [
    "sku",
    "name",
    "supplier",
    "risk_level",
    "supplier_risk",
    "recommended_reorder_qty",
    "estimated_cash_need",
    "days_cover",
    "effective_lead_time_days",
    "reason",
    "action_note",
  ];

  const lines = rows.map((row) =>
    [
      row.sku,
      row.name,
      row.supplier,
      row.riskLevel,
      getSupplierRiskLevel(row.supplierRiskScore),
      row.reorderQty,
      row.reorderCash.toFixed(2),
      row.daysCover.toFixed(1),
      row.effectiveLeadTime,
      buildRecommendationReason(row),
      `Approve replenishment and confirm capacity with ${row.supplier}`,
    ]
      .map(csvEscape)
      .join(","),
  );

  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "supplysense-recommended-purchase-orders.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${rows.length} purchase order recommendations exported`);
}

function buildRecommendationReason(row) {
  const reasons = [];
  if (row.daysCover < row.effectiveLeadTime) {
    reasons.push(`days cover ${row.daysCover.toFixed(1)} below effective lead time ${row.effectiveLeadTime}`);
  }
  if (row.supplierRiskScore >= 35) {
    reasons.push(`supplier risk ${getSupplierRiskLevel(row.supplierRiskScore).toLowerCase()}`);
  }
  if (state.calibration.mode === "Optimized") {
    reasons.push(`optimized calibration ${state.calibration.safetyBuffer.toFixed(2)}x safety buffer`);
  }
  if (!reasons.length) {
    reasons.push("reorder recommended to maintain safety stock");
  }
  return reasons.join("; ");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function getHistoricalDemand(row) {
  return Array.from({ length: 8 }, (_, index) => number(row[`hist_wk_${8 - index}`])).filter((value) => value > 0);
}

function coefficientOfVariation(values) {
  if (!values.length) return 0;
  const mean = average(values);
  if (!mean) return 0;
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance) / mean;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length ? sum(filtered, (value) => value) / filtered.length : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  els.statusToast.textContent = message;
  els.statusToast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    els.statusToast.classList.remove("visible");
  }, 2200);
}

function number(value) {
  return Number.parseFloat(value) || 0;
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.loadSample.click();
