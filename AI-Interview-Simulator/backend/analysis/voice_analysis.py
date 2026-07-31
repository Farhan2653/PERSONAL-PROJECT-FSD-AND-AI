import numpy as np
import re
import nltk
from collections import Counter

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

try:
    nltk.data.find("averaged_perceptron_tagger")
except LookupError:
    nltk.download("averaged_perceptron_tagger", quiet=True)


FILLER_WORDS = {
    "um", "uh", "like", "you know", "kind of", "sort of", "basically",
    "actually", "literally", "just", "so", "well", "i mean", "right",
    "ok", "okay", "right", "yeah", "ah", "mm", "hm", "er", "uhm",
}


class VoiceAnalyzer:
    def __init__(self):
        self.transcript_segments = []
        self.audio_features = {}

    def analyze_text(self, text):
        if not text or not text.strip():
            return {
                "grammar_score": 50.0,
                "communication_score": 0.0,
                "filler_word_count": 0,
                "word_count": 0,
                "vocabulary_richness": 0.0,
                "has_errors": [],
            }

        words = text.lower().split()
        word_count = len(words)

        filler_count = 0
        text_lower = text.lower()
        for filler in FILLER_WORDS:
            filler_count += text_lower.count(filler)

        grammar_errors = self._check_grammar(text)
        grammar_score = max(0.0, 100.0 - len(grammar_errors) * 10.0 - filler_count * 2.0)

        token_count = len(set(words))
        vocabulary_richness = token_count / word_count if word_count > 0 else 0.0

        sentences = nltk.sent_tokenize(text)
        avg_sentence_length = word_count / len(sentences) if sentences else 0
        if avg_sentence_length < 5:
            comm_score = min(40.0 + word_count, 100.0)
        elif avg_sentence_length < 25:
            comm_score = min(60.0 + word_count * 0.3, 100.0)
        else:
            comm_score = min(50.0 + word_count * 0.2, 100.0)

        return {
            "grammar_score": round(max(min(grammar_score, 100.0), 0.0), 1),
            "communication_score": round(max(min(comm_score, 100.0), 0.0), 1),
            "filler_word_count": filler_count,
            "word_count": word_count,
            "vocabulary_richness": round(vocabulary_richness, 3),
            "has_errors": grammar_errors,
        }

    def _check_grammar(self, text):
        errors = []
        sentences = nltk.sent_tokenize(text)
        for sentence in sentences:
            words = sentence.split()
            if len(words) > 0:
                if words[0] == words[0].lower() and words[0][0].isalpha():
                    if not any(
                        words[0].lower().startswith(w)
                        for w in ["i", "yes", "no", "ok", "okay"]
                    ):
                        errors.append("Sentence should start with capital letter")

            if "  " in text:
                errors.append("Multiple spaces detected")

            if sentence.endswith(",.") or sentence.endswith(".."):
                errors.append("Punctuation error")

        return errors

    def calculate_voice_score(self, text):
        analysis = self.analyze_text(text)
        return round(
            analysis["grammar_score"] * 0.4
            + analysis["communication_score"] * 0.4
            + max(0, 100 - analysis["filler_word_count"] * 5) * 0.2,
            1,
        )