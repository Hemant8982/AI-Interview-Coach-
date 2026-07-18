"""Gemini AI service.

Wraps the Google GenAI SDK to generate interview questions and
evaluate candidate answers. Includes retry logic and graceful
fallbacks when the API quota is exhausted.
"""

import json
import os
import time
import logging
from typing import List, Dict, Any

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.0-flash"

_client = None


def _get_client():
    """Lazily initialize the Gemini client."""
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. Gemini calls will use fallbacks.")
        _client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
    return _client


def _generate(prompt: str, max_retries: int = 3) -> str:
    """Call Gemini with simple retry/backoff. Raises on final failure."""
    client = _get_client()
    if client is None:
        raise RuntimeError("Gemini client not configured")

    last_err = None
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
            )
            return response.text
        except genai_errors.ClientError as e:
            last_err = e
            logger.warning("Gemini client error (attempt %d): %s", attempt + 1, e)
            if attempt < max_retries - 1:
                time.sleep(2**attempt)
        except Exception as e:
            last_err = e
            logger.warning("Gemini error (attempt %d): %s", attempt + 1, e)
            if attempt < max_retries - 1:
                time.sleep(2**attempt)
    raise RuntimeError(
        f"Gemini generation failed after {max_retries} attempts: {last_err}"
    )


def _parse_json(raw: str) -> Any:
    """Extract and parse JSON from a model response that may include code fences."""
    text = raw.strip()
    if text.startswith("```"):
        # Strip ```json ... ``` fences
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip("`").strip()
    # Find first { or [ and last } or ]
    start = min([i for i in [text.find("{"), text.find("[")] if i != -1], default=-1)
    if start == -1:
        raise ValueError("No JSON found in response")
    end = max(text.rfind("}"), text.rfind("]"))
    return json.loads(text[start : end + 1])


# ---------------------------------------------------------------------------
# Question generation
# ---------------------------------------------------------------------------

QUESTION_PROMPT_TEMPLATE = """You are an expert technical interviewer.

Given the candidate's resume text and target job role, generate exactly 10 interview questions.

Requirements:
- Mix of Easy, Medium, and Hard difficulty (roughly 3 easy, 4 medium, 3 hard).
- Questions must be relevant to the resume skills AND the job role.
- Include a blend of technical, problem-solving, and behavioral questions.
- Each question must have a short "topic" field.

Return ONLY a JSON array (no markdown, no commentary) with this exact shape:
[
  {{
    "question": "string",
    "difficulty": "Easy|Medium|Hard",
    "topic": "string"
  }}
]

Resume text:
\"\"\"
{resume_text}
\"\"\"

Job Role: {job_role}
"""


FALLBACK_QUESTIONS = [
    {
        "question": "Tell me about yourself and your background.",
        "difficulty": "Easy",
        "topic": "Behavioral",
    },
    {
        "question": "Describe a challenging project you worked on and your role.",
        "difficulty": "Easy",
        "topic": "Behavioral",
    },
    {
        "question": "What programming languages are you most comfortable with and why?",
        "difficulty": "Easy",
        "topic": "General",
    },
    {
        "question": "Explain the difference between supervised and unsupervised learning.",
        "difficulty": "Medium",
        "topic": "Machine Learning",
    },
    {
        "question": "How would you design a REST API for a simple CRUD application?",
        "difficulty": "Medium",
        "topic": "Backend",
    },
    {
        "question": "Walk through how you would debug a slow database query.",
        "difficulty": "Medium",
        "topic": "Databases",
    },
    {
        "question": "Describe a time you had a conflict with a teammate and how you resolved it.",
        "difficulty": "Medium",
        "topic": "Behavioral",
    },
    {
        "question": "Design a system to serve personalized recommendations at scale.",
        "difficulty": "Hard",
        "topic": "System Design",
    },
    {
        "question": "How would you evaluate and improve a production ML model's performance?",
        "difficulty": "Hard",
        "topic": "Machine Learning",
    },
    {
        "question": "Explain how you would secure authentication in a web application.",
        "difficulty": "Hard",
        "topic": "Security",
    },
]


def generate_questions(resume_text: str, job_role: str) -> List[Dict[str, str]]:
    """Generate exactly 10 interview questions. Falls back on API failure."""
    prompt = QUESTION_PROMPT_TEMPLATE.format(
        resume_text=resume_text[:4000], job_role=job_role
    )
    try:
        raw = _generate(prompt)
        questions = _parse_json(raw)
        if isinstance(questions, list) and len(questions) > 0:
            # Ensure exactly 10
            return (
                questions[:10]
                if len(questions) >= 10
                else questions + FALLBACK_QUESTIONS[: 10 - len(questions)]
            )
        return FALLBACK_QUESTIONS
    except Exception as e:
        logger.error("Question generation failed, using fallback: %s", e)
        return FALLBACK_QUESTIONS


# ---------------------------------------------------------------------------
# Answer evaluation
# ---------------------------------------------------------------------------

EVAL_PROMPT_TEMPLATE = """You are an expert interview evaluator.

Evaluate the candidate's answer to an interview question. Score across four dimensions (0-100):
- overall: overall quality of the answer
- technical: technical correctness and depth
- communication: clarity and structure
- confidence: assertiveness and self-assurance

Also provide:
- strengths: 2-4 short bullet points
- weaknesses: 2-4 short bullet points
- suggestions: 2-4 actionable improvement points

Return ONLY a JSON object (no markdown) with this exact shape:
{{
  "overall": 0,
  "technical": 0,
  "communication": 0,
  "confidence": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}}

Question: {question}

Answer:
\"\"\"
{answer}
\"\"\"
"""

FALLBACK_EVAL = {
    "overall": 50,
    "technical": 50,
    "communication": 50,
    "confidence": 50,
    "strengths": ["Answer was provided."],
    "weaknesses": ["Unable to evaluate due to API issue."],
    "suggestions": ["Try answering with more specific examples."],
}


def evaluate_answer(question: str, answer: str) -> Dict[str, Any]:
    """Evaluate a single answer. Falls back on API failure."""
    if not answer or not answer.strip():
        return {
            "overall": 0,
            "technical": 0,
            "communication": 0,
            "confidence": 0,
            "strengths": [],
            "weaknesses": ["No answer provided."],
            "suggestions": ["Provide a complete answer to receive feedback."],
        }
    prompt = EVAL_PROMPT_TEMPLATE.format(question=question, answer=answer[:3000])
    try:
        raw = _generate(prompt)
        result = _parse_json(raw)
        # Validate and clamp scores
        for key in ("overall", "technical", "communication", "confidence"):
            if key in result:
                result[key] = max(0, min(100, int(round(float(result[key])))))
        for key in ("strengths", "weaknesses", "suggestions"):
            if key not in result or not isinstance(result[key], list):
                result[key] = []
        return result
    except Exception as e:
        logger.error("Evaluation failed, using fallback: %s", e)
        return FALLBACK_EVAL
