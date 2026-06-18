# SupplySense AI

SupplySense AI is an inventory risk and replenishment assistant for the Ignite64 Supply Chain AI track.

It forecasts SKU-level stockout risk from current stock, recent demand, lead time, open orders, and supplier reliability signals, then recommends reorder quantities and generates planner-friendly explanations.

## Demo Flow

1. Open `index.html` in a browser.
2. Click `Load Sample` or upload a CSV with the same columns as `data/sample_inventory.csv`.
3. Review the risk dashboard and SKU table.
4. Select a high-risk SKU to show the explanation panel and stockout timeline.
5. Use the stockout timeline to compare projected inventory against replenishment ETA.
6. Export the recommended purchase order CSV.
7. Copy the generated project summary draft for the hackathon submission.

## CSV Columns

```text
sku,name,category,current_stock,lead_time_days,supplier,on_order,last_14d_sales,unit_cost,supplier_reliability,avg_delay_days,defect_rate,region_risk
```

## Judging Story

Supply chain planners need to know which items will stock out before replenishment arrives. SupplySense AI turns raw inventory data into prioritized actions:

- predicts days of cover from recent demand
- compares cover against supplier lead time
- recommends reorder quantities with safety stock
- estimates cash required for replenishment
- adjusts effective lead time using supplier reliability, delay, defect, and regional risk signals
- visualizes projected inventory, stockout timing, and replenishment ETA for the selected SKU
- exports a recommended purchase order CSV for operational follow-up
- explains the business reason behind each risk score

## Next Enhancements

- Add a richer 3-minute demo dataset
- Connect an LLM API for dynamic explanations
- Add supplier alternatives and second-source recommendations
- Add demand velocity comparison across categories
