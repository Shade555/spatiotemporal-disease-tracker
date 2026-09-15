from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Iterable

import pandas as pd

from src.nlp.extractor import extract_entities


def load_gdelt_fixture(path: str | Path) -> list[dict[str, Any]]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    articles = payload.get("articles", [])
    if not isinstance(articles, list):
        raise ValueError("Fixture articles must be a list")
    return [article for article in articles if isinstance(article, dict)]


def parse_gdelt_date(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.strptime(value[:15], "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
    except ValueError:
        parsed = pd.to_datetime(value, utc=True, errors="coerce")
        if pd.isna(parsed):
            return datetime.now(timezone.utc)
        return parsed.to_pydatetime()


def articles_to_metrics(articles: Iterable[dict[str, Any]], diseases: Iterable[str]) -> pd.DataFrame:
    configured_diseases = tuple(dict.fromkeys(disease.strip() for disease in diseases if disease.strip()))
    rows: list[dict[str, Any]] = []
    for article in articles:
        title = str(article.get("title", ""))
        snippet = article.get("snippet")
        snippet = str(snippet) if snippet is not None else None
        published_at = parse_gdelt_date(article.get("seendate"))
        entities = extract_entities(title, snippet, configured_diseases)
        source_domain = article.get("domain")
        for disease in configured_diseases:
            disease_entities = [entity for entity in entities if entity.disease == disease]
            if not disease_entities:
                continue
            rows.append({
                "metric_date": published_at.date().isoformat(),
                "disease": disease,
                "article_count": 1,
                "symptom_count": sum(entity.entity_type == "symptom" for entity in disease_entities),
                "source_domain": source_domain,
            })

    if not rows:
        return pd.DataFrame(columns=["metric_date", "disease", "article_count", "symptom_count", "unique_source_count"])
    frame = pd.DataFrame(rows)
    return frame.groupby(["metric_date", "disease"], as_index=False).agg(
        article_count=("article_count", "sum"),
        symptom_count=("symptom_count", "sum"),
        unique_source_count=("source_domain", "nunique"),
    )
