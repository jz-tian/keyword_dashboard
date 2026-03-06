"""
Python tests for sentiment analysis and summary services.
Run with: cd python && pytest ../tests/test_sentiment.py -v
"""
import sys
from pathlib import Path

# Add python/ to path so imports work from tests/
sys.path.insert(0, str(Path(__file__).parent.parent / "python"))

from services.sentiment import analyze_corpus
from services.wordcloud import extract_terms
from services.summary import build_summary, compute_all_metrics


class TestSentimentEnglish:
    def test_empty_corpus(self):
        result = analyze_corpus([], lang="en")
        assert result == {"positive": 0, "neutral": 0, "negative": 0}

    def test_clearly_positive(self):
        corpus = [
            "Excellent results, outstanding performance",
            "Great success, wonderful achievement",
            "Amazing breakthrough, fantastic results",
        ]
        result = analyze_corpus(corpus, lang="en")
        assert result["positive"] > result["negative"]

    def test_clearly_negative(self):
        corpus = [
            "Terrible disaster, horrible outcome",
            "Crisis worsens, catastrophic failure",
            "Devastating loss, terrible collapse",
        ]
        result = analyze_corpus(corpus, lang="en")
        assert result["negative"] > result["positive"]

    def test_neutral(self):
        corpus = [
            "The report was published on Monday",
            "The meeting took place in Berlin",
        ]
        result = analyze_corpus(corpus, lang="en")
        # Neutral should dominate
        assert result["neutral"] >= result["positive"]
        assert result["neutral"] >= result["negative"]

    def test_counts_sum_to_corpus_length(self):
        corpus = ["good news", "bad news", "neutral report"]
        result = analyze_corpus(corpus, lang="en")
        assert result["positive"] + result["neutral"] + result["negative"] == len(corpus)

    def test_single_item(self):
        result = analyze_corpus(["Wonderful, brilliant, amazing!"], lang="en")
        assert result["positive"] == 1
        assert result["neutral"] == 0
        assert result["negative"] == 0


class TestSentimentGerman:
    def test_german_positive(self):
        corpus = [
            "Ausgezeichnet! Hervorragende Ergebnisse, großartige Innovation.",
            "Erfolgreich und wunderbar, super Leistung!",
        ]
        result = analyze_corpus(corpus, lang="de")
        assert result["positive"] > result["negative"]

    def test_german_negative(self):
        corpus = [
            "Katastrophaler Verlust, schlimme Krise, schreckliches Ergebnis",
            "Bankrott und Insolvenz, gefährliche Situation",
        ]
        result = analyze_corpus(corpus, lang="de")
        assert result["negative"] > result["positive"]

    def test_german_empty(self):
        result = analyze_corpus([], lang="de")
        assert result == {"positive": 0, "neutral": 0, "negative": 0}


class TestWordCloud:
    def test_empty_corpus(self):
        result = extract_terms([], lang="en")
        assert result == []

    def test_returns_list_of_dicts(self):
        result = extract_terms(["python programming language testing"], lang="en")
        assert isinstance(result, list)
        for item in result:
            assert "text" in item
            assert "value" in item
            assert isinstance(item["value"], (int, float))

    def test_filters_stop_words(self):
        result = extract_terms(["the and or but in on at for"], lang="en")
        texts = [r["text"] for r in result]
        for stop in ["the", "and", "or", "but", "in", "on", "at", "for"]:
            assert stop not in texts

    def test_value_range(self):
        corpus = ["finance stock market economy investment"] * 5
        result = extract_terms(corpus, lang="en")
        for item in result:
            assert 10 <= item["value"] <= 100

    def test_most_common_has_highest_value(self):
        corpus = ["python python python java java"]
        result = extract_terms(corpus, lang="en")
        if len(result) >= 2:
            values = [r["value"] for r in result]
            assert values[0] >= values[1]


class TestSummary:
    def _make_trends(self, values):
        from datetime import date, timedelta
        base = date.today()
        return [
            {"date": str(base - timedelta(days=len(values) - i - 1)), "value": v}
            for i, v in enumerate(values)
        ]

    def test_rising_trend(self):
        trends = self._make_trends([10, 20, 30, 40, 50, 60, 70])
        summary = build_summary("Finance", trends, [], {"positive": 5, "neutral": 3, "negative": 2}, [], [])
        assert "rising" in summary.lower()

    def test_declining_trend(self):
        trends = self._make_trends([70, 60, 50, 40, 30, 20, 10])
        summary = build_summary("Finance", trends, [], {"positive": 2, "neutral": 3, "negative": 5}, [], [])
        assert "declining" in summary.lower()

    def test_includes_keyword(self):
        trends = self._make_trends([50, 50, 50])
        summary = build_summary("Tennis", trends, [], {"positive": 1, "neutral": 1, "negative": 0}, [], [])
        assert "Tennis" in summary

    def test_empty_trends(self):
        summary = build_summary("Bitcoin", [], [], {"positive": 0, "neutral": 0, "negative": 0}, [], [])
        assert isinstance(summary, str)
        assert len(summary) > 0

    def test_includes_headline(self):
        trends = self._make_trends([50, 50])
        news = [{"title": "Markets surge to record highs", "source": "Reuters", "publishedAt": "2024-01-01T00:00:00Z"}]
        summary = build_summary("Finance", trends, [], {"positive": 1, "neutral": 0, "negative": 0}, news, [])
        assert "Markets surge to record highs" in summary


class TestMetrics:
    def test_compute_metrics_empty(self):
        result = compute_all_metrics([], [], [])
        assert result["trendScore"] == 0
        assert result["momentum"] == 0.0
        assert result["volatility"] == 0.0
        assert result["sourceDiversityIndex"] == 0
        assert result["freshnessScore"] == 0

    def test_trend_score_range(self):
        from datetime import date, timedelta
        trends = [{"date": str(date.today() - timedelta(days=i)), "value": v}
                  for i, v in enumerate([20, 40, 60, 80, 100])]
        result = compute_all_metrics(trends, [], [])
        assert 0 <= result["trendScore"] <= 100

    def test_source_diversity(self):
        news = [
            {"title": "a", "publishedAt": "2024-01-01T00:00:00Z", "sourceBadge": "GDELT"},
            {"title": "b", "publishedAt": "2024-01-01T00:00:00Z", "sourceBadge": "GNews"},
        ]
        youtube = [{"title": "c", "publishedAt": "2024-01-01T00:00:00Z"}]
        result = compute_all_metrics([], news, youtube)
        assert result["sourceDiversityIndex"] == 3  # GDELT + GNews + YouTube
