const state = {
  rows: [],
  selectedSku: null,
  filter: "all",
};

const SAMPLE_CSV = `sku,name,category,current_stock,lead_time_days,supplier,on_order,last_14d_sales,unit_cost
SKU-1001,Insulin Cold Pack,Healthcare Logistics,180,9,NorthBridge Medical,40,312,12.50
SKU-1002,Portable Glucose Strip,Healthcare Logistics,620,6,MedAxis Supply,150,498,4.10
SKU-1003,N95 Respirator Box,Protective Equipment,95,12,ShieldWorks,0,210,8.75
SKU-1004,IV Starter Kit,Clinical Supplies,260,8,NorthBridge Medical,60,226,14.20
SKU-1005,Smart Thermometer,Devices,48,15,Quantiva Devices,20,84,19.90
SKU-1006,Disposable Syringe Pack,Clinical Supplies,980,5,MedAxis Supply,300,770,2.40
SKU-1007,First Aid Refill Kit,Emergency Supplies,130,10,SafeRoute Global,50,112,7.60
SKU-1008,Electrolyte Sachet,Pharmacy,340,7,VitaLink Pharma,120,392,1.20
SKU-1009,Digital BP Monitor,Devices,26,18,Quantiva Devices,10,38,34.00
SKU-1010,Wound Dressing Roll,Clinical Supplies,410,6,ShieldWorks,80,280,3.80
SKU-1011,Cold Chain Label,Logistics,220,14,SafeRoute Global,0,168,0.95
SKU-1012,Sanitizer Refill Can,Facility Supplies,560,5,CleanCore,200,455,5.50`;

const els = {
  csvInput: document.getElementById("csvInput"),
  loadSample: document.getElementById("loadSample"),
  riskFilter: document.getElementById("riskFilter"),
  inventoryRows: document.getElementById("inventoryRows"),
  criticalCount: document.getElementById("criticalCount"),
  riskValue: document.getElementById("riskValue"),
  reorderValue: document.getElementById("reorderValue"),
  medianCover: document.getElementById("medianCover"),
  selectedSku: document.getElementById("selectedSku"),
  insightText: document.getElementById("insightText"),
  riskGauge: document.querySelector("#riskGauge span"),
  summaryDraft: document.getElementById("summaryDraft"),
};

els.loadSample.addEventListener("click", async () => {
  try {
    const response = await fetch("data/sample_inventory.csv");
    loadCsv(await response.text());
  } catch {
    loadCsv(SAMPLE_CSV);
  }
});

els.csvInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  loadCsv(await file.text());
});

els.riskFilter.addEventListener("change", (event) => {
  state.filter = event.target.value;
  render();
});

function loadCsv(csvText) {
  state.rows = parseCsv(csvText).map(scoreInventoryRow);
  state.rows.sort((a, b) => b.riskScore - a.riskScore || b.reorderCash - a.reorderCash);
  state.selectedSku = state.rows[0]?.sku ?? null;
  render();
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
  const dailyDemand = Math.max(last14dSales / 14, 0.1);
  const availableBeforeReplenishment = currentStock + onOrder;
  const daysCover = availableBeforeReplenishment / dailyDemand;
  const safetyDays = Math.max(3, Math.ceil(leadTimeDays * 0.35));
  const targetStock = Math.ceil(dailyDemand * (leadTimeDays + safetyDays + 7));
  const reorderQty = Math.max(0, targetStock - availableBeforeReplenishment);
  const reorderCash = reorderQty * unitCost;
  const leadTimeGap = leadTimeDays - daysCover;
  const riskScore = Math.max(0, Math.min(100, Math.round(52 + leadTimeGap * 8 + reorderQty / Math.max(dailyDemand, 1) * 2)));
  const riskLevel = getRiskLevel(riskScore, daysCover, leadTimeDays);

  return {
    ...row,
    currentStock,
    leadTimeDays,
    onOrder,
    last14dSales,
    unitCost,
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

function render() {
  const filteredRows = state.filter === "all" ? state.rows : state.rows.filter((row) => row.riskLevel === state.filter);
  renderMetrics();
  renderTable(filteredRows);
  renderInsight(state.rows.find((row) => row.sku === state.selectedSku) ?? state.rows[0]);
}

function renderMetrics() {
  const criticalRows = state.rows.filter((row) => row.riskLevel === "Critical");
  const riskyRows = state.rows.filter((row) => ["Critical", "High"].includes(row.riskLevel));
  const covers = state.rows.map((row) => row.daysCover).sort((a, b) => a - b);
  const median = covers.length ? covers[Math.floor(covers.length / 2)] : 0;

  els.criticalCount.textContent = criticalRows.length;
  els.riskValue.textContent = money(sum(riskyRows, (row) => row.currentStock * row.unitCost));
  els.reorderValue.textContent = money(sum(state.rows, (row) => row.reorderCash));
  els.medianCover.textContent = `${median.toFixed(1)} days`;
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
      <td>${row.leadTimeDays} days</td>
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

  els.selectedSku.textContent = `${row.sku} · ${row.name}`;
  els.riskGauge.style.width = `${row.riskScore}%`;
  els.insightText.innerHTML = `
    <p><strong>${row.riskLevel} risk:</strong> ${escapeHtml(row.name)} has ${row.daysCover.toFixed(1)} days of cover against a ${row.leadTimeDays}-day supplier lead time.</p>
    <ul>
      <li>Recent demand is ${row.dailyDemand.toFixed(1)} units per day based on the last 14 days.</li>
      <li>Available supply before replenishment is ${Math.round(row.currentStock + row.onOrder).toLocaleString()} units.</li>
      <li>Recommended reorder is ${row.reorderQty.toLocaleString()} units, requiring about ${money(row.reorderCash)}.</li>
      <li>Planning buffer uses ${row.safetyDays} safety days because supplier lead time is ${row.leadTimeDays} days.</li>
    </ul>
    <p><strong>Action:</strong> prioritize purchase approval, confirm supplier capacity with ${escapeHtml(row.supplier)}, and monitor daily demand until the order is acknowledged.</p>
  `;
  els.summaryDraft.textContent = buildSummary();
}

function buildSummary() {
  const critical = state.rows.filter((row) => row.riskLevel === "Critical").length;
  const high = state.rows.filter((row) => row.riskLevel === "High").length;
  const reorder = money(sum(state.rows, (row) => row.reorderCash));

  return `SupplySense AI is a supply chain decision assistant that predicts SKU-level stockout risk from current inventory, recent demand, open orders, unit cost, and supplier lead time. In the demo dataset, it identifies ${critical} critical SKUs and ${high} high-risk SKUs, then recommends ${reorder} in replenishment actions. The system turns operational data into a prioritized planner queue, calculates days of cover, estimates reorder quantities with safety stock, and explains each recommendation in business language so inventory teams can act before service levels are impacted.`;
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
