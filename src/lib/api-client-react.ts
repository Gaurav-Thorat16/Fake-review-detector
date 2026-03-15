import { useMutation, useQuery, type UseMutationOptions } from "@tanstack/react-query";

type Severity = "low" | "medium" | "high";

type RiskFactor = {
  type: string;
  severity: Severity;
  description: string;
};

type TextStats = {
  wordCount: number;
  avgWordLength: number;
  exclamationCount: number;
  sentimentScore: number;
};

type AnalyzeReviewResponse = {
  id: string;
  text: string;
  isFake: boolean;
  confidence: number;
  fakeProbability: number;
  genuineProbability: number;
  riskFactors: RiskFactor[];
  textStats: TextStats;
  createdAt: string;
};

type AnalyzeReviewVariables = {
  data: {
    text: string;
  };
};

type BatchAnalyzeVariables = {
  data: {
    texts: string[];
  };
};

type BatchAnalyzeResponse = {
  summary: {
    total: number;
    genuine: number;
    fake: number;
    avgConfidence: number;
  };
  results: AnalyzeReviewResponse[];
};

type ReviewHistoryResponse = {
  items: AnalyzeReviewResponse[];
};

type ReviewStatsResponse = {
  totalAnalyzed: number;
  totalGenuine: number;
  totalFake: number;
  fakePercentage: number;
  avgConfidence: number;
  todayCount: number;
  weeklyTrend: Array<{
    date: string;
    fake: number;
    genuine: number;
  }>;
  topRiskFactors: Array<{
    type: string;
    count: number;
  }>;
};

type MutationConfig<TData, TVariables> = {
  mutation?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">;
};

const STORAGE_KEY = "fake-review-detector.history";
const MAX_HISTORY_ITEMS = 200;

const hypePhrases = [
  "best product",
  "changed my life",
  "must buy",
  "buy this now",
  "amazing",
  "perfect",
  "flawless",
  "highly recommend",
  "fast shipping",
  "best seller",
  "five stars",
];

const positiveWords = [
  "amazing",
  "excellent",
  "perfect",
  "great",
  "fantastic",
  "love",
  "awesome",
  "incredible",
  "wonderful",
  "solid",
];

const negativeWords = [
  "bad",
  "terrible",
  "poor",
  "awful",
  "broken",
  "clunky",
  "worse",
  "hate",
  "disappointed",
  "fake",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStoredHistory(): AnalyzeReviewResponse[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AnalyzeReviewResponse[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHistory(items: AnalyzeReviewResponse[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)),
  );
}

function saveAnalysis(result: AnalyzeReviewResponse) {
  persistHistory([result, ...getStoredHistory()]);
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s!?]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildTextStats(text: string): TextStats {
  const words = tokenize(text);
  const exclamationCount = (text.match(/!/g) ?? []).length;
  const avgWordLength =
    words.length === 0
      ? 0
      : words.reduce((total, word) => total + word.length, 0) / words.length;

  const positiveHits = words.filter((word) => positiveWords.includes(word)).length;
  const negativeHits = words.filter((word) => negativeWords.includes(word)).length;
  const sentimentScore = clamp(
    (positiveHits - negativeHits) / Math.max(words.length / 8, 1),
    -1,
    1,
  );

  return {
    wordCount: words.length,
    avgWordLength,
    exclamationCount,
    sentimentScore,
  };
}

function analyzeText(text: string): AnalyzeReviewResponse {
  const normalizedText = text.trim();
  const words = tokenize(normalizedText);
  const textStats = buildTextStats(normalizedText);
  const upperChars = normalizedText.replace(/[^A-Z]/g, "").length;
  const letterChars = normalizedText.replace(/[^A-Za-z]/g, "").length;
  const upperRatio = letterChars === 0 ? 0 : upperChars / letterChars;
  const riskFactors: RiskFactor[] = [];

  let fakeScore = 0.2;

  if (textStats.exclamationCount >= 4) {
    fakeScore += 0.16;
    riskFactors.push({
      type: "Excessive punctuation",
      severity: textStats.exclamationCount >= 8 ? "high" : "medium",
      description: "Heavy exclamation use often appears in low-quality or manipulative reviews.",
    });
  }

  if (upperRatio >= 0.28) {
    fakeScore += 0.18;
    riskFactors.push({
      type: "Promotional capitalization",
      severity: upperRatio >= 0.45 ? "high" : "medium",
      description: "Large amounts of uppercase text suggest hype-oriented writing.",
    });
  }

  const matchedHypePhrases = hypePhrases.filter((phrase) =>
    normalizedText.toLowerCase().includes(phrase),
  );

  if (matchedHypePhrases.length > 0) {
    fakeScore += 0.14 + matchedHypePhrases.length * 0.04;
    riskFactors.push({
      type: "Sales language",
      severity: matchedHypePhrases.length >= 3 ? "high" : "medium",
      description: "The review uses phrases commonly found in promotional or coordinated spam.",
    });
  }

  if (words.length > 0 && words.length <= 12) {
    fakeScore += 0.12;
    riskFactors.push({
      type: "Low-information content",
      severity: words.length <= 6 ? "high" : "medium",
      description: "Short reviews with little product detail are harder to trust.",
    });
  }

  if (textStats.sentimentScore >= 0.7) {
    fakeScore += 0.12;
    riskFactors.push({
      type: "Extreme positive sentiment",
      severity: "medium",
      description: "Unusually strong positive language without nuance can be suspicious.",
    });
  }

  const nuanceMarkers = /(however|although|except|but|minor|issue|complaint|because|while)/i.test(
    normalizedText,
  );

  if (nuanceMarkers) {
    fakeScore -= 0.14;
  }

  const specificityMarkers = /(month|week|software|battery|shipping|quality|setup|feature|price|seller|keyboard|screen|sound|fit)/i.test(
    normalizedText,
  );

  if (specificityMarkers) {
    fakeScore -= 0.08;
  }

  if (riskFactors.length === 0) {
    riskFactors.push({
      type: "Balanced language",
      severity: "low",
      description: "The review includes natural detail and does not show strong spam signals.",
    });
  }

  fakeScore = clamp(fakeScore, 0.03, 0.97);
  const isFake = fakeScore >= 0.55;
  const fakeProbability = fakeScore;
  const genuineProbability = clamp(1 - fakeProbability, 0.03, 0.97);
  const confidence = clamp(0.5 + Math.abs(fakeProbability - 0.5), 0.51, 0.99);

  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    text: normalizedText,
    isFake,
    confidence,
    fakeProbability,
    genuineProbability,
    riskFactors,
    textStats,
    createdAt: new Date().toISOString(),
  };
}

