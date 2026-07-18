"""Evaluation service.

Aggregates per-question evaluations into a full interview report
including skill match %, job readiness %, and PDF generation.
"""

import io
import os
import time
from typing import List, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from services.gemini_service import evaluate_answer
from services.skill_extractor import SKILL_CATALOG


def _avg(values: List[float]) -> int:
    if not values:
        return 0
    return int(round(sum(values) / len(values)))


def evaluate_interview(
    questions: List[Dict[str, Any]], answers: List[str], skills: List[str]
) -> Dict[str, Any]:
    """Evaluate every answer and aggregate into a report."""
    per_question = []
    technical_scores = []
    communication_scores = []
    confidence_scores = []
    overall_scores = []

    for q, ans in zip(questions, answers):
        result = evaluate_answer(q.get("question", ""), ans)
        per_question.append(
            {
                "question": q.get("question", ""),
                "answer": ans,
                "difficulty": q.get("difficulty", "Medium"),
                "topic": q.get("topic", ""),
                "evaluation": result,
            }
        )
        technical_scores.append(result.get("technical", 0))
        communication_scores.append(result.get("communication", 0))
        confidence_scores.append(result.get("confidence", 0))
        overall_scores.append(result.get("overall", 0))

    technical = _avg(technical_scores)
    communication = _avg(communication_scores)
    confidence = _avg(confidence_scores)
    overall = _avg(overall_scores)

    # Skill match %: fraction of catalog skills detected.
    skill_match = (
        int(round((len(skills) / len(SKILL_CATALOG)) * 100)) if SKILL_CATALOG else 0
    )

    # Job readiness: weighted blend of overall, technical, communication, confidence + skill match.
    job_readiness = int(
        round(
            0.35 * overall
            + 0.25 * technical
            + 0.15 * communication
            + 0.15 * confidence
            + 0.10 * skill_match
        )
    )
    job_readiness = max(0, min(100, job_readiness))

    # Aggregate strengths/weaknesses/suggestions across questions (deduped, top items).
    strengths = _aggregate_field(per_question, "strengths", top=6)
    weaknesses = _aggregate_field(per_question, "weaknesses", top=6)
    suggestions = _aggregate_field(per_question, "suggestions", top=6)

    return {
        "per_question": per_question,
        "scores": {
            "overall": overall,
            "technical": technical,
            "communication": communication,
            "confidence": confidence,
            "skill_match": skill_match,
            "job_readiness": job_readiness,
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "skills": skills,
        "timestamp": time.time(),
    }


def _aggregate_field(
    per_question: List[Dict[str, Any]], field: str, top: int = 6
) -> List[str]:
    seen = []
    for item in per_question:
        for entry in item.get("evaluation", {}).get(field, []):
            text = entry.strip()
            if text and text not in seen:
                seen.append(text)
            if len(seen) >= top:
                return seen
    return seen


# ---------------------------------------------------------------------------
# PDF report generation
# ---------------------------------------------------------------------------


def generate_pdf_report(
    report: Dict[str, Any], candidate_name: str = "Candidate"
) -> bytes:
    """Generate a PDF report and return its bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, topMargin=15 * mm, bottomMargin=15 * mm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleX",
        parent=styles["Title"],
        textColor=colors.HexColor("#4f46e5"),
        fontSize=22,
        spaceAfter=10,
    )
    h2 = ParagraphStyle(
        "H2x",
        parent=styles["Heading2"],
        textColor=colors.HexColor("#0f172a"),
        fontSize=14,
        spaceBefore=10,
        spaceAfter=6,
    )
    body = ParagraphStyle("BodyX", parent=styles["BodyText"], fontSize=10, leading=14)
    bullet = ParagraphStyle(
        "BulletX",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        leftIndent=12,
        bulletIndent=2,
    )

    story = []
    story.append(Paragraph("AI Interview Coach - Report", title_style))
    story.append(Paragraph(f"Candidate: {candidate_name}", body))
    story.append(Paragraph(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}", body))
    story.append(Spacer(1, 8))

    # Scores table
    scores = report.get("scores", {})
    score_rows = [["Metric", "Score"]]
    for label in [
        "overall",
        "technical",
        "communication",
        "confidence",
        "skill_match",
        "job_readiness",
    ]:
        score_rows.append(
            [label.replace("_", " ").title(), f"{scores.get(label, 0)} / 100"]
        )
    tbl = Table(score_rows, colWidths=[80 * mm, 30 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ]
        )
    )
    story.append(tbl)
    story.append(Spacer(1, 10))

    # Skills
    story.append(Paragraph("Detected Skills", h2))
    story.append(Paragraph(", ".join(report.get("skills", [])) or "None", body))
    story.append(Spacer(1, 8))

    # Strengths / Weaknesses / Suggestions
    for field, title in [
        ("strengths", "Strengths"),
        ("weaknesses", "Areas for Improvement"),
        ("suggestions", "Suggestions"),
    ]:
        story.append(Paragraph(title, h2))
        for item in report.get(field, []):
            story.append(Paragraph(f"&bull; {item}", bullet))
        story.append(Spacer(1, 6))

    # Per-question detail
    story.append(PageBreak())
    story.append(Paragraph("Question & Answer Detail", h2))
    for i, item in enumerate(report.get("per_question", []), 1):
        story.append(
            Paragraph(
                f"Q{i} [{item.get('difficulty', '')} - {item.get('topic', '')}]", h2
            )
        )
        story.append(Paragraph(item.get("question", ""), body))
        story.append(
            Paragraph(
                "<b>Answer:</b> " + (item.get("answer", "") or "No answer provided."),
                body,
            )
        )
        ev = item.get("evaluation", {})
        story.append(
            Paragraph(
                f"Scores - Overall: {ev.get('overall', 0)}, Technical: {ev.get('technical', 0)}, "
                f"Communication: {ev.get('communication', 0)}, Confidence: {ev.get('confidence', 0)}",
                body,
            )
        )
        story.append(Spacer(1, 8))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
