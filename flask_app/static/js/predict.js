/* predict.js  —  Prediction page logic
   Handles: tab switching, range slider live values, segmented controls,
            select cards, manual form AJAX submit, file upload AJAX submit,
            result rendering.
*/

'use strict';

// ── Tab switching ──────────────────────────────────────────────────────────
var tabs   = document.querySelectorAll('.tab');
var panels = { manual: document.getElementById('panel-manual'),
               upload: document.getElementById('panel-upload') };

tabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    var target = tab.dataset.target;

    tabs.forEach(function (t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    Object.keys(panels).forEach(function (k) {
      var p = panels[k];
      if (k === target) {
        p.classList.add('active');
        p.removeAttribute('hidden');
      } else {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      }
    });

    // Hide result when switching tabs
    hideResult();
  });
});

// ── Range sliders — live display + fill gradient ───────────────────────────
function initRanges() {
  document.querySelectorAll('.range-input').forEach(function (input) {
    var valEl = document.getElementById(input.id + '-val');

    function update() {
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      var val = parseFloat(input.value);
      var pct = ((val - min) / (max - min) * 100).toFixed(1) + '%';

      input.style.setProperty('--pct', pct);

      if (!valEl) return;

      // Oldpeak is stored as integer * 10 (0–60 → 0.0–6.0)
      if (input.id === 'oldpeak') {
        valEl.textContent = (val / 10).toFixed(1);
      } else {
        valEl.textContent = val;
      }
    }

    input.addEventListener('input', update);
    update(); // init
  });
}

// ── Segmented controls ─────────────────────────────────────────────────────
function initSegControls() {
  document.querySelectorAll('.seg-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field   = btn.dataset.field;
      var value   = btn.dataset.value;
      var group   = btn.closest('.seg-control');
      var hiddenInput = document.getElementById('hidden-' + field);

      group.querySelectorAll('.seg-btn').forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      if (hiddenInput) hiddenInput.value = value;
    });
  });
}

// ── Select cards ────────────────────────────────────────────────────────────
function initSelectCards() {
  document.querySelectorAll('.select-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var field   = card.dataset.field;
      var value   = card.dataset.value;
      var group   = card.closest('.select-grid');
      var hiddenInput = document.getElementById('hidden-' + field);

      group.querySelectorAll('.select-card').forEach(function (c) {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');

      if (hiddenInput) hiddenInput.value = value;
    });
  });
}

// ── Collect form data ───────────────────────────────────────────────────────
function collectFormData() {
  var form  = document.getElementById('manual-form');
  var data  = {};
  var inputs = form.querySelectorAll('input[name], select[name]');

  inputs.forEach(function (input) {
    data[input.name] = input.value;
  });

  // Oldpeak is stored ×10 in the slider
  if (data.oldpeak !== undefined) {
    data.oldpeak = (parseFloat(data.oldpeak) / 10).toFixed(1);
  }

  return data;
}

// ── Result panel ────────────────────────────────────────────────────────────
var resultPanel = document.getElementById('result-panel');

