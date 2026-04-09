// ===== Passport Photo Standards =====
const STANDARDS = [
  { id: 'us',         name: 'US Passport',    w: 51,   h: 51,   label: '2 × 2 in (51 × 51 mm)' },
  { id: 'cn1',        name: 'China 1-inch',   w: 25,   h: 35,   label: '25 × 35 mm' },
  { id: 'cn2',        name: 'China 2-inch',   w: 35,   h: 49,   label: '35 × 49 mm' },
  { id: 'eu',         name: 'EU / UK',        w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'jp',         name: 'Japan',          w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'au',         name: 'Australia',      w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'ca',         name: 'Canada',         w: 50,   h: 70,   label: '50 × 70 mm' },
  { id: 'kr',         name: 'South Korea',    w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'in',         name: 'India',          w: 51,   h: 51,   label: '2 × 2 in (51 × 51 mm)' },
];

// Paper sizes in mm
const PAPERS = [
  { id: '4x6',    name: '4 × 6 in',          w: 101.6, h: 152.4 },
  { id: '5x7',    name: '5 × 7 in',          w: 127.0, h: 177.8 },
  { id: 'a4',     name: 'A4',                 w: 210,   h: 297   },
  { id: 'letter', name: 'US Letter (8.5×11)', w: 215.9, h: 279.4 },
];

const DPI = 300;
const GUTTER_MM = 2; // space between photos for cutting

// ===== State =====
let state = {
  file: null,
  imageURL: null,
  standard: STANDARDS[0],
  cropper: null,
  croppedCanvas: null,
  paper: PAPERS[0],
};

// ===== DOM References =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const fileInput     = $('#file-input');
const uploadArea    = $('#upload-area');
const imagePreview  = $('#image-preview');
const previewImg    = $('#preview-img');
const fileInfo      = $('#file-info');
const standardGrid  = $('#standard-grid');
const btnToCrop     = $('#btn-to-crop');
const cropImage     = $('#crop-image');
const btnBackUpload = $('#btn-back-upload');
const btnToPrint    = $('#btn-to-print');
const paperSelect   = $('#paper-select');
const formatSelect  = $('#format-select');
const printCanvas   = $('#print-canvas');
const layoutInfo    = $('#layout-info');
const btnBackCrop   = $('#btn-back-crop');
const btnDownload   = $('#btn-download');

// ===== Initialize =====
function init() {
  renderStandards();
  renderPapers();
  bindEvents();
}

// ===== Render standard options =====
function renderStandards() {
  standardGrid.innerHTML = STANDARDS.map((s, i) => `
    <div class="standard-option${i === 0 ? ' selected' : ''}" data-id="${s.id}">
      <span class="std-name">${s.name}</span>
      <span class="std-size">${s.label}</span>
    </div>
  `).join('');
}

// ===== Render paper options =====
function renderPapers() {
  paperSelect.innerHTML = PAPERS.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
}

// ===== Event Binding =====
function bindEvents() {
  // File upload
  fileInput.addEventListener('change', handleFileSelect);

  // Drag & drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadFile(file);
    }
  });

  // Standard selection
  standardGrid.addEventListener('click', (e) => {
    const option = e.target.closest('.standard-option');
    if (!option) return;
    $$('.standard-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
    state.standard = STANDARDS.find(s => s.id === option.dataset.id);
    updateContinueButton();
  });

  // Navigation
  btnToCrop.addEventListener('click', goToCrop);
  btnBackUpload.addEventListener('click', () => goToStep(1));
  btnToPrint.addEventListener('click', goToPrint);
  btnBackCrop.addEventListener('click', () => {
    goToStep(2);
    initCropper();
  });

  // Paper selection change
  paperSelect.addEventListener('change', () => {
    state.paper = PAPERS.find(p => p.id === paperSelect.value);
    renderPrintPreview();
  });

  // Download
  btnDownload.addEventListener('click', downloadPrint);
}

// ===== File Handling =====
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadFile(file);
}

function loadFile(file) {
  state.file = file;
  if (state.imageURL) URL.revokeObjectURL(state.imageURL);
  state.imageURL = URL.createObjectURL(file);

  previewImg.src = state.imageURL;
  imagePreview.classList.add('visible');

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  fileInfo.textContent = `${file.name} — ${sizeMB} MB`;

  // Update upload area appearance
  uploadArea.querySelector('h3').textContent = 'Photo loaded ✓';
  uploadArea.querySelector('p').textContent = 'Drop another photo to replace';

  updateContinueButton();
}

function updateContinueButton() {
  btnToCrop.disabled = !state.file;
}

