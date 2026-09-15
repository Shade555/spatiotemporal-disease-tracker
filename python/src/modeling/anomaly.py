from __future__ import annotations

import numpy as np
import pandas as pd


def add_rolling_anomalies(
    metrics: pd.DataFrame,
    window: int = 7,
    threshold: float = 2.0,
    min_history: int = 3,
) -> pd.DataFrame:
    """Add transparent rolling baseline and z-score fields without future leakage."""
    required = {"metric_date", "disease", "article_count"}
    missing = required.difference(metrics.columns)
    if missing:
        raise ValueError(f"Missing metric columns: {sorted(missing)}")
    if window < 2 or min_history < 1:
        raise ValueError("window must be >= 2 and min_history must be >= 1")

    result = metrics.copy()
    result["metric_date"] = pd.to_datetime(result["metric_date"], utc=True)
    result = result.sort_values(["disease", "metric_date"]).reset_index(drop=True)
    grouped = result.groupby("disease", sort=False)["article_count"]
    result["rolling_mean"] = grouped.transform(lambda values: values.shift(1).rolling(window, min_periods=min_history).mean())
    result["rolling_stddev"] = grouped.transform(lambda values: values.shift(1).rolling(window, min_periods=min_history).std(ddof=0))

    difference = result["article_count"] - result["rolling_mean"]
    valid = result["rolling_mean"].notna()
    nonzero_stddev = result["rolling_stddev"].fillna(0).gt(0)
    result["anomaly_score"] = np.where(valid & nonzero_stddev, difference / result["rolling_stddev"], np.nan)
    result["is_anomaly"] = result["anomaly_score"].ge(threshold).fillna(False)
    result["metric_date"] = result["metric_date"].dt.strftime("%Y-%m-%d")
    return result
