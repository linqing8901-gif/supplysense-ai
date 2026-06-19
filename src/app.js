const state = {
  rawRows: [],
  rows: [],
  selectedSku: null,
  filter: "all",
  dataSourceName: "Medical Demo",
  plannerDecisions: {},
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

const CSV_HEADERS = [
  "sku",
  "name",
  "category",
  "current_stock",
  "lead_time_days",
  "supplier",
  "on_order",
  "last_14d_sales",
  "unit_cost",
  "supplier_reliability",
  "avg_delay_days",
  "defect_rate",
  "region_risk",
  "min_order_qty",
  "pack_size",
  "warehouse_capacity",
  "hist_wk_8",
  "hist_wk_7",
  "hist_wk_6",
  "hist_wk_5",
  "hist_wk_4",
  "hist_wk_3",
  "hist_wk_2",
  "hist_wk_1",
];

const CSV_TEMPLATE_ROW = [
  "SKU-0001",
  "Example Product",
  "Example Category",
  "120",
  "10",
  "Example Supplier",
  "40",
  "210",
  "8.50",
  "90",
  "1.5",
  "0.8",
  "Medium",
  "100",
  "25",
  "500",
  "70",
  "76",
  "82",
  "88",
  "91",
  "96",
  "94",
  "101",
];

const SAMPLE_CSV = `sku,name,category,current_stock,lead_time_days,supplier,on_order,last_14d_sales,unit_cost,supplier_reliability,avg_delay_days,defect_rate,region_risk,min_order_qty,pack_size,warehouse_capacity,hist_wk_8,hist_wk_7,hist_wk_6,hist_wk_5,hist_wk_4,hist_wk_3,hist_wk_2,hist_wk_1
SKU-1001,Insulin Cold Pack,Healthcare Logistics,180,9,NorthBridge Medical,40,312,12.50,91,1.2,0.8,Low,80,20,520,118,132,141,149,156,168,151,161
SKU-1002,Portable Glucose Strip,Healthcare Logistics,620,6,MedAxis Supply,150,498,4.10,95,0.4,0.5,Low,120,50,1100,220,238,246,252,261,249,254,244
SKU-1003,N95 Respirator Box,Protective Equipment,95,12,ShieldWorks,0,210,8.75,78,3.8,2.1,Medium,100,25,420,66,72,84,101,95,118,102,108
SKU-1004,IV Starter Kit,Clinical Supplies,260,8,NorthBridge Medical,60,226,14.20,91,1.2,0.8,Low,60,10,580,98,104,111,108,116,123,112,114
SKU-1005,Smart Thermometer,Devices,48,15,Quantiva Devices,20,84,19.90,71,4.6,2.8,High,40,10,180,20,31,28,36,42,39,46,38
SKU-1006,Disposable Syringe Pack,Clinical Supplies,980,5,MedAxis Supply,300,770,2.40,95,0.4,0.5,Low,250,100,1800,330,350,368,372,386,398,391,379
SKU-1007,First Aid Refill Kit,Emergency Supplies,130,10,SafeRoute Global,50,112,7.60,82,2.2,1.2,Medium,40,10,340,46,50,54,52,60,57,56,61
SKU-1008,Electrolyte Sachet,Pharmacy,340,7,VitaLink Pharma,120,392,1.20,88,1.6,0.9,Medium,150,50,820,146,152,178,165,190,205,198,194
SKU-1009,Digital BP Monitor,Devices,26,18,Quantiva Devices,10,38,34.00,71,4.6,2.8,High,20,5,100,10,13,15,14,18,22,19,20
SKU-1010,Wound Dressing Roll,Clinical Supplies,410,6,ShieldWorks,80,280,3.80,78,3.8,2.1,Medium,80,20,760,118,126,134,142,139,156,151,149
SKU-1011,Cold Chain Label,Logistics,220,14,SafeRoute Global,0,168,0.95,82,2.2,1.2,Medium,100,25,460,62,68,71,78,84,88,80,86
SKU-1012,Sanitizer Refill Can,Facility Supplies,560,5,CleanCore,200,455,5.50,93,0.8,0.4,Low,120,40,980,196,204,220,218,230,236,224,231`;

const RETAIL_CSV = `sku,name,category,current_stock,lead_time_days,supplier,on_order,last_14d_sales,unit_cost,supplier_reliability,avg_delay_days,defect_rate,region_risk,min_order_qty,pack_size,warehouse_capacity,hist_wk_8,hist_wk_7,hist_wk_6,hist_wk_5,hist_wk_4,hist_wk_3,hist_wk_2,hist_wk_1
RTL-2001,Wireless Earbuds,Consumer Electronics,140,18,Pacific Audio Co,40,196,28.50,76,4.2,2.4,High,100,20,420,72,78,81,86,92,104,98,110
RTL-2002,USB-C Charging Cable,Accessories,1220,7,NorthPort Components,300,910,3.20,92,0.9,0.6,Low,500,100,2200,380,402,418,436,452,460,448,455
RTL-2003,Insulated Water Bottle,Home Goods,260,12,EverPeak Goods,0,238,9.40,84,2.6,1.1,Medium,120,24,620,84,91,104,112,118,130,126,132
RTL-2004,Organic Coffee Beans,Grocery,310,9,Roastline Foods,160,420,6.75,88,1.4,0.8,Medium,150,30,900,166,178,186,201,210,222,218,226
RTL-2005,Yoga Mat,Wellness,75,16,FlexiSource,20,98,13.90,73,3.9,2.2,High,80,10,260,34,38,42,46,50,57,54,62
RTL-2006,LED Desk Lamp,Home Office,190,20,BrightWorks Supply,40,154,18.20,79,3.2,1.8,Medium,60,12,360,52,57,61,66,70,76,73,81
RTL-2007,Kids Rain Jacket,Apparel,420,14,Harbor Stitch,120,308,15.60,86,1.8,1.0,Medium,150,25,880,120,134,141,150,160,168,166,174
RTL-2008,Notebook 3-Pack,Stationery,980,6,PaperTrail Wholesale,240,812,2.10,94,0.6,0.4,Low,400,100,1800,340,352,370,382,396,410,404,416
RTL-2009,Smart Plug,Consumer Electronics,60,21,Pacific Audio Co,0,84,11.80,76,4.2,2.4,High,80,20,220,24,27,31,36,40,44,42,48
RTL-2010,Protein Bar Variety Pack,Grocery,510,8,FreshRoute Foods,180,560,8.25,89,1.3,0.9,Medium,200,40,1050,220,234,246,258,274,286,280,292
RTL-2011,Reusable Tote Bag,Accessories,720,5,GreenCarry Supply,160,392,1.85,96,0.3,0.3,Low,300,100,1400,162,170,184,190,198,206,202,210
RTL-2012,Bluetooth Speaker,Consumer Electronics,88,19,BrightWorks Supply,20,112,24.50,79,3.2,1.8,Medium,60,10,300,38,42,47,52,58,64,61,68`;

const els = {
  csvInput: document.getElementById("csvInput"),
  demoDataset: document.getElementById("demoDataset"),
  downloadTemplate: document.getElementById("downloadTemplate"),
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
  validationMessage: document.getElementById("validationMessage"),
  beforeCritical: document.getElementById("beforeCritical"),
  afterCritical: document.getElementById("afterCritical"),
  beforeReorder: document.getElementById("beforeReorder"),
  afterReorder: document.getElementById("afterReorder"),
  beforeCover: document.getElementById("beforeCover"),
  afterCover: document.getElementById("afterCover"),
};

els.demoDataset.addEventListener("change", async () => {
  if (!els.demoDataset.value) return;
  if (els.demoDataset.value === "retail") {
    await loadCsvFromPath("data/retail_inventory.csv", "Retail Demo", RETAIL_CSV);
    return;
  }
  await loadCsvFromPath("data/sample_inventory.csv", "Medical Demo", SAMPLE_CSV);
});

els.downloadTemplate.addEventListener("click", () => {
  downloadCsv("supplysense-upload-template.csv", [CSV_HEADERS.join(","), CSV_TEMPLATE_ROW.map(csvEscape).join(",")].join("\n"));
  showToast("CSV template downloaded");
});

els.csvInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  loadCsv(await file.text(), file.name);
  showToast(buildValidationToast(file.name));
});