function buildStats(items: AnalyzeReviewResponse[]): ReviewStatsResponse {
  const totalAnalyzed = items.length;
  const totalFake = items.filter((item) => item.isFake).length;
  const totalGenuine = totalAnalyzed - totalFake;
  const avgConfidence =
    totalAnalyzed === 0
      ? 0
      : items.reduce((total, item) => total + item.confidence, 0) / totalAnalyzed;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = items.filter((item) => new Date(item.createdAt) >= today).length;

  const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayItems = items.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return createdAt >= day && createdAt < nextDay;
    });

    return {
      date: day.toISOString(),
      fake: dayItems.filter((item) => item.isFake).length,
      genuine: dayItems.filter((item) => !item.isFake).length,
    };
  });

  const riskCounts = new Map<string, number>();

  items.forEach((item) => {
    item.riskFactors.forEach((factor) => {
      if (factor.type === "Balanced language") {
        return;
      }

      riskCounts.set(factor.type, (riskCounts.get(factor.type) ?? 0) + 1);
    });
  });

  const topRiskFactors = Array.from(riskCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  return {
    totalAnalyzed,
    totalGenuine,
    totalFake,
    fakePercentage: totalAnalyzed === 0 ? 0 : (totalFake / totalAnalyzed) * 100,
    avgConfidence,
    todayCount,
    weeklyTrend,
    topRiskFactors,
  };
}

export function useAnalyzeReview(
  config?: MutationConfig<AnalyzeReviewResponse, AnalyzeReviewVariables>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const result = analyzeText(data.text);
      saveAnalysis(result);
      return result;
    },
    ...config?.mutation,
  });
}

export function useBatchAnalyzeReviews(
  config?: MutationConfig<BatchAnalyzeResponse, BatchAnalyzeVariables>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const results = data.texts.map((text) => analyzeText(text));
      persistHistory([...results, ...getStoredHistory()]);

      const summary = {
        total: results.length,
        genuine: results.filter((item) => !item.isFake).length,
        fake: results.filter((item) => item.isFake).length,
        avgConfidence:
          results.length === 0
            ? 0
            : results.reduce((total, item) => total + item.confidence, 0) / results.length,
      };

      return { summary, results };
    },
    ...config?.mutation,
  });
}

export function useGetReviewStats() {
  return useQuery({
    queryKey: ["/api/reviews/stats"],
    queryFn: async () => buildStats(getStoredHistory()),
    staleTime: 0,
  });
}

export function useGetReviewHistory({ limit = 10 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: ["/api/reviews/history", limit],
    queryFn: async (): Promise<ReviewHistoryResponse> => ({
      items: getStoredHistory().slice(0, limit),
    }),
    staleTime: 0,
  });
}