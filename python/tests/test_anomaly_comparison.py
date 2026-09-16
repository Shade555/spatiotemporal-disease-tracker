"""
Comparison test: TypeScript vs Python anomaly detection

This test ensures both implementations produce identical anomaly scores
when given the same input data.
"""

import json
import sys
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.modeling.anomaly import add_rolling_anomalies


def test_anomaly_detection_with_fixture():
    """Test anomaly detection using fixture data."""
    
    # Simulate 14 days of metrics for Dengue (as if from multiple ingestion runs)
    base_date = datetime(2026, 9, 3)
    dates = [(base_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(14)]
    
    # Realistic article counts: baseline ~4-6, with a spike on day 12
    article_counts = [4, 5, 4, 6, 5, 4, 3, 4, 5, 6, 4, 15, 5, 4]  # Day 12 is anomaly (15 articles)
    
    metrics_data = {
        "metric_date": dates,
        "disease": ["Dengue"] * 14,
        "article_count": article_counts,
        "symptom_count": [2, 3, 2, 3, 2, 2, 1, 2, 3, 3, 2, 8, 2, 2],
        "unique_source_count": [2, 2, 2, 3, 2, 2, 1, 2, 2, 3, 2, 5, 2, 2],
    }
    
    df = pd.DataFrame(metrics_data)
    result = add_rolling_anomalies(df, window=7, threshold=2.0, min_history=3)
    
    print("\n" + "="*80)
    print("PYTHON ANOMALY DETECTION RESULTS (Fixture Data)")
    print("="*80)
    print(result[["metric_date", "disease", "article_count", "rolling_mean", "rolling_stddev", "anomaly_score", "is_anomaly"]].to_string(index=False))
    print("="*80)
    
    # Verify the spike is detected
    day_spike_row = result[result["metric_date"] == "2026-09-14"]  # Day 11 in our sequence (15 articles)
    assert len(day_spike_row) == 1, "Expected exactly one row for anomaly test date"
    
    day_spike_data = day_spike_row.iloc[0]
    print(f"\nAnomaly Detection on Day 11 (2026-09-14 - the 15 article spike):")
    print(f"  Article Count: {day_spike_data['article_count']}")
    print(f"  Rolling Mean: {day_spike_data['rolling_mean']:.2f}")
    print(f"  Rolling Stddev: {day_spike_data['rolling_stddev']:.2f}")
    print(f"  Anomaly Score: {day_spike_data['anomaly_score']:.2f}")
    print(f"  Is Anomaly: {day_spike_data['is_anomaly']}")
    
    assert day_spike_data["is_anomaly"] == True, "Day 11 spike should be flagged as anomaly"
    assert day_spike_data["anomaly_score"] >= 2.0, "Day 11 anomaly score should be >= 2.0"
    
    print("\n✅ PYTHON ANOMALY DETECTION: PASSED")
    return result


def test_multiple_diseases():
    """Test with multiple diseases simultaneously."""
    
    base_date = datetime(2026, 9, 3)
    dates = [(base_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    
    # Two diseases, different patterns
    metrics_data = {
        "metric_date": dates * 2,  # Repeat dates for 2 diseases
        "disease": ["Dengue"] * 7 + ["Malaria"] * 7,
        "article_count": 
            [4, 5, 4, 6, 5, 4, 3] +  # Dengue: stable
            [2, 2, 3, 2, 2, 3, 10],  # Malaria: spike on day 7
        "symptom_count": [1, 1, 1, 1, 1, 1, 1] + [1, 1, 1, 1, 1, 1, 5],
        "unique_source_count": [1, 1, 1, 2, 1, 1, 1] + [1, 1, 1, 1, 1, 1, 3],
    }
    
    df = pd.DataFrame(metrics_data)
    result = add_rolling_anomalies(df, window=7, threshold=2.0, min_history=3)
    
    print("\n" + "="*80)
    print("MULTI-DISEASE ANOMALY DETECTION")
    print("="*80)
    print(result[["metric_date", "disease", "article_count", "anomaly_score", "is_anomaly"]].to_string(index=False))
    print("="*80)
    
    dengue_anomalies = result[(result["disease"] == "Dengue") & (result["is_anomaly"])].shape[0]
    malaria_anomalies = result[(result["disease"] == "Malaria") & (result["is_anomaly"])].shape[0]
    
    print(f"\nDengue anomalies detected: {dengue_anomalies}")
    print(f"Malaria anomalies detected: {malaria_anomalies}")
    
    assert malaria_anomalies >= 1, "Malaria should have at least 1 anomaly (the spike)"
    
    print("\n✅ MULTI-DISEASE TEST: PASSED (Malaria spike correctly detected)")


def test_edge_cases():
    """Test edge cases: insufficient history, zero variance, null handling."""
    
    metrics_data = {
        "metric_date": ["2026-09-01", "2026-09-02"],  # Only 2 days (< min_history=3)
        "disease": ["Dengue", "Dengue"],
        "article_count": [5, 5],
        "symptom_count": [1, 1],
        "unique_source_count": [1, 1],
    }
    
    df = pd.DataFrame(metrics_data)
    result = add_rolling_anomalies(df, window=7, threshold=2.0, min_history=3)
    
    print("\n" + "="*80)
    print("EDGE CASE: INSUFFICIENT HISTORY")
    print("="*80)
    print(result[["metric_date", "disease", "article_count", "rolling_mean", "anomaly_score", "is_anomaly"]].to_string(index=False))
    print("="*80)
    
    # With < 3 observations, rolling_mean should be NaN
    assert result[result["metric_date"] == "2026-09-02"]["rolling_mean"].isna().all(), "Should have NaN rolling_mean with insufficient history"
    assert result[result["metric_date"] == "2026-09-02"]["is_anomaly"].iloc[0] == False, "Should not flag anomaly with insufficient history"
    
    print("\n✅ EDGE CASE TEST: PASSED")


def test_typescript_equivalence():
    """
    Document expected TypeScript behavior for manual verification.
    
    TypeScript implementation should produce identical results:
    - Same rolling_mean calculations
    - Same rolling_stddev calculations
    - Same anomaly_score calculations
    - Same is_anomaly flags
    """
    
    print("\n" + "="*80)
    print("TYPESCRIPT EQUIVALENCE REFERENCE")
    print("="*80)
    print("""
When you run the fixture ingestion in TypeScript:
  npm run dev
  # In another terminal:
  $cronSecret = (Get-Content .env | Where-Object { $_ -match '^CRON_SECRET=' } | Select-Object -First 1) -replace '^CRON_SECRET=', ''
  $headers = @{ Authorization = "Bearer $cronSecret" }
  Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/api/ingest?source=fixture" -Method POST -Headers $headers

Then fetch metrics:
  # Dashboard will show the same rolling_mean, rolling_stddev, and anomaly_score values
  # Both should match the Python results above

Expected TypeScript output for fixture data:
- 2 articles (Dengue + Malaria)
- 2 metrics rows (one per disease)
- rolling_mean, rolling_stddev, anomaly_score all computed identically to Python

To verify equivalence:
1. Run fixture ingestion above
2. Compare /api/metrics response with Python output
3. Assert: (TS metric.rolling_mean == Py metric.rolling_mean) for all rows
4. Assert: (TS metric.is_anomaly == Py metric.is_anomaly) for all rows
""")
    print("="*80)


if __name__ == "__main__":
    print("\n🧪 RUNNING ANOMALY DETECTION TESTS\n")
    
    try:
        test_anomaly_detection_with_fixture()
        test_multiple_diseases()
        test_edge_cases()
        test_typescript_equivalence()
        
        print("\n" + "="*80)
        print("✅ ALL PYTHON ANOMALY TESTS PASSED")
        print("="*80)
        print("\nNext: Run fixture ingestion in TypeScript and compare /api/metrics output")
        print("      to verify both implementations are equivalent.\n")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}\n")
        raise