els.riskFilter.addEventListener("change", (event) => {
  state.filter = event.target.value;
  render();
});

els.inventoryRows.addEventListener("click", (event) => {
  const decisionButton = event.target.closest("button[data-decision]");
  if (decisionButton) {
    state.plannerDecisions[decisionButton.dataset.sku] = decisionButton.dataset.decision;
    render();
    showToast(`${decisionButton.dataset.sku} marked ${decisionButton.dataset.decision}`);
    return;
  }

  const row = event.target.closest("tr[data-sku]");
  if (row) {
    state.selectedSku = row.dataset.sku;
    render();
  }
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

async function loadCsvFromPath(path, sourceName, fallbackCsv = "") {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("CSV fetch failed");
    loadCsv(await response.text(), sourceName);
  } catch {
    if (!fallbackCsv) {
      showToast(`${sourceName} could not be loaded`);
      return;
    }
    loadCsv(fallbackCsv, sourceName);
  }
  showToast(`${sourceName} loaded`);
}

function loadCsv(csvText, sourceName = "Uploaded CSV") {
  state.dataSourceName = sourceName;
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
  if (!lines.length) return [];
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
  const minOrderQty = number(row.min_order_qty);
  const packSize = Math.max(1, number(row.pack_size) || 1);
  const warehouseCapacity = number(row.warehouse_capacity);
  const dailyDemand = Math.max(last14dSales / 14, 0.1);
  const availableBeforeReplenishment = currentStock + onOrder;
  const daysCover = availableBeforeReplenishment / dailyDemand;
  const supplierRiskScore = getSupplierRiskScore(supplierReliability, avgDelayDays, defectRate, regionRisk);
  const effectiveLeadTime = leadTimeDays + Math.ceil(avgDelayDays);
  const adjustedSupplierRisk = supplierRiskScore * state.calibration.supplierWeight;
  const safetyDays = Math.max(3, Math.ceil(effectiveLeadTime * (0.3 + adjustedSupplierRisk / 250) * state.calibration.safetyBuffer));
  const targetStock = Math.ceil(dailyDemand * (effectiveLeadTime + safetyDays + 7));
  const rawReorderQty = Math.max(0, targetStock - availableBeforeReplenishment);
  const constrainedOrder = applyOrderConstraints(rawReorderQty, minOrderQty, packSize, warehouseCapacity, availableBeforeReplenishment);
  const reorderQty = constrainedOrder.quantity;
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
    minOrderQty,
    packSize,
    warehouseCapacity,
    supplierRiskScore,
    effectiveLeadTime,
    dailyDemand,
    daysCover,
    safetyDays,
    targetStock,
    rawReorderQty,
    orderConstraintNote: constrainedOrder.note,
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

function applyOrderConstraints(rawQty, minOrderQty, packSize, warehouseCapacity, availableSupply) {
  if (rawQty <= 0) {
    return { quantity: 0, note: "No reorder needed" };
  }

  const notes = [];
  let quantity = rawQty;
  if (minOrderQty > 0 && quantity < minOrderQty) {
    quantity = minOrderQty;
    notes.push(`raised to MOQ ${minOrderQty}`);
  }

  const packedQty = Math.ceil(quantity / packSize) * packSize;
  if (packedQty !== quantity) {
    notes.push(`rounded to pack size ${packSize}`);
  }
  quantity = packedQty;

  if (warehouseCapacity > 0) {
    const capacityRoom = Math.max(0, warehouseCapacity - availableSupply);
    if (quantity > capacityRoom) {
      quantity = Math.max(0, Math.floor(capacityRoom / packSize) * packSize);
      notes.push(`capped by warehouse capacity ${warehouseCapacity}`);
    }
  }

  return {
    quantity,
    note: notes.length ? notes.join("; ") : "No order constraints applied",
  };
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
    els.validationMessage.textContent = "No rows loaded yet. Download the CSV template or load a demo dataset to start.";
    return;
  }

  const missing = state.dataQuality.missingFields.length ? ` Missing fields: ${state.dataQuality.missingFields.join(", ")}.` : "";
  els.readinessSummary.textContent = `${state.dataQuality.rowCount} rows loaded with ${Math.round(state.dataQuality.historyCoverage * 100)}% historical coverage. Calibration readiness is ${state.dataQuality.readiness}.${missing}`;
  els.validationMessage.textContent = `${state.dataSourceName}: ${state.dataQuality.rowCount} rows loaded, ${state.dataQuality.missingRequiredCount} missing required values, ${Math.round(state.dataQuality.historyCoverage * 100)}% history coverage. Readiness: ${state.dataQuality.readiness}.${missing}`;
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
    tr.dataset.sku = row.sku;
    const decision = state.plannerDecisions[row.sku] ?? "Review";
    tr.innerHTML = `
      <td><strong>${escapeHtml(row.sku)}</strong></td>
      <td>${escapeHtml(row.name)}<br><small>${escapeHtml(row.supplier)}</small></td>
      <td><span class="risk-pill risk-${row.riskLevel}">${row.riskLevel}</span></td>
      <td>${row.daysCover.toFixed(1)}</td>
      <td>${row.effectiveLeadTime} days</td>
      <td><span class="supplier-pill supplier-${getSupplierRiskLevel(row.supplierRiskScore)}">${getSupplierRiskLevel(row.supplierRiskScore)}</span></td>
      <td>${row.reorderQty.toLocaleString()}</td>
      <td>${money(row.reorderCash)}</td>
      <td>
        <div class="decision-controls" aria-label="Planner decision for ${escapeHtml(row.sku)}">
          ${["Approve", "Review", "Override"]
            .map(
              (option) =>
                `<button type="button" class="${decision === option ? "active" : ""}" data-sku="${escapeHtml(row.sku)}" data-decision="${option}">${option}</button>`,
            )
            .join("")}
        </div>
      </td>
    `;
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
      <li><strong>Demand:</strong> ${row.dailyDemand.toFixed(1)} units/day with ${Math.round(row.currentStock + row.onOrder).toLocaleString()} units available before replenishment.</li>
      <li><strong>Reorder:</strong> ${row.reorderQty.toLocaleString()} units, about ${money(row.reorderCash)}, after MOQ ${row.minOrderQty || 0}, pack size ${row.packSize}, and capacity rules.</li>
      <li><strong>Supplier:</strong> ${getSupplierRiskLevel(row.supplierRiskScore)} risk from ${row.supplierReliability}% reliability, ${row.avgDelayDays.toFixed(1)} delay days, and ${row.defectRate.toFixed(1)}% defect rate.</li>
      <li><strong>Calibration:</strong> ${state.calibration.mode} mode with ${row.safetyDays} safety days, ${state.calibration.safetyBuffer.toFixed(2)}x safety buffer, and ${state.calibration.supplierWeight.toFixed(2)}x supplier weight.</li>
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
  const height = 220;
  const pad = { left: 56, right: 24, top: 18, bottom: 36 };
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
    "raw_reorder_qty",
    "recommended_reorder_qty",
    "min_order_qty",
    "pack_size",
    "warehouse_capacity",
    "estimated_cash_need",
    "days_cover",
    "effective_lead_time_days",
    "reason",
    "planner_decision",
    "action_note",
  ];

  const lines = rows.map((row) =>
    [
      row.sku,
      row.name,
      row.supplier,
      row.riskLevel,
      getSupplierRiskLevel(row.supplierRiskScore),
      Math.ceil(row.rawReorderQty),
      row.reorderQty,
      row.minOrderQty,
      row.packSize,
      row.warehouseCapacity || "",
      row.reorderCash.toFixed(2),
      row.daysCover.toFixed(1),
      row.effectiveLeadTime,
      buildRecommendationReason(row),
      state.plannerDecisions[row.sku] ?? "Review",
      `Approve replenishment and confirm capacity with ${row.supplier}`,
    ]
      .map(csvEscape)
      .join(","),
  );

  downloadCsv("supplysense-recommended-purchase-orders.csv", [headers.join(","), ...lines].join("\n"));
  showToast(`${rows.length} purchase order recommendations exported`);
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  if (row.orderConstraintNote !== "No order constraints applied") {
    reasons.push(row.orderConstraintNote);
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

function buildValidationToast(sourceName) {
  const quality = state.dataQuality;
  return `${sourceName}: ${quality.readiness}, ${quality.rowCount} rows, ${Math.round(quality.historyCoverage * 100)}% history`;
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

loadCsv(SAMPLE_CSV, "Medical Demo");
