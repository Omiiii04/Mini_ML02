"""
Heart Stroke Prediction - Flask Application
Replaces the old Streamlit app with a premium Flask frontend.
"""

from pathlib import Path
import io
import re

from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
MODEL_DIR  = BASE_DIR / "models"

# ── Load saved model artifacts ─────────────────────────────────────────────────
model            = joblib.load(MODEL_DIR / "KNN.pkl")
scaler           = joblib.load(MODEL_DIR / "scaler.pkl")
expected_columns = joblib.load(MODEL_DIR / "columns.pkl")

# ── Flask app ──────────────────────────────────────────────────────────────────
app = Flask(__name__, template_folder="templates", static_folder="static")


# ── Helper ─────────────────────────────────────────────────────────────────────
def build_input_df(raw: dict) -> pd.DataFrame:
    """Convert the flat raw-input dict into the feature DataFrame the model needs."""
    input_df = pd.DataFrame([raw])
    for col in expected_columns:
        if col not in input_df.columns:
            input_df[col] = 0
    input_df = input_df[expected_columns]
    return input_df


def run_prediction(input_df: pd.DataFrame) -> dict:
    """Scale → predict → return result payload."""
    scaled = scaler.transform(input_df)
    pred   = model.predict(scaled)[0]
    proba  = model.predict_proba(scaled)[0]

    risk_pct = round(float(proba[1]) * 100, 1)
    label    = "High Risk" if pred == 1 else "Low Risk"
    level    = "high"     if pred == 1 else "low"

    return {"label": label, "level": level, "risk_percent": risk_pct}


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict")
def predict_page():
    return render_template("predict.html")


@app.route("/api/predict/manual", methods=["POST"])
def predict_manual():
    """Handle the manual-form submission (JSON body)."""
    try:
        data = request.get_json(force=True)

        age              = int(data["age"])
        sex              = data["sex"]          # 'M' or 'F'
        chest_pain       = data["chest_pain"]   # 'ATA', 'NAP', 'TA', 'ASY'
        resting_bp       = int(data["resting_bp"])
        cholesterol      = int(data["cholesterol"])
        fasting_bs       = int(data["fasting_bs"])
        resting_ecg      = data["resting_ecg"]  # 'Normal', 'ST', 'LVH'
        max_hr           = int(data["max_hr"])
        exercise_angina  = data["exercise_angina"]  # 'Y' or 'N'
        oldpeak          = float(data["oldpeak"])
        st_slope         = data["st_slope"]     # 'Up', 'Flat', 'Down'

        raw = {
            "Age":        age,
            "RestingBP":  resting_bp,
            "Cholesterol": cholesterol,
            "FastingBS":  fasting_bs,
            "MaxHR":      max_hr,
            "Oldpeak":    oldpeak,
            f"Sex_{sex}": 1,
            f"ChestPainType_{chest_pain}": 1,
            f"RestingECG_{resting_ecg}": 1,
            f"ExerciseAngina_{exercise_angina}": 1,
            f"ST_Slope_{st_slope}": 1,
        }

        input_df = build_input_df(raw)
        result   = run_prediction(input_df)
        return jsonify({"success": True, **result})

    except (KeyError, ValueError, TypeError) as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@app.route("/api/predict/pdf", methods=["POST"])
def predict_pdf():
    """
    Handle CSV / text upload that contains patient features.
    We parse key=value pairs from the uploaded text/csv.
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        file = request.files["file"]
        filename = file.filename.lower()

        content = file.read().decode("utf-8", errors="ignore")

        # ── Try CSV first ──────────────────────────────────────────────────────
        if filename.endswith(".csv"):
            df_raw = pd.read_csv(io.StringIO(content))
            if df_raw.empty:
                return jsonify({"success": False, "error": "CSV is empty"}), 400
            row   = df_raw.iloc[0]
            age   = int(row.get("Age", 40))
            sex   = str(row.get("Sex", "M"))
            chest_pain      = str(row.get("ChestPainType", "ATA"))
            resting_bp      = int(row.get("RestingBP", 120))
            cholesterol     = int(row.get("Cholesterol", 200))
            fasting_bs      = int(row.get("FastingBS", 0))
            resting_ecg     = str(row.get("RestingECG", "Normal"))
            max_hr          = int(row.get("MaxHR", 150))
            exercise_angina = str(row.get("ExerciseAngina", "N"))
            oldpeak         = float(row.get("Oldpeak", 1.0))
            st_slope        = str(row.get("ST_Slope", "Up"))

        else:
            # ── Fall back to key=value text parsing ────────────────────────────
            def extract(pattern, default):
                m = re.search(pattern, content, re.IGNORECASE)
                return m.group(1).strip() if m else default

            age             = int(extract(r"age[:\s=]+(\d+)", "40"))
            sex             = extract(r"sex[:\s=]+([MF])\b", "M").upper()
            chest_pain      = extract(r"chest.?pain[:\s=]+(\w+)", "ATA").upper()
            resting_bp      = int(extract(r"resting.?bp[:\s=]+(\d+)", "120"))
            cholesterol     = int(extract(r"cholesterol[:\s=]+(\d+)", "200"))
            fasting_bs      = int(extract(r"fasting.?bs[:\s=]+([01])", "0"))
            resting_ecg     = extract(r"resting.?ecg[:\s=]+(\w+)", "Normal")
            max_hr          = int(extract(r"max.?hr[:\s=]+(\d+)", "150"))
            exercise_angina = extract(r"exercise.?angina[:\s=]+([YN])\b", "N").upper()
            oldpeak         = float(extract(r"oldpeak[:\s=]+([\d.]+)", "1.0"))
            st_slope        = extract(r"st.?slope[:\s=]+(\w+)", "Up").capitalize()

        raw = {
            "Age":        age,
            "RestingBP":  resting_bp,
            "Cholesterol": cholesterol,
            "FastingBS":  fasting_bs,
            "MaxHR":      max_hr,
            "Oldpeak":    oldpeak,
            f"Sex_{sex}": 1,
            f"ChestPainType_{chest_pain}": 1,
            f"RestingECG_{resting_ecg}": 1,
            f"ExerciseAngina_{exercise_angina}": 1,
            f"ST_Slope_{st_slope}": 1,
        }

        input_df = build_input_df(raw)
        result   = run_prediction(input_df)

        # Also return extracted fields so the UI can show them
        extracted = {
            "age": age, "sex": sex, "chest_pain": chest_pain,
            "resting_bp": resting_bp, "cholesterol": cholesterol,
            "fasting_bs": fasting_bs, "resting_ecg": resting_ecg,
            "max_hr": max_hr, "exercise_angina": exercise_angina,
            "oldpeak": oldpeak, "st_slope": st_slope,
        }
        return jsonify({"success": True, **result, "extracted": extracted})

    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
