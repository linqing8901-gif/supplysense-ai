# Submission Summary Draft

SupplySense AI is a supply chain decision assistant that helps inventory planners predict SKU-level stockout risk, recommend replenishment quantities, and explain why each item needs action. The project addresses a common operational problem: teams often discover stockout exposure too late, after supplier lead times and open order delays have already limited recovery options.

The app accepts inventory data with SKU, category, stock level, supplier, open orders, recent sales, unit cost, lead time, supplier reliability, average delay, defect rate, and regional risk. It estimates daily demand from recent sales, calculates days of cover, adjusts effective lead time using supplier risk signals, and assigns each SKU a risk level. The system then recommends reorder quantities, estimates cash needed, and prioritizes items in a planner queue.

SupplySense AI adds explainability on top of the scoring logic. When a planner selects a SKU, the app generates a plain-language brief showing demand velocity, available supply, supplier risk, safety stock buffer, recommended reorder quantity, and next action. It also visualizes a 30-day stockout timeline, showing projected inventory, replenishment ETA, and any expected stockout window. This gives planners a faster way to understand not only what is risky, but why it is risky and what to do next.

The demo includes a browser-based dashboard, synthetic sample CSV data, supplier risk modeling, stockout timeline visualization, and recommended purchase order CSV export. The current model uses configurable heuristic thresholds based on common inventory planning concepts such as days of cover, lead time, safety stock, and supplier reliability. In production, these thresholds would be calibrated with historical demand, supplier performance, service-level targets, and business risk tolerance.

AI assistance was used for ideation, implementation support, and interface copy. The application logic and demo dataset are included in the GitHub repository for review.
