/**
 * Sentiment analysis — pure TypeScript, no external packages.
 * English: AFINN-inspired compact lexicon (~350 words).
 * German: ported from python/services/sentiment.py.
 */

// English lexicon — score per word (-5 to +5)
const EN_LEXICON: Record<string, number> = {
  // Strongly positive
  outstanding: 5, superb: 5, excellent: 5, phenomenal: 5, exceptional: 5,
  wonderful: 4, fantastic: 4, amazing: 4, awesome: 4, brilliant: 4,
  extraordinary: 4, spectacular: 4, magnificent: 4, remarkable: 4, incredible: 4,
  // Positive
  good: 3, great: 3, best: 3, perfect: 3, love: 3, win: 3, winner: 3,
  happy: 3, success: 3, successful: 3, joy: 3, fun: 3, glad: 3, powerful: 3,
  beautiful: 3, brave: 3, clean: 3, creative: 3, efficient: 3, elegant: 3,
  breakthrough: 3, celebrate: 3, victory: 3, thrive: 3, surge: 3,
  better: 2, nice: 2, benefit: 2, improve: 2, gain: 2, positive: 2,
  enjoy: 2, hope: 2, support: 2, strong: 2, safe: 2, clear: 2, effective: 2,
  fresh: 2, growth: 2, healthy: 2, honest: 2, innovative: 2, kind: 2,
  leading: 2, opportunity: 2, progress: 2, smart: 2, stable: 2, useful: 2,
  valuable: 2, resilient: 2, sustainable: 2, bold: 2, record: 2,
  launch: 2, recover: 2, boost: 2, achieve: 2, profit: 2, rise: 2, rising: 2,
  award: 2, trusted: 2, approved: 2, certified: 2, upgraded: 2, resolved: 2,
  // Mildly positive
  ok: 1, fine: 1, decent: 1, reasonable: 1, fair: 1, steady: 1,
  // Strongly negative
  terrible: -5, horrible: -5, catastrophic: -5, devastating: -5,
  awful: -4, dreadful: -4, appalling: -4, abysmal: -4, horrific: -4,
  disastrous: -4, atrocious: -4,
  // Negative
  bad: -3, hate: -3, worst: -3, fail: -3, failure: -3, dead: -3,
  corrupt: -3, crash: -3, fraud: -3, attack: -3, kill: -3, terror: -3,
  war: -3, crime: -3, abuse: -3, lie: -3, lies: -3, lying: -3,
  layoffs: -3, recession: -3, fired: -3,
  poor: -2, wrong: -2, problem: -2, issue: -2, risk: -2, fear: -2,
  threat: -2, danger: -2, crisis: -2, loss: -2, damage: -2, weak: -2,
  broken: -2, decline: -2, failed: -2, falling: -2, false: -2,
  harmful: -2, hurt: -2, illegal: -2, layoff: -2, negative: -2,
  painful: -2, reject: -2, scandal: -2, scam: -2, slow: -2,
  suffer: -2, trouble: -2, uncertain: -2, unstable: -2,
  violation: -2, waste: -2, cancel: -2, banned: -2, debt: -2,
  delay: -2, denied: -2, dropped: -2, bankruptcy: -4,
  resign: -2, arrested: -2, sentenced: -2, sued: -2, fined: -2,
  // Mildly negative
  difficult: -1, complicated: -1, concerned: -1, worried: -1, hard: -1,
};

// German lexicon — ported from python/services/sentiment.py
const DE_POSITIVE = new Set([
  "gut", "großartig", "ausgezeichnet", "wunderbar", "fantastisch", "brillant",
  "hervorragend", "positiv", "erfolgreich", "gewinn", "wachstum", "innovation",
  "stark", "besser", "beste", "sieg", "freude", "glück", "hoffnung", "zufrieden",
  "klasse", "super", "toll", "prima", "schön", "liebe", "freundlich", "hilfe",
  "fortschritt", "verbesserung", "lösung", "vorteil", "chance", "erfolg",
  "gewinner", "beeindruckend", "erstaunlich", "phänomenal", "rekord", "spitze",
  "durchbruch", "revolutionär", "nachhaltig", "effizient", "zuverlässig",
  "qualität", "sicher", "stabil", "profitabel", "rentabel", "lukrativ",
  "beliebt", "angesagt", "trending", "boom", "aufschwung", "optimistisch",
  "zuversichtlich", "interessant", "spannend", "aufregend", "bedeutend",
  "wertvoll", "nützlich", "hilfreich", "angenehm", "komfortabel", "premium",
  "führend", "marktführer", "pionier", "innovativ", "kreativ", "fair",
  "transparent", "vertrauenswürdig", "pünktlich", "schnell", "effektiv",
  "produktiv", "professionell", "kompetent", "erfahren", "bewährt", "empfohlen",
  "gelobt", "preisgekrönt", "zukunftsfähig", "wettbewerbsfähig", "dynamisch",
]);

const DE_NEGATIVE = new Set([
  "schlecht", "schlimm", "schrecklich", "verlust", "krise", "problem", "schwach",
  "gefährlich", "negativ", "schwierig", "misserfolg", "katastrophe", "schaden",
  "rückgang", "absturz", "fehler", "mangel", "gefahr", "risiko", "verletzt",
  "bankrott", "pleite", "insolvenz", "schulden", "defizit", "einbruch",
  "rezession", "inflation", "arbeitslosigkeit", "entlassung", "kündigung",
  "streik", "konflikt", "krieg", "terror", "angriff", "unfall",
  "skandal", "korruption", "betrug", "fälschung", "manipulation", "lüge",
  "täuschung", "irreführung", "versagen", "scheitern", "niederlage",
  "verlieren", "einbüßen", "sinken", "fallen", "stürzen", "kollaps",
  "zusammenbruch", "desaster", "chaos", "unsicherheit", "instabil",
  "riskant", "gefährdet", "bedroht", "kritisch", "alarmierend", "erschreckend",
  "besorgniserregend", "problematisch", "kontrovers", "fragwürdig",
  "unzuverlässig", "mangelhaft", "defekt", "ineffizient", "verschwenderisch",
  "überteuert", "diskriminierend", "ungerecht", "unethisch", "illegal",
  "verboten", "strafbar", "kriminell", "strafe", "sanktion", "verbot",
  "einschränkung", "zensur", "streit", "auseinandersetzung", "spannung",
]);

function classifyEn(text: string): "positive" | "neutral" | "negative" {
  const words = text.toLowerCase().match(/\b\w+\b/g) ?? [];
  let score = 0;
  for (const word of words) score += EN_LEXICON[word] ?? 0;
  const comparative = words.length > 0 ? score / words.length : 0;
  if (comparative >= 0.05) return "positive";
  if (comparative <= -0.05) return "negative";
  return "neutral";
}

function classifyDe(text: string): "positive" | "neutral" | "negative" {
  const words = text.toLowerCase().split(/\s+/);
  let pos = 0, neg = 0;
  for (const word of words) {
    if (DE_POSITIVE.has(word)) pos++;
    if (DE_NEGATIVE.has(word)) neg++;
  }
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

export function analyzeSentiment(
  corpus: string[],
  lang = "en"
): { positive: number; neutral: number; negative: number } {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  if (!corpus.length) return counts;
  const classify = lang === "de" ? classifyDe : classifyEn;
  for (const text of corpus) {
    if (!text?.trim()) continue;
    counts[classify(text)]++;
  }
  return counts;
}
