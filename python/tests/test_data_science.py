from __future__ import annotations

from pathlib import Path
import sys
import unittest

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from src.data.gdelt import articles_to_metrics, load_gdelt_fixture
from src.modeling.anomaly import add_rolling_anomalies
from src.nlp.extractor import extract_entities


FIXTURE = ROOT / "fixtures" / "gdelt" / "sample-response.json"


class DataScienceTests(unittest.TestCase):
    def test_fixture_loads_and_extracts_configured_disease_entities(self) -> None:
        articles = load_gdelt_fixture(FIXTURE)
        self.assertEqual(len(articles), 2)
        entities = extract_entities(articles[0]["title"], articles[0]["snippet"], ["Dengue", "Malaria", "Chikungunya"])
        self.assertIn("Dengue", {entity.disease for entity in entities})
        self.assertIn("high fever", {entity.normalized_value for entity in entities})

    def test_metrics_are_grouped_by_date_and_disease(self) -> None:
        articles = load_gdelt_fixture(FIXTURE)
        metrics = articles_to_metrics(articles, ["Dengue", "Malaria"])
        self.assertEqual(set(metrics["disease"]), {"Dengue", "Malaria"})
        self.assertEqual(metrics["article_count"].sum(), 2)
        self.assertEqual(metrics.loc[metrics["disease"] == "Dengue", "symptom_count"].iloc[0], 3)

    def test_anomaly_baseline_does_not_use_current_value(self) -> None:
        metrics = pd.DataFrame({
            "metric_date": pd.date_range("2026-09-01", periods=5),
            "disease": ["Dengue"] * 5,
            "article_count": [1, 2, 3, 2, 20],
        })
        result = add_rolling_anomalies(metrics, window=3, min_history=3, threshold=2)
        self.assertTrue(pd.isna(result.loc[0, "rolling_mean"]))
        self.assertAlmostEqual(result.loc[4, "rolling_mean"], 7 / 3)
        self.assertTrue(result.loc[4, "is_anomaly"])

    def test_empty_fixture_is_safe(self) -> None:
        metrics = articles_to_metrics([], ["Dengue", "Malaria"])
        self.assertTrue(metrics.empty)


if __name__ == "__main__":
    unittest.main()
