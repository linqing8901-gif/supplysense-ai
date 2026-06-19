import argparse
import hashlib
from pathlib import Path

import pandas as pd


OUTPUT_COLUMNS = [
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
]

SUPPLIERS = [
    ("Northstar Wholesale", 94, 0.6, 0.4, "Low", 7),
    ("Harbor Retail Supply", 88, 1.4, 0.8, "Medium", 10),
    ("Crownline Imports", 80, 2.8, 1.6, "Medium", 14),
    ("PeakSeason Trading", 73, 4.1, 2.4, "High", 18),
]


def bucket_for(value: str, modulo: int) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % modulo


def clean_retail_data(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path)
    df.columns = [str(column).strip() for column in df.columns]
    required = {"StockCode", "Description", "Quantity", "InvoiceDate", "UnitPrice"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required UCI fields: {', '.join(sorted(missing))}")

    df = df[list(required)].copy()
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], errors="coerce")
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
    df["UnitPrice"] = pd.to_numeric(df["UnitPrice"], errors="coerce")
    df["StockCode"] = df["StockCode"].astype(str).str.strip()
    df["Description"] = df["Description"].astype(str).str.strip()
    df = df.dropna(subset=["InvoiceDate", "Quantity", "UnitPrice", "StockCode", "Description"])
    df = df[(df["Quantity"] > 0) & (df["UnitPrice"] > 0)]
    df = df[~df["Description"].str.lower().isin(["nan", "manual", "postage"])]
    return df


def build_supplysense_rows(df: pd.DataFrame, limit: int) -> pd.DataFrame:
    latest_date = df["InvoiceDate"].max()
    recent_start = latest_date - pd.Timedelta(days=14)
    history_start = latest_date - pd.Timedelta(weeks=8)
    recent = df[df["InvoiceDate"] >= recent_start]
    history = df[(df["InvoiceDate"] >= history_start) & (df["InvoiceDate"] <= latest_date)]

    top_skus = (
        recent.groupby("StockCode")["Quantity"]
        .sum()
        .sort_values(ascending=False)
        .head(limit)
        .index.tolist()
    )

    rows = []
    for sku in top_skus:
        sku_history = history[history["StockCode"] == sku].copy()
        sku_recent = recent[recent["StockCode"] == sku]
        sku_all = df[df["StockCode"] == sku]
        if sku_history.empty or sku_recent.empty:
            continue

        supplier_name, reliability, delay_days, defect_rate, region_risk, lead_time = SUPPLIERS[bucket_for(sku, len(SUPPLIERS))]
        pack_size = [10, 20, 25, 50, 100][bucket_for(f"{sku}-pack", 5)]
        min_order_qty = pack_size * [2, 3, 4, 5][bucket_for(f"{sku}-moq", 4)]
        last_14d_sales = int(sku_recent["Quantity"].sum())
        daily_demand = max(last_14d_sales / 14, 0.1)
        cover_days = [5, 8, 11, 16, 22, 28][bucket_for(f"{sku}-cover", 6)]
        current_stock = int(round(daily_demand * cover_days))
        on_order = int(round(daily_demand * [0, 3, 6, 9][bucket_for(f"{sku}-onorder", 4)]))
        warehouse_capacity = max(current_stock + on_order + min_order_qty * 3, int(round(daily_demand * 45)))
        weekly = []
        for week_index in range(8, 0, -1):
            start = latest_date - pd.Timedelta(weeks=week_index)
            end = latest_date - pd.Timedelta(weeks=week_index - 1)
            weekly.append(int(sku_history[(sku_history["InvoiceDate"] >= start) & (sku_history["InvoiceDate"] < end)]["Quantity"].sum()))

        rows.append(
            {
                "sku": f"UCI-{sku}",
                "name": sku_all["Description"].mode().iat[0][:48],
                "category": "Public Retail",
                "current_stock": current_stock,
                "lead_time_days": lead_time,
                "supplier": supplier_name,
                "on_order": on_order,
                "last_14d_sales": last_14d_sales,
                "unit_cost": round(float(sku_all["UnitPrice"].median()), 2),
                "supplier_reliability": reliability,
                "avg_delay_days": delay_days,
                "defect_rate": defect_rate,
                "region_risk": region_risk,
                "min_order_qty": min_order_qty,
                "pack_size": pack_size,
                "warehouse_capacity": warehouse_capacity,
                "hist_wk_8": weekly[0],
                "hist_wk_7": weekly[1],
                "hist_wk_6": weekly[2],
                "hist_wk_5": weekly[3],
                "hist_wk_4": weekly[4],
                "hist_wk_3": weekly[5],
                "hist_wk_2": weekly[6],
                "hist_wk_1": weekly[7],
            }
        )

    return pd.DataFrame(rows, columns=OUTPUT_COLUMNS)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert UCI Online Retail transactions into SupplySense CSV format.")
    parser.add_argument("input", type=Path, help="Path to Online Retail.xlsx")
    parser.add_argument("--output", type=Path, default=Path("data/uci_online_retail_converted.csv"))
    parser.add_argument("--limit", type=int, default=20, help="Number of high-volume SKUs to export")
    args = parser.parse_args()

    df = clean_retail_data(args.input)
    output = build_supplysense_rows(df, args.limit)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(args.output, index=False)
    print(f"Wrote {len(output)} rows to {args.output}")


if __name__ == "__main__":
    main()
