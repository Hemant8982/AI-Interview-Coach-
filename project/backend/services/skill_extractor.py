"""Skill extractor service.

Detects a curated set of technical skills from resume text using
keyword matching with fuzzy fallback via scikit-learn.
"""

import re
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Canonical skill catalog. Order matters only for display priority.
SKILL_CATALOG = [
    "Python",
    "Java",
    "JavaScript",
    "HTML",
    "CSS",
    "React",
    "Flask",
    "FastAPI",
    "REST API",
    "Git",
    "GitHub",
    "Docker",
    "SQL",
    "MySQL",
    "SQLite",
    "NumPy",
    "Pandas",
    "Matplotlib",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "LLM",
    "LangChain",
    "Prompt Engineering",
    "RAG",
    "ChromaDB",
    "Vector Database",
    "PyTorch",
    "TensorFlow",
]

# Regex patterns for skills that need word-boundary matching.
_SKILL_PATTERNS = {
    skill: re.compile(
        r"(?<![A-Za-z0-9])" + re.escape(skill) + r"(?![A-Za-z0-9])", re.IGNORECASE
    )
    for skill in SKILL_CATALOG
}

# Aliases map alternate spellings to canonical skill names.
_ALIASES = {
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "natural language processing": "NLP",
    "large language model": "LLM",
    "large language models": "LLM",
    "prompt engg": "Prompt Engineering",
    "retrieval augmented generation": "RAG",
    "chroma": "ChromaDB",
    "chroma db": "ChromaDB",
    "vector db": "Vector Database",
    "vector db": "Vector Database",
    "tf": "TensorFlow",
    "py torch": "PyTorch",
}


class SkillExtractor:
    """Extracts skills from resume text."""

    @staticmethod
    def extract(resume_text: str) -> List[str]:
        """Return a de-duplicated list of detected skills in catalog order."""
        if not resume_text:
            return []

        text = resume_text.lower()
        found = set()

        # Alias substitution pass
        for alias, canonical in _ALIASES.items():
            if re.search(
                r"(?<![A-Za-z0-9])" + re.escape(alias) + r"(?![A-Za-z0-9])", text
            ):
                found.add(canonical)

        # Direct pattern pass
        for skill, pattern in _SKILL_PATTERNS.items():
            if pattern.search(resume_text):
                found.add(skill)

        # Fuzzy fallback: if nothing matched, try TF-IDF similarity against catalog.
        if not found:
            found = SkillExtractor._fuzzy_match(resume_text)

        # Preserve catalog ordering.
        return [skill for skill in SKILL_CATALOG if skill in found]

    @staticmethod
    def _fuzzy_match(resume_text: str) -> set:
        try:
            corpus = [resume_text] + SKILL_CATALOG
            vectorizer = TfidfVectorizer(stop_words="english")
            tfidf = vectorizer.fit_transform(corpus)
            sims = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()
            return {SKILL_CATALOG[i] for i, score in enumerate(sims) if score > 0.15}
        except Exception:
            return set()
