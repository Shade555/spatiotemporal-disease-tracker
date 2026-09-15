from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable

DEFAULT_SYMPTOMS = (
    "high fever",
    "fever",
    "headache",
    "muscle pain",
    "joint pain",
    "rash",
    "nausea",
    "vomiting",
    "chills",
    "fatigue",
)


@dataclass(frozen=True)
class Entity:
    disease: str
    entity_type: str
    normalized_value: str
    source_text: str
    confidence: float = 1.0


def normalize_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).lower()


def extract_entities(
    title: str,
    snippet: str | None,
    diseases: Iterable[str],
    symptoms: Iterable[str] = DEFAULT_SYMPTOMS,
    location: str = "Mumbai",
) -> list[Entity]:
    source_text = re.sub(r"\s+", " ", f"{title} {snippet or ''}").strip()
    normalized = normalize_text(source_text)
    entities: list[Entity] = []
    configured_diseases = tuple(dict.fromkeys(disease.strip() for disease in diseases if disease.strip()))

    for disease in configured_diseases:
        if normalize_text(disease) not in normalized:
            continue
        entities.append(Entity(disease, "epidemiological_term", disease, source_text))
        matched_symptoms: list[str] = []
        for symptom in sorted(symptoms, key=len, reverse=True):
            canonical = symptom.strip().lower()
            if canonical and canonical in normalized and not any(canonical in matched for matched in matched_symptoms):
                entities.append(Entity(disease, "symptom", canonical, source_text))
                matched_symptoms.append(canonical)

    if normalize_text(location) in normalized:
        for disease in configured_diseases:
            if normalize_text(disease) in normalized:
                entities.append(Entity(disease, "location", location, source_text))

    return list(dict.fromkeys(entities))
