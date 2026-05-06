import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from services.pdf_service import extract_text, extract_images
from services.ai_service import generate_ddr
from models.report_model import Report
from extensions import db

report_bp = Blueprint("report_bp", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
ALLOWED_EXTENSIONS = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ----------------------------
# HELPER
# ----------------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ----------------------------
# UPLOAD API
# ----------------------------
@report_bp.route("/upload", methods=["POST"])
def upload_files():
    if "inspection" not in request.files or "thermal" not in request.files:
        return jsonify({"error": "Both inspection and thermal PDFs are required"}), 400

    inspection_file = request.files["inspection"]
    thermal_file = request.files["thermal"]

    if inspection_file.filename == "" or thermal_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(inspection_file.filename) or not allowed_file(thermal_file.filename):
        return jsonify({"error": "Only PDF files allowed"}), 400

    # secure filenames
    inspection_name = secure_filename(inspection_file.filename).lower()
    thermal_name = secure_filename(thermal_file.filename).lower()

    inspection_path = os.path.join(UPLOAD_FOLDER, inspection_name)
    thermal_path = os.path.join(UPLOAD_FOLDER, thermal_name)

    inspection_file.save(inspection_path)
    thermal_file.save(thermal_path)

    return jsonify({
        "message": "Files uploaded successfully",
        "inspection_path": inspection_path,
        "thermal_path": thermal_path
    })


# ----------------------------
# DDR GENERATION API
# ----------------------------
@report_bp.route("/generate-ddr", methods=["POST"])
def generate_ddr_api():
    data = request.get_json()

    inspection_path = data.get("inspection_path")
    thermal_path = data.get("thermal_path")

    if not inspection_path or not thermal_path:
        return jsonify({"error": "Missing file paths"}), 400

    # Convert to absolute paths safely
    inspection_full_path = os.path.abspath(inspection_path)
    thermal_full_path = os.path.abspath(thermal_path)

    # check file existence
    if not os.path.exists(inspection_full_path):
        return jsonify({"error": f"Inspection file not found: {inspection_full_path}"}), 400

    if not os.path.exists(thermal_full_path):
        return jsonify({"error": f"Thermal file not found: {thermal_full_path}"}), 400

    # ----------------------------
    # STEP 1: Extract text
    # ----------------------------
    inspection_text = extract_text(inspection_full_path)
    thermal_text = extract_text(thermal_full_path)

    # ----------------------------
    # STEP 2: Extract images
    # ----------------------------
    image_paths = extract_images(thermal_full_path, prefix="thermal")

    # ----------------------------
    # STEP 3: Call AI
    # ----------------------------
    ddr_output = generate_ddr(
        inspection_text,
        thermal_text,
        image_paths
    )

    # ----------------------------
    # STEP 4: Save to DB
    # ----------------------------
    report = Report(
        inspection_file=inspection_full_path,
        thermal_file=thermal_full_path,
        ddr_output=ddr_output
    )

    db.session.add(report)
    db.session.commit()

    # ----------------------------
    # STEP 5: Response
    # ----------------------------
    return jsonify({
        "message": "DDR Generated Successfully",
        "report_id": report.id,
        "ddr": ddr_output
    })