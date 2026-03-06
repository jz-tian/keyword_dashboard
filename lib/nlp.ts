/**
 * NLP utilities — pure TypeScript.
 * Ported from python/services/wordcloud.py and python/services/summary.py.
 */
import type { WordCloudTerm } from "./types";

// English stop words
const EN_STOP = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "shall", "can", "this", "that", "these", "those", "i", "we",
  "you", "he", "she", "it", "they", "me", "us", "him", "her", "them", "my",
  "our", "your", "his", "its", "their", "not", "no", "so", "if", "then",
  "than", "about", "after", "before", "between", "into", "through", "during",
  "more", "also", "up", "out", "over", "new", "one", "two", "just", "what",
  "how", "when", "where", "who", "which", "says", "said", "say", "get", "got",
  "make", "made", "take", "come", "go", "see", "know", "like", "look", "use",
  "find", "give", "think", "tell", "ask", "seem", "feel", "try", "leave",
  "call", "keep", "let", "put", "set", "run", "own", "while", "off", "re",
  "s", "t", "d", "m", "ll", "ve", "don", "doesn", "didn", "won", "isn",
  "aren", "wasn", "weren", "hadn", "hasn", "haven", "wouldn", "couldn",
  "shouldn", "all", "any", "both", "each", "few", "most", "other", "some",
  "such", "only", "same", "too", "very", "now", "http", "https", "www",
  "com", "net", "org",
]);

// German stop words
const DE_STOP = new Set([
  "der", "die", "das", "ein", "eine", "einen", "einem", "eines", "einer",
  "dem", "den", "des", "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mich", "dich", "ihn", "uns", "euch", "ihnen", "mir", "dir", "ihm", "man",
  "und", "oder", "aber", "denn", "weil", "dass", "ob", "wenn", "als",
  "damit", "obwohl", "falls", "bevor", "nachdem", "sowie", "sondern", "weder", "noch",
  "in", "auf", "an", "zu", "mit", "von", "aus", "bei", "nach", "vor",
  "unter", "gegen", "durch", "ohne", "um", "bis", "seit", "wegen", "trotz",
  "statt", "zwischen", "neben", "hinter", "uber", "fur",
  "ist", "sind", "war", "waren", "wird", "werden", "wurde", "wurden",
  "hat", "haben", "hatte", "hatten", "sein", "gewesen", "worden", "sei",
  "kann", "muss", "soll", "will", "darf", "mag", "gibt", "macht", "geht",
  "kommt", "sagt", "lassen",
  "nicht", "auch", "so", "noch", "nur", "schon", "dann", "jetzt", "hier",
  "da", "dort", "sehr", "ganz", "gar", "mal", "doch", "ja", "nein",
  "immer", "nie", "oft", "wieder", "viel", "viele", "wenig", "alle",
  "alles", "mehr", "einmal", "bereits", "nun", "zwar", "jedoch",
  "dabei", "dazu", "danach", "davor", "darum", "daher", "darauf", "daran",
  "deshalb", "deswegen", "trotzdem", "dennoch", "allerdings", "bisher",
  "was", "wie", "wann", "wo", "wer", "warum", "welche", "welcher", "welches",
  "dieser", "diese", "dieses", "diesen", "diesem", "jeder", "jede",
  "jeden", "beide", "kein", "keine", "keinen", "keinem",
  "beim", "zum", "zur", "vom", "ins", "ans", "im", "am", "ab",
  "com", "www", "http", "https", "net", "org",
]);

export function extractTerms(
  corpus: string[],
  lang = "en",
  maxTerms = 60
): WordCloudTerm[] {
  const stop = lang === "de" ? DE_STOP : EN_STOP;
  const counts = new Map<string, number>();

  for (const text of corpus) {
    if (!text) continue;
    const words = text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, " ")
      .split(/\s+/);
    for (const raw of words) {
      const word = raw.replace(/^['\-_]+|['\-_]+$/g, "");
      if (word.length >= 3 && !stop.has(word) && !/^\d+$/.test(word)) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    }
  }

  const top = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms);

  if (!top.length) return [];
  const maxCount = top[0][1];
  return top.map(([text, count]) => ({
    text,
    value: Math.max(10, Math.round((count / maxCount) * 100)),
  }));
}

export function buildSummary(
  keyword: string,
  trends: Array<{ value: number }>,
  relatedQueries: Array<{ query: string; type: string }>,
  sentiment: { positive: number; neutral: number; negative: number },
  news: Array<{ title?: string; source?: string }>,
  youtube: Array<{ title?: string; channel?: string }>
): string {
  const values = trends.map((t) => t.value);

  // Trend direction via relative slope
  let direction = "stable";
  if (values.length >= 2) {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    const num = values.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0);
    const den = values.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
    const slope = den !== 0 ? num / den : 0;
    if (yMean !== 0) {
      const relative = slope / yMean;
      if (relative > 0.01) direction = "rising";
      else if (relative < -0.01) direction = "declining";
    }
  }

  // Dominant sentiment
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  const dominant =
    total === 0
      ? "neutral"
      : (["positive", "neutral", "negative"] as const).reduce((a, b) =>
          sentiment[a] >= sentiment[b] ? a : b
        );
  const domPct = total > 0 ? Math.round((sentiment[dominant] / total) * 100) : 0;

  const sentences: string[] = [];

  const dirMap: Record<string, string> = {
    rising: `Interest in "${keyword}" is currently rising, indicating growing public attention.`,
    declining: `Interest in "${keyword}" has been declining over the selected period.`,
    stable: `Interest in "${keyword}" remains broadly stable over the selected time window.`,
  };
  sentences.push(dirMap[direction]);

  const sentMap: Record<string, string> = {
    positive: `Media coverage is predominantly positive (${domPct}% of sources).`,
    negative: `Media sentiment leans negative (${domPct}% of sources), suggesting cautious or critical coverage.`,
    neutral: `Coverage maintains a broadly neutral tone (${domPct}% neutral), reflecting factual reporting.`,
  };
  sentences.push(sentMap[dominant] ?? "Sentiment data is mixed.");

  const topQ = relatedQueries.filter((q) => q.type === "top").slice(0, 3);
  if (topQ.length) {
    sentences.push(
      `Top related searches include ${topQ.map((q) => `"${q.query}"`).join(", ")}.`
    );
  }

  const topNews = news.find((n) => n.title);
  if (topNews) {
    const title =
      (topNews.title ?? "").length > 80
        ? (topNews.title ?? "").slice(0, 77) + "..."
        : (topNews.title ?? "");
    sentences.push(
      `A notable recent headline: "${title}" (${topNews.source ?? "news"}).`
    );
  }

  const topYt = youtube.find((y) => y.title);
  if (topYt) {
    const title =
      (topYt.title ?? "").length > 70
        ? (topYt.title ?? "").slice(0, 67) + "..."
        : (topYt.title ?? "");
    sentences.push(
      `On YouTube, a trending video by ${topYt.channel ?? "a channel"}: "${title}".`
    );
  }

  return sentences.join(" ");
}
