# 🫀 CardioSense — Heart Stroke Risk Predictor

> **Academic mini-project** | Mini_ML02 · Flask + scikit-learn · K-Nearest Neighbours

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask)](https://flask.palletsprojects.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3%2B-orange?logo=scikit-learn)](https://scikit-learn.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

CardioSense is a full-stack machine learning web application that predicts a patient's heart disease risk using a **K-Nearest Neighbours (KNN)** model trained on 918 patient records from the UCI Heart Failure dataset.

---

## Features

| Feature | Details |
|---|---|
| **Premium Flask UI** | Apple Design-inspired dark-mode interface with glassmorphism, spring animations, and backdrop-filter materials |
| **Manual Input** | Guided form with live sliders, Apple-style segmented controls, and select cards for all 11 clinical features |
| **File Upload** | Drag-and-drop CSV or key=value text file upload with automatic field extraction |
| **Instant Results** | Risk percentage, colour-coded verdict, and personalised advice — all via asynchronous AJAX |
| **Accessible** | Full ARIA labels, keyboard navigation, prefers-reduced-motion support |
| **Privacy-first** | All inference happens server-side in your session; no data is stored |

---

## Project Structure

```
Mini_ML02/
├── flask_app/                 # Flask application
│   ├── app.py                 # Routes & ML inference logic
│   ├── templates/
│   │   ├── index.html         # Landing page
│   │   └── predict.html       # Prediction page
│   └── static/
│       ├── css/
│       │   ├── base.css       # Design tokens, reset, nav, footer
│       │   ├── index.css      # Landing page styles
│       │   └── predict.css    # Prediction page styles
│       └── js/
│           ├── index.js       # Landing page micro-interactions
│           └── predict.js     # Form logic, AJAX, result rendering
│
├── models/
│   ├── KNN.pkl                # Trained K-Nearest Neighbours model
│   ├── scaler.pkl             # StandardScaler fitted on training data
│   └── columns.pkl            # Expected feature column names
│
├── data/
│   └── heart.csv              # UCI Heart Failure dataset (918 records)
│
├── notebooks/
│   └── notebook.ipynb         # EDA, preprocessing & model training
│
├── app.py                     # Legacy Streamlit app (deprecated)
├── requirements.txt           # Python dependencies
└── README.md
```

---

## Quick Start

### 1 - Clone the repo

```bash
git clone https://github.com/<your-username>/Mini_ML02.git
cd Mini_ML02
```

### 2 - Create a virtual environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 3 - Install dependencies

```bash
pip install flask joblib pandas scikit-learn numpy
```

### 4 - Run the Flask app

```bash
python flask_app/app.py
```

Open **http://localhost:5000** in your browser.

---

## Using the Prediction Interface

### Manual Input

1. Navigate to **"Check My Risk"** from the landing page.
2. Use the sliders, segmented controls, and select cards to enter your clinical data.
3. Click **"Analyse Risk"** — results appear instantly below the form.

### File Upload

#### CSV (recommended)

The file must contain a header row with these exact columns:

```
Age,Sex,ChestPainType,RestingBP,Cholesterol,FastingBS,RestingECG,MaxHR,ExerciseAngina,Oldpeak,ST_Slope
```

Example row:

```
54,M,ASY,150,195,0,Normal,122,N,0.0,Up
```

#### Text file (key=value)

```
Age: 54
Sex: M
ChestPainType: ASY
RestingBP: 150
Cholesterol: 195
FastingBS: 0
RestingECG: Normal
MaxHR: 122
ExerciseAngina: N
Oldpeak: 0.0
ST_Slope: Up
```

---

## Machine Learning Details

### Dataset

| Property | Value |
|---|---|
| Source | UCI Heart Failure Dataset |
| Records | 918 patients |
| Features | 11 clinical features |
| Target | Binary (0 = no disease, 1 = heart disease) |

### Features

| Feature | Type | Description |
|---|---|---|
| Age | Numeric | Patient age in years |
| Sex | Categorical | M / F |
| ChestPainType | Categorical | ATA / NAP / TA / ASY |
| RestingBP | Numeric | Resting blood pressure (mm Hg) |
| Cholesterol | Numeric | Serum cholesterol (mg/dL) |
| FastingBS | Binary | Fasting blood sugar > 120 mg/dL (0/1) |
| RestingECG | Categorical | Normal / ST / LVH |
| MaxHR | Numeric | Maximum heart rate achieved |
| ExerciseAngina | Categorical | Exercise-induced angina (Y/N) |
| Oldpeak | Numeric | ST depression induced by exercise |
| ST_Slope | Categorical | Slope of peak exercise ST segment (Up/Flat/Down) |

### Pipeline

```
Raw Input
    ↓
One-hot encoding (via pre-fitted column mapping)
    ↓
StandardScaler (fitted on training data)
    ↓
KNN Classifier
    ↓
Binary prediction + probability score
```

---

## API Reference

### POST /api/predict/manual

**Content-Type:** `application/json`

**Body:**
```json
{
  "age": 54,
  "sex": "M",
  "chest_pain": "ASY",
  "resting_bp": 150,
  "cholesterol": 195,
  "fasting_bs": 0,
  "resting_ecg": "Normal",
  "max_hr": 122,
  "exercise_angina": "N",
  "oldpeak": 0.0,
  "st_slope": "Up"
}
```

**Response:**
```json
{
  "success": true,
  "label": "High Risk",
  "level": "high",
  "risk_percent": 78.4
}
```

### POST /api/predict/pdf

**Content-Type:** `multipart/form-data`  
**Field:** `file` — CSV or `.txt` file

**Response:**
```json
{
  "success": true,
  "label": "Low Risk",
  "level": "low",
  "risk_percent": 21.0,
  "extracted": { "age": 54, "sex": "M", ... }
}
```

---

## Design Principles

The UI follows **Apple's design principles** (WWDC 2018/2020/2026) translated to the web:

- **Translucent materials** — `backdrop-filter: blur()` nav and stat chips convey hierarchy
- **Spring-like interactions** — `scale(0.96)` on press with `ease-out 150ms`
- **Spatial consistency** — panels enter and exit along the same axis
- **Reduced motion** — all animations gate behind `prefers-reduced-motion: no-preference`
- **Typography** — negative tracking on large headings, loose body leading (1.6)
- **Shadows over borders** — elevation via layered `box-shadow`, not plain `border`

---

## Medical Disclaimer

> This application is an **academic mini-project** for educational purposes only.
> Predictions do **not** constitute medical advice, diagnosis, or treatment.
> Always consult a qualified healthcare professional for medical concerns.

---

## License

MIT © Mini_ML02 Academic Project
