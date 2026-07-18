"""Upload route: accepts resume + job role, returns skills and questions."""

import os
import uuid
import logging

from flask import Blueprint, request, jsonify, current_app

from services.resume_parser import ResumeParser
from services.skill_extractor import SkillExtractor
from services.gemini_service import generate_questions

logger = logging.getLogger(__name__)

upload_bp = Blueprint("upload", __name__)


@upload_bp.post("/api/upload")
def upload_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No resume file provided."}), 400

    file = request.files["resume"]
    if not file.filename:
        return jsonify({"error": "Empty file name."}), 400

    job_role = (
        request.form.get("jobRole") or request.form.get("job_role") or ""
    ).strip()
    if not job_role:
        return jsonify({"error": "Job role is required."}), 400

    # Save to uploads dir for audit/debugging
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    save_path = os.path.join(upload_dir, safe_name)
    file.save(save_path)

    try:
        with open(save_path, "rb") as f:
            resume_text = ResumeParser.parse(f, file.filename)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.exception("Resume parse failed")
        return jsonify({"error": f"Failed to parse resume: {e}"}), 500

    if not resume_text or len(resume_text.strip()) < 20:
        return (
            jsonify(
                {
                    "error": "Could not extract enough text from the resume. Please upload a text-based PDF or DOCX."
                }
            ),
            422,
        )

    skills = SkillExtractor.extract(resume_text)
    questions = generate_questions(resume_text, job_role)

    # Store in memory on app for the evaluate route.
    current_app.config.setdefault("INTERVIEWS", {})
    interview_id = uuid.uuid4().hex
    current_app.config["INTERVIEWS"][interview_id] = {
        "job_role": job_role,
        "skills": skills,
        "questions": questions,
        "resume_text": resume_text,
    }

    return jsonify(
        {
            "interviewId": interview_id,
            "skills": skills,
            "questions": questions,
            "jobRole": job_role,
        }
    )
