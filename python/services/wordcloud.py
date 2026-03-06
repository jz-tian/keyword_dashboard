"""
Term frequency extraction for word cloud.
Strips stop words, normalises, and returns ranked (text, value) pairs.
"""
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

# German stop words (compact list)
DE_STOP = {
    "der", "die", "das", "ein", "eine", "einen", "dem", "den", "des", "und",
    "oder", "aber", "in", "auf", "an", "zu", "mit", "von", "aus", "bei", "nach",
    "vor", "über", "unter", "für", "gegen", "durch", "ohne", "als", "wie",
    "ist", "sind", "war", "waren", "wird", "werden", "wurde", "wurden", "hat",
    "haben", "hatte", "hatten", "wird", "ich", "wir", "sie", "er", "es",
    "nicht", "auch", "so", "noch", "nur", "schon", "dann", "wenn", "weil",
    "dass", "ob", "mehr", "alle", "beim", "zum", "zur",
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
