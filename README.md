# SupplySense AI

SupplySense AI is an inventory risk and replenishment copilot for the Ignite64 Supply Chain AI track. It helps supply chain planners identify SKU-level stockout risk, understand supplier-driven delays, and generate replenishment actions before service levels are impacted.

## Problem

Inventory teams often rely on static spreadsheets and delayed reports. By the time a planner notices that a fast-moving SKU is running low, supplier lead time, open order uncertainty, and regional risk may already make recovery expensive.

## Solution

SupplySense AI turns operational inventory data into a prioritized decision queue. It combines current stock, recent demand, open orders, supplier lead time, reliability, average delay, defect rate, and regional risk to forecast stockout exposure and recommend reorder quantities.

## Features

- SKU-level stockout risk scoring
- Days of cover and effective lead time calculation
- Supplier risk scoring from reliability, delay, defect, and region signals
- Recommended reorder quantity and estimated cash need
- Stockout timeline visualization for the selected SKU
- Planner-friendly natural language explanations
- Recommended purchase order CSV export
- Submission summary draft for hackathon reporting

## Demo Flow

1. Open `index.html` in a browser.
2. Click `Load Sample` or upload a CSV with the same columns as `data/sample_inventory.csv`.
3. Review the top risk metrics and project value summary.
4. Select a high-risk SKU in the priority queue.
5. Read the planner brief and supplier risk explanation.
6. Use the stockout timeline to compare projected inventory against replenishment ETA.
7. Export the recommended purchase order CSV.

## CSV Columns

```text
sku,name,category,current_stock,lead_time_days,supplier,on_order,last_14d_sales,unit_cost,supplier_reliability,avg_delay_days,defect_rate,region_risk
```

## How It Works

SupplySense AI estimates daily demand from the last 14 days of sales, calculates days of cover from available inventory, then adjusts lead time using supplier delay and risk signals. The risk score increases when demand will exhaust inventory before replenishment can arrive, when supplier reliability is low, or when the recommended reorder quantity is large.

The app also calculates safety stock and target stock levels, then recommends a reorder quantity and estimated cash requirement. For demo clarity, the model runs fully in the browser using JavaScript and a sample CSV dataset.

## Model Assumptions

The current demo uses synthetic inventory and supplier-risk data designed to simulate realistic supply chain planning scenarios. The scoring model is an interpretable heuristic based on common inventory planning concepts, including days of cover, lead time, safety stock, reorder quantity, and supplier reliability.

The `Critical`, `High`, `Watch`, and `Stable` thresholds are configurable demo assumptions, not fixed industry standards. In a production deployment, these thresholds would be calibrated using historical demand, supplier performance, target service levels, and business risk tolerance.

## Tech Stack

- HTML
- CSS
- JavaScript
- SVG-based timeline visualization
- CSV parsing and export in the browser

## AI Usage

AI assistance was used during development for ideation, interface copy, and implementation support. The project logic, demo dataset, and final implementation are included in this repository for review.

## Project Materials

- `docs/submission-summary.md`: 500-word hackathon submission summary draft
- `docs/demo-script.md`: 3-minute demo video script

## Future Enhancements

- Add richer demand forecast methods
- Connect an LLM API for dynamic planner explanations
- Add supplier alternatives and second-source recommendations
- Add demand velocity comparison across categories
- Add authentication and persistent uploaded datasets