function showResult(res, extracted) {
  resultPanel.className = 'result-panel ' + res.level;
  resultPanel.removeAttribute('hidden');

  var icon  = res.level === 'high' ? '⚠️' : '✅';
  var advice = res.level === 'high'
    ? 'Your results suggest an elevated risk of heart disease. Please consult a qualified cardiologist as soon as possible for a thorough evaluation.'
    : 'Your results suggest a lower risk of heart disease. Continue maintaining healthy lifestyle habits, and consult your doctor for regular check-ups.';

  var extractedHTML = '';
  if (extracted) {
    var rows = [
      ['Age', extracted.age],
      ['Sex', extracted.sex],
      ['Chest Pain', extracted.chest_pain],
      ['Resting BP', extracted.resting_bp + ' mmHg'],
      ['Cholesterol', extracted.cholesterol + ' mg/dL'],
      ['Fasting BS > 120', extracted.fasting_bs ? 'Yes' : 'No'],
      ['Resting ECG', extracted.resting_ecg],
      ['Max HR', extracted.max_hr + ' bpm'],
      ['Exercise Angina', extracted.exercise_angina === 'Y' ? 'Yes' : 'No'],
      ['Oldpeak', extracted.oldpeak],
      ['ST Slope', extracted.st_slope],
    ];
    var trs = rows.map(function (r) {
      return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');
    extractedHTML = '<details class="extracted-details" style="width:100%;text-align:left">'
      + '<summary style="cursor:pointer;font-size:0.8125rem;color:var(--clr-text-3);margin-bottom:0.5rem">Extracted data from file</summary>'
      + '<table class="extracted-table">' + trs + '</table>'
      + '</details>';
  }

  document.getElementById('result-inner').innerHTML =
    '<div class="result-icon ' + res.level + '">' + icon + '</div>'
    + '<div>'
      + '<div class="result-label ' + res.level + '">' + res.label + '</div>'
    + '</div>'
    + '<div>'
      + '<div class="result-pct ' + res.level + '">' + res.risk_percent + '%</div>'
      + '<div class="result-pct-label">Estimated risk score</div>'
    + '</div>'
    + '<p class="result-advice">' + advice + '</p>'
    + extractedHTML
    + '<button class="result-retry" id="retry-btn" onclick="retryPrediction()" aria-label="Try another prediction">'
      + '↩ Try another'
    + '</button>';

  // Smooth scroll to result
  setTimeout(function () {
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function hideResult() {
  resultPanel.setAttribute('hidden', '');
  resultPanel.className = 'result-panel';
}

function retryPrediction() {
  hideResult();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Manual form submit ──────────────────────────────────────────────────────
var manualBtn = document.getElementById('manual-submit-btn');

document.getElementById('manual-form').addEventListener('submit', function (e) {
  e.preventDefault();
  runManualPrediction();
});

function runManualPrediction() {
  var data = collectFormData();

  setLoading(manualBtn, true);
  hideResult();

  fetch('/api/predict/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  .then(function (r) { return r.json(); })
  .then(function (res) {
    setLoading(manualBtn, false);
    if (res.success) {
      showResult(res, null);
    } else {
      alert('Prediction error: ' + (res.error || 'Unknown error'));
    }
  })
  .catch(function (err) {
    setLoading(manualBtn, false);
    alert('Network error: ' + err.message);
  });
}

// ── File upload ─────────────────────────────────────────────────────────────
var uploadBtn   = document.getElementById('upload-submit-btn');
var fileInput   = document.getElementById('file-input');
var uploadArea  = document.getElementById('upload-area');
var uploadTitle = uploadArea ? uploadArea.querySelector('.upload-title') : null;

if (fileInput) {
  fileInput.addEventListener('change', function () {
    var file = fileInput.files[0];
    if (file) {
      if (uploadTitle) uploadTitle.textContent = '📄 ' + file.name;
      uploadBtn.disabled = false;
    }
  });
}

// Drag-and-drop
if (uploadArea) {
  uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', function () {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', function (e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    var files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files; // DataTransfer to input
      if (uploadTitle) uploadTitle.textContent = '📄 ' + files[0].name;
      uploadBtn.disabled = false;
    }
  });
  // Keyboard activate
  uploadArea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  uploadArea.addEventListener('click', function () {
    fileInput.click();
  });
}

if (uploadBtn) {
  uploadBtn.addEventListener('click', function () {
    var file = fileInput.files[0];
    if (!file) { alert('Please select a file first.'); return; }

    var formData = new FormData();
    formData.append('file', file);

    setLoading(uploadBtn, true);
    hideResult();

    fetch('/api/predict/pdf', { method: 'POST', body: formData })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      setLoading(uploadBtn, false);
      if (res.success) {
        showResult(res, res.extracted || null);
      } else {
        alert('Prediction error: ' + (res.error || 'Unknown error'));
      }
    })
    .catch(function (err) {
      setLoading(uploadBtn, false);
      alert('Network error: ' + err.message);
    });
  });
}

// ── Loading state helper ─────────────────────────────────────────────────────
function setLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ── Init ────────────────────────────────────────────────────────────────────
initRanges();
initSegControls();
initSelectCards();
