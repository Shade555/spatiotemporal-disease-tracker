import { location, type DailyMetric, type Disease, type NormalizedArticle } from "@/lib/types";
import { extractEntities } from "@/lib/validation";

export function calculateDailyMetrics(articles: NormalizedArticle[], configuredDiseases: readonly string[]): DailyMetric[] {
  const grouped = new Map<string, { disease: Disease; date: string; articles: NormalizedArticle[] }>();
  for (const article of articles) {
    const date = article.publishedAt.slice(0, 10);
    const text = `${article.title} ${article.snippet ?? ""}`.toLowerCase();
    for (const disease of configuredDiseases) {
      if (!text.includes(disease.toLowerCase())) continue;
      const key = `${date}:${disease}`;
      const current = grouped.get(key) ?? { disease, date, articles: [] };
      current.articles.push(article);
      grouped.set(key, current);
    }
  }

  return [...grouped.values()].map(({ disease, date, articles: groupedArticles }) => {
    const symptomCount = groupedArticles.reduce((count, article) => count + extractEntities(article.title, article.snippet, configuredDiseases).filter((entity) => entity.disease === disease && entity.entityType === "symptom").length, 0);
    return {
      metricDate: date,
      location,
      disease,
      articleCount: groupedArticles.length,
      symptomCount,
      uniqueSourceCount: new Set(groupedArticles.map((article) => article.sourceDomain).filter(Boolean)).size,
      rollingMean: null,
      rollingStddev: null,
      anomalyScore: null,
      isAnomaly: false,
      forecastValue: null,
    } satisfies DailyMetric;
  }).sort((a, b) => a.metricDate.localeCompare(b.metricDate));
}

export function applyRollingAnomalies(
  metrics: DailyMetric[],
  window = 7,
  minHistory = 3,
  threshold = 2,
): DailyMetric[] {
  return metrics.map((metric) => {
    const history = metrics
      .filter((candidate) => candidate.disease === metric.disease && candidate.metricDate < metric.metricDate)
      .sort((left, right) => right.metricDate.localeCompare(left.metricDate))
      .slice(0, window)
      .map((candidate) => candidate.articleCount);

    if (history.length < minHistory) {
      return { ...metric, rollingMean: null, rollingStddev: null, anomalyScore: null, isAnomaly: false };
    }

    const rollingMean = history.reduce((sum, value) => sum + value, 0) / history.length;
    const variance = history.reduce((sum, value) => sum + ((value - rollingMean) ** 2), 0) / history.length;
    const rollingStddev = Math.sqrt(variance);
    const anomalyScore = rollingStddev > 0 ? (metric.articleCount - rollingMean) / rollingStddev : null;

    return {
      ...metric,
      rollingMean,
      rollingStddev,
      anomalyScore,
      isAnomaly: anomalyScore !== null && anomalyScore >= threshold,
    };
  });
}
