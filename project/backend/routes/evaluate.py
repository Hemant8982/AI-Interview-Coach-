"""Evaluate route: receives Q&A pairs, returns evaluation report and optional PDF."""

import io
import logging

from flask import Blueprint, request, jsonify, current_app, send_file

from services.evaluation_service import evaluate_interview, generate_pdf_report

logger = logging.getLogger(__name__)

evaluate_bp = Blueprint("evaluate", __name__)


@evaluate_bp.post("/api/evaluate")
def evaluate():
    data = request.get_json(silent=True) or {}

    interview_id = data.get("interviewId")
    questions = data.get("questions")
    answers = data.get("answers")
    candidate_name = data.get("candidateName", "Candidate")

    interviews = current_app.config.get("INTERVIEWS", {})
    stored = interviews.get(interview_id) if interview_id else None

    # Prefer stored questions; fall back to provided ones.
    if stored and not questions:
        questions = stored["questions"]
    if not questions or not isinstance(questions, list):
        return jsonify({"error": "Questions are required."}), 400

    if not answers or not isinstance(answers, list):
        return jsonify({"error": "Answers are required."}), 400

    # Pad/truncate answers to match questions length.
    if len(answers) < len(questions):
        answers = answers + [""] * (len(questions) - len(answers))
    elif len(answers) > len(questions):
        answers = answers[: len(questions)]

    skills = (stored["skills"] if stored else data.get("skills")) or []

    try:
        report = evaluate_interview(questions, answers, skills)
    except Exception as e:
        logger.exception("Evaluation failed")
        return jsonify({"error": f"Evaluation failed: {e}"}), 500

    # Store report in memory
    if stored is not None:
        stored["report"] = report
        stored["candidate_name"] = candidate_name
    else:
        interviews[interview_id or "anon"] = {
            "questions": questions,
            "skills": skills,
            "report": report,
            "candidate_name": candidate_name,
        }
        current_app.config["INTERVIEWS"] = interviews

    return jsonify(
        {
            "interviewId": interview_id,
            "report": report,
        }
    )


@evaluate_bp.post("/api/report/pdf")
def download_pdf():
    data = request.get_json(silent=True) or {}
    interview_id = data.get("interviewId")
    candidate_name = data.get("candidateName", "Candidate")

    interviews = current_app.config.get("INTERVIEWS", {})
    stored = interviews.get(interview_id)
    if not stored or "report" not in stored:
        return (
            jsonify(
                {"error": "Report not found. Please evaluate the interview first."}
            ),
            404,
        )

    try:
        pdf_bytes = generate_pdf_report(stored["report"], candidate_name)
    except Exception as e:
        logger.exception("PDF generation failed")
        return jsonify({"error": f"PDF generation failed: {e}"}), 500

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="AI_Interview_Report.pdf",
    )


@evaluate_bp.get("/api/health")
def health():
    return jsonify({"status": "ok"})