// ===== Step Navigation =====
function goToStep(n) {
  // Destroy cropper when leaving step 2
  if (state.cropper && n !== 2) {
    state.cropper.destroy();
    state.cropper = null;
  }

  $$('.step-panel').forEach(p => p.classList.remove('active'));
  $(`#step-${n}`).classList.add('active');

  $$('.stepper-step').forEach(s => {
    const stepNum = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    if (stepNum === n) s.classList.add('active');
    else if (stepNum < n) s.classList.add('done');
  });
}

// ===== Step 2: Crop =====
function goToCrop() {
  goToStep(2);
  initCropper();
}

function initCropper() {
  cropImage.src = state.imageURL;
  // Wait for image to load before initializing cropper
  cropImage.onload = () => {
    if (state.cropper) state.cropper.destroy();

    const { w, h } = state.standard;
    state.cropper = new Cropper(cropImage, {
      aspectRatio: w / h,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.85,
      responsive: true,
      guides: true,
      center: true,
      highlight: false,
      background: false,
      cropBoxResizable: true,
      cropBoxMovable: true,
      toggleDragModeOnDblclick: false,
    });
  };
}

// ===== Step 3: Print Layout =====
function goToPrint() {
  if (!state.cropper) return;

  // Get cropped image at high resolution
  const { w, h } = state.standard;
  const pxW = Math.round(w / 25.4 * DPI);
  const pxH = Math.round(h / 25.4 * DPI);

  state.croppedCanvas = state.cropper.getCroppedCanvas({
    width: pxW,
    height: pxH,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });

  goToStep(3);
  renderPrintPreview();
}

function renderPrintPreview() {
  const paper = state.paper;
  const std = state.standard;
  const gutterPx = Math.round(GUTTER_MM / 25.4 * DPI);
  const marginPx = gutterPx; // same margin around edges

  // Paper dimensions in pixels at 300 DPI
  const paperPxW = Math.round(paper.w / 25.4 * DPI);
  const paperPxH = Math.round(paper.h / 25.4 * DPI);

  // Photo dimensions in pixels
  const photoPxW = Math.round(std.w / 25.4 * DPI);
  const photoPxH = Math.round(std.h / 25.4 * DPI);

  // Calculate grid
  const cols = Math.floor((paperPxW - marginPx) / (photoPxW + gutterPx));
  const rows = Math.floor((paperPxH - marginPx) / (photoPxH + gutterPx));
  const totalPhotos = cols * rows;

  // Center the grid
  const gridW = cols * photoPxW + (cols - 1) * gutterPx;
  const gridH = rows * photoPxH + (rows - 1) * gutterPx;
  const offsetX = Math.round((paperPxW - gridW) / 2);
  const offsetY = Math.round((paperPxH - gridH) / 2);

  // Draw on canvas
  printCanvas.width = paperPxW;
  printCanvas.height = paperPxH;
  const ctx = printCanvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, paperPxW, paperPxH);

  // Draw photos
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * (photoPxW + gutterPx);
      const y = offsetY + r * (photoPxH + gutterPx);
      ctx.drawImage(state.croppedCanvas, x, y, photoPxW, photoPxH);
    }
  }

  // Draw cutting guide lines (light gray dashed)
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);

  // Vertical lines
  for (let c = 0; c <= cols; c++) {
    const x = offsetX + c * (photoPxW + gutterPx) - gutterPx / 2;
    if (c === 0) continue; // skip before first
    if (c === cols) { // after last
      const xEnd = offsetX + gridW + gutterPx / 2;
      ctx.beginPath();
      ctx.moveTo(xEnd, offsetY - gutterPx);
      ctx.lineTo(xEnd, offsetY + gridH + gutterPx);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, offsetY - gutterPx);
      ctx.lineTo(x, offsetY + gridH + gutterPx);
      ctx.stroke();
    }
  }

  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = offsetY + r * (photoPxH + gutterPx) - gutterPx / 2;
    if (r === 0) continue;
    if (r === rows) {
      const yEnd = offsetY + gridH + gutterPx / 2;
      ctx.beginPath();
      ctx.moveTo(offsetX - gutterPx, yEnd);
      ctx.lineTo(offsetX + gridW + gutterPx, yEnd);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(offsetX - gutterPx, y);
      ctx.lineTo(offsetX + gridW + gutterPx, y);
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);

  // Update info text
  layoutInfo.textContent = `${totalPhotos} photos (${cols} × ${rows}) on ${paper.name} paper at 300 DPI`;

  // Scale canvas display for preview (CSS)
  printCanvas.style.maxWidth = '100%';
  printCanvas.style.height = 'auto';
}

// ===== Download =====
function downloadPrint() {
  const format = formatSelect.value;
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.95;
  const ext = format === 'png' ? 'png' : 'jpg';

  printCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passport-photo-${state.standard.id}-${state.paper.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, mimeType, quality);
}

// ===== Start =====
init();
