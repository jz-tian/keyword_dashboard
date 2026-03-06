"""
Sentiment analysis service.
- English: VADER (vaderSentiment)
- German: simple hand-crafted lexicon (SentiWS-inspired)

Limitations (German): The lexicon is minimal (~150 words per polarity).
For production, replace with TextBlob-DE or a HuggingFace transformer.
"""
from typing import Literal

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = SentimentIntensityAnalyzer()

# ── German mini-lexicon ───────────────────────────────────────
DE_POSITIVE = {
    "gut", "großartig", "ausgezeichnet", "wunderbar", "fantastisch", "brillant",
    "hervorragend", "positiv", "erfolgreich", "gewinn", "wachstum", "innovation",
    "stark", "besser", "beste", "sieg", "freude", "glück", "hoffnung", "zufrieden",
    "klasse", "super", "toll", "prima", "schön", "liebe", "freundlich", "hilfe",
    "fortschritt", "verbesserung", "lösung", "vorteil", "chance", "erfolg",
    "gewinner", "beeindruckend", "erstaunlich", "phänomenal", "rekord", "spitze",
    "durchbruch", "revolutionär", "nachhaltig", "effizient", "zuverlässig",
    "qualität", "sicher", "stabil", "profitabel", "rentabel", "lukrativ",
    "popular", "beliebt", "angesagt", "trending", "boom", "aufschwung",
    "optimistisch", "zuversichtlich", "positiv", "interessant", "spannend",
    "aufregend", "bedeutend", "wichtig", "wertvoll", "nützlich", "hilfreich",
    "angenehm", "komfortabel", "luxus", "premium", "exzellent", "top",
    "führend", "marktführer", "pionier", "vorreiter", "innovativ", "kreativ",
    "nachhaltig", "umweltfreundlich", "fair", "transparent", "vertrauenswürdig",
    "zuverlässig", "pünktlich", "schnell", "effektiv", "produktiv",
    "professionell", "kompetent", "erfahren", "bewährt", "empfohlen",
    "gelobt", "ausgezeichnet", "preisgekrönt", "weltweit", "international",
    "zukunftsfähig", "nachhaltig", "wettbewerbsfähig", "dynamisch", "flexibel",
}

DE_NEGATIVE = {
    "schlecht", "schlimm", "schrecklich", "verlust", "krise", "problem", "schwach",
    "gefährlich", "negativ", "schwierig", "misserfolg", "katastrophe", "schaden",
    "rückgang", "absturz", "fehler", "mangel", "gefahr", "risiko", "verletzt",
    "bankrott", "pleite", "insolvenz", "schulden", "defizit", "einbruch",
    "rezession", "inflation", "arbeitslosigkeit", "entlassung", "kündigung",
    "streik", "konflikt", "krieg", "terror", "angriff", "unfall", "katastrophe",
    "skandal", "korruption", "betrug", "fälschung", "manipulation", "lüge",
    "täuschung", "irreführung", "misstand", "versagen", "scheitern", "niederlage",
    "verlieren", "einbüßen", "sinken", "fallen", "stürzen", "kollaps",
    "zusammenbruch", "desaster", "chaos", "anarchie", "unsicherheit", "instabil",
    "riskant", "gefährdet", "bedroht", "kritisch", "alarmierend", "erschreckend",
    "besorgniserregend", "problematisch", "kontrovers", "umstritten",
    "fragwürdig", "zweifelhaft", "unzuverlässig", "mangelhaft", "defekt",
    "veraltet", "überholt", "ineffizient", "verschwenderisch", "teuer",
    "überteuert", "wucherer", "ausbeuter", "diskriminierend", "ungerecht",
    "unethisch", "illegal", "verboten", "strafbar", "kriminell", "gefängnisstrafe",
    "strafe", "sanktion", "verbot", "einschränkung", "zensur", "kontroverse",
    "debatte", "streit", "auseinandersetzung", "konflikt", "spannung",
}


def _classify_de(text: str) -> Literal["positive", "neutral", "negative"]:
    words = set(text.lower().split())
    pos = len(words & DE_POSITIVE)
    neg = len(words & DE_NEGATIVE)
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    return "neutral"


def _classify_en(text: str) -> Literal["positive", "neutral", "negative"]:
    scores = _vader.polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"


def analyze_corpus(
    corpus: list[str], lang: str = "en"
) -> dict[str, int]:
    """
    Analyze a list of text items and return sentiment counts.

    Returns:
        {"positive": N, "neutral": N, "negative": N}
    """
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    if not corpus:
        return counts

    classifier = _classify_de if lang == "de" else _classify_en

    for text in corpus:
        if not text or not text.strip():
            continue
        label = classifier(text)
        counts[label] += 1

    return counts
