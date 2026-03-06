"""
Term frequency extraction for word cloud.
Strips stop words, normalises, and returns ranked (text, value) pairs.
"""
from __future__ import annotations
import re
from collections import Counter

# English stop words (compact list)
EN_STOP = {
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
    "such", "only", "own", "same", "too", "very", "can", "will", "just", "now",
    "http", "https", "www", "com", "net", "org",
}

# German stop words (comprehensive list)
DE_STOP = {
    # Articles
    "der", "die", "das", "ein", "eine", "einen", "einem", "eines", "einer",
    "dem", "den", "des",
    # Pronouns
    "ich", "du", "er", "sie", "es", "wir", "ihr", "sie", "mich", "dich",
    "ihn", "uns", "euch", "ihnen", "mir", "dir", "ihm", "man",
    # Conjunctions
    "und", "oder", "aber", "denn", "weil", "dass", "ob", "wenn", "als",
    "damit", "obwohl", "waehrend", "falls", "bevor", "nachdem", "sowie",
    "sondern", "weder", "noch",
    # Prepositions
    "in", "auf", "an", "zu", "mit", "von", "aus", "bei", "nach", "vor",
    "ueber", "unter", "fuer", "gegen", "durch", "ohne", "um", "bis", "seit",
    "waehrend", "wegen", "trotz", "statt", "anstatt", "ausser", "zwischen",
    "neben", "hinter", "uber", "fur",
    # Verbs (auxiliary/common)
    "ist", "sind", "war", "waren", "wird", "werden", "wurde", "wurden",
    "hat", "haben", "hatte", "hatten", "sein", "gewesen", "worden", "sei",
    "kann", "koennen", "muss", "muessen", "soll", "sollen", "will", "wollen",
    "darf", "duerfen", "mag", "moegen", "wuerde", "koennte", "sollte",
    "wollte", "mochte", "gibt", "geben", "macht", "machen", "geht", "gehen",
    "kommt", "kommen", "sagt", "sagen", "heisst", "heissen", "lassen",
    # Adverbs & particles
    "nicht", "auch", "so", "noch", "nur", "schon", "dann", "jetzt", "hier",
    "da", "dort", "sehr", "ganz", "gar", "mal", "doch", "ja", "nein",
    "immer", "nie", "oft", "wieder", "viel", "viele", "wenig", "alle",
    "alles", "mehr", "less", "einmal", "bereits", "nun", "zwar", "jedoch",
    "dabei", "dazu", "danach", "davor", "darum", "daher", "darauf", "daran",
    "damit", "deshalb", "deswegen", "trotzdem", "dennoch", "allerdings",
    "außerdem", "zudem", "weiterhin", "beispielsweise", "etwa", "einfach",
    "eigentlich", "wirklich", "natürlich", "besonders", "bisher", "bis",
    "lange", "kurz", "vorn", "hinten", "oben", "unten", "links", "rechts",
    # Question words
    "was", "wie", "wann", "wo", "wer", "warum", "welche", "welcher",
    "welches", "wohin", "woher",
    # Determiners
    "dieser", "diese", "dieses", "diesen", "diesem", "jener", "jede",
    "jeden", "jedem", "jedes", "beide", "solche", "solcher", "kein",
    "keine", "keinen", "keinem", "keines",
    # Misc filler
    "beim", "zum", "zur", "vom", "ins", "ans", "im", "am", "ab",
    "com", "www", "http", "https", "net", "org",
}


def extract_terms(
    corpus: list[str], lang: str = "en", max_terms: int = 60
) -> list[dict]:
    """
    Extract top terms from a corpus of text strings.

    Returns list of {"text": str, "value": int} sorted by frequency desc.
    """
    stop = DE_STOP if lang == "de" else EN_STOP
    counter: Counter = Counter()

    for text in corpus:
        if not text:
            continue
        # Lowercase, strip punctuation, split on whitespace
        words = re.sub(r"[^\w\s'-]", " ", text.lower()).split()
        for word in words:
            word = word.strip("'-_")
            if len(word) >= 3 and word not in stop and not word.isdigit():
                counter[word] += 1

    # Return top terms
    top = counter.most_common(max_terms)
    if not top:
        return []

    # Normalize values 10-100 relative to max
    max_count = top[0][1]
    return [
        {"text": term, "value": max(10, round(count / max_count * 100))}
        for term, count in top
    ]
