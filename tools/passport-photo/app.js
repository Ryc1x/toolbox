// ===== Passport Photo Standards =====
const STANDARDS = [
  { id: 'us',  name: 'US Passport',    w: 50.8, h: 50.8, label: '2 × 2 in (51 × 51 mm)' },
  { id: 'cn1', name: 'China 1-inch',   w: 25,   h: 35,   label: '25 × 35 mm' },
  { id: 'cn2', name: 'China 2-inch',   w: 35,   h: 49,   label: '35 × 49 mm' },
  { id: 'eu',  name: 'EU / UK',        w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'jp',  name: 'Japan',          w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'au',  name: 'Australia',      w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'ca',  name: 'Canada',         w: 50,   h: 70,   label: '50 × 70 mm' },
  { id: 'kr',  name: 'South Korea',    w: 35,   h: 45,   label: '35 × 45 mm' },
  { id: 'in',  name: 'India',          w: 50.8, h: 50.8, label: '2 × 2 in (51 × 51 mm)' },
  { id: 'custom', name: 'Custom Size', w: 35,   h: 45,   label: 'Define width x height', isCustom: true },
];

// Paper sizes in mm
const PAPERS = [
  { id: '4x6',    name: '4 × 6 in',           w: 101.6, h: 152.4 },
  { id: '5x7',    name: '5 × 7 in',           w: 127.0, h: 177.8 },
  { id: '6x8',    name: '6 × 8 in',           w: 152.4, h: 203.2 },
  { id: 'a5',     name: 'A5 (148 × 210 mm)',   w: 148,   h: 210   },
  { id: 'a4',     name: 'A4 (210 × 297 mm)',   w: 210,   h: 297   },
  { id: 'letter', name: 'US Letter (8.5 × 11)', w: 215.9, h: 279.4 },
  { id: '8x10',   name: '8 × 10 in',          w: 203.2, h: 254.0 },
  { id: 'a3',     name: 'A3 (297 × 420 mm)',   w: 297,   h: 420   },
];

// Border / gutter presets
const BORDER_PRESETS = [
  { id: 'compact',  name: 'Compact (Crop marks)', gutterMm: 0, align: 'center', desc: 'Zero gap, small guide marks around boundaries' },
  { id: 'dotted',   name: 'Compact (Dotted borders)', gutterMm: 0, align: 'center', desc: 'Zero gap, full dashed lines directly bordering photos' },
  { id: 'standard', name: 'Spaced (2mm gap)', gutterMm: 2, align: 'center', desc: 'Centered layout with 2mm cutting space' },
];

const DPI = 300;

// ===== State =====
let state = {
  standard: STANDARDS[0],
  cropper: null,
  // Multi-person photo bank: [{ id, label, croppedCanvas, imageURL, qty }]
  photos: [],
  nextPhotoId: 1,
  // Current upload in progress
  currentFile: null,
  currentImageURL: null,
  paper: PAPERS[0],
  borderPreset: BORDER_PRESETS[0],
  orientation: 'landscape',
  isAddingAnother: false,
  autoCropped: false,
};

// ===== DOM References =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Initialize =====
function init() {
  renderStandards();
  renderPapers();
  renderBorderPresets();
  bindEvents();
}

// ===== Render =====
function renderStandards() {
  const grid = $('#standard-grid');
  grid.innerHTML = STANDARDS.map((s, i) => `
    <div class="standard-option${i === 0 ? ' selected' : ''}" data-id="${s.id}">
      <span class="std-name">${s.name}</span>
      <span class="std-size">${s.label}</span>
    </div>
  `).join('');
}

function renderPapers() {
  $('#paper-select').innerHTML = PAPERS.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
}

function renderBorderPresets() {
  const container = $('#border-presets');
  container.innerHTML = BORDER_PRESETS.map((b, i) => `
    <div class="border-option${i === 0 ? ' selected' : ''}" data-id="${b.id}">
      <span class="border-name">${b.name}</span>
      <span class="border-desc">${b.desc}</span>
    </div>
  `).join('');
}

function renderPhotoBank() {
  const bank = $('#photo-bank');
  const emptyMsg = $('#photo-bank-empty');

  if (state.photos.length === 0) {
    bank.style.display = 'none';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  bank.style.display = 'block';

  bank.innerHTML = state.photos.map(p => {
    const thumbURL = p.croppedCanvas.toDataURL('image/jpeg', 0.6);
    return `
      <div class="photo-bank-item" data-id="${p.id}">
        <img src="${thumbURL}" alt="${p.label}">
        <div class="photo-bank-info">
          <input type="text" class="photo-label-input" value="${p.label}" data-id="${p.id}" placeholder="Name">
        </div>
        <button class="photo-bank-remove" data-id="${p.id}" title="Remove">×</button>
      </div>
    `;
  }).join('');

  // Bind label editing
  bank.querySelectorAll('.photo-label-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const photo = state.photos.find(p => p.id === parseInt(e.target.dataset.id));
      if (photo) photo.label = e.target.value;
    });
  });

  // Bind remove
  bank.querySelectorAll('.photo-bank-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      state.photos = state.photos.filter(p => p.id !== id);
      renderPhotoBank();
      updateCropStepButtons();
    });
  });
}

function renderQuantityControls() {
  const container = $('#qty-controls');
  if (state.photos.length === 0) {
    container.innerHTML = '<p style="color:#888;font-size:0.85rem;">No photos added yet.</p>';
    return;
  }

  container.innerHTML = state.photos.map(p => {
    const thumbURL = p.croppedCanvas.toDataURL('image/jpeg', 0.5);
    return `
      <div class="qty-row" data-id="${p.id}">
        <img src="${thumbURL}" alt="${p.label}" class="qty-thumb">
        <span class="qty-label">${p.label}</span>
        <div class="qty-spinner">
          <button class="qty-btn qty-minus" data-id="${p.id}">−</button>
          <span class="qty-value" data-id="${p.id}">${p.qty}</span>
          <button class="qty-btn qty-plus" data-id="${p.id}">+</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind quantity buttons
  container.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = state.photos.find(x => x.id === parseInt(e.target.dataset.id));
      if (p && p.qty > 0) { p.qty--; renderQuantityControls(); renderPrintPreview(); }
    });
  });
  container.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = state.photos.find(x => x.id === parseInt(e.target.dataset.id));
      if (p) { p.qty++; renderQuantityControls(); renderPrintPreview(); }
    });
  });
}

// ===== Event Binding =====
function bindEvents() {
  // File upload
  $('#file-input').addEventListener('change', handleFileSelect);

  const uploadArea = $('#upload-area');
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadFile(file);
  });

  // Standard selection
  $('#standard-grid').addEventListener('click', (e) => {
    const option = e.target.closest('.standard-option');
    if (!option) return;
    $$('.standard-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
    
    const newStd = STANDARDS.find(s => s.id === option.dataset.id);
    if (state.standard !== newStd) {
      state.standard = newStd;
      // Changing standard invalidates existing crops, because layout demands uniform sizing
      state.photos = []; 
      renderPhotoBank();
    }

    if (state.standard.isCustom) {
      $('#custom-size-inputs').style.display = 'flex';
      updateCustomSize();
    } else {
      $('#custom-size-inputs').style.display = 'none';
      if (state.cropper) initCropper();
    }
  });

  function updateCustomSize() {
    if (!state.standard.isCustom) return;
    state.standard.w = parseFloat($('#custom-w').value) || 35;
    state.standard.h = parseFloat($('#custom-h').value) || 45;
    state.photos = [];
    renderPhotoBank();
    if (state.cropper) initCropper();
  }

  $('#custom-w').addEventListener('change', updateCustomSize);
  $('#custom-h').addEventListener('change', updateCustomSize);

  // Navigation
  $('#nav-back-link').addEventListener('click', (e) => {
    if (state.currentImageURL || state.photos.length > 0) {
      if (!confirm('You will lose your current progress. Are you sure you want to leave?')) {
        e.preventDefault();
      }
    }
  });
  $('#nav-title-link').addEventListener('click', () => {
    if (state.currentImageURL || state.photos.length > 0) {
      if (confirm('You will lose your current progress. Are you sure you want to start over?')) {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  });

  $('#btn-to-crop').addEventListener('click', () => goToStep(2));
  $('#btn-back-upload').addEventListener('click', () => goToStep(1));
  $('#btn-add-photo').addEventListener('click', addCurrentCrop);
  $('#btn-add-another').addEventListener('click', resetForAnotherPhoto);
  $('#btn-to-print').addEventListener('click', goToPrint);
  $('#btn-back-crop').addEventListener('click', () => {
    goToStep(2);
    // Re-init cropper if we have a current image
    if (state.currentImageURL) initCropper();
  });

  $('#btn-cancel-add').addEventListener('click', () => {
    state.isAddingAnother = false;
    $('#cancel-add-container').style.display = 'none';
    $('#upload-title').textContent = 'Drop your photo here';
    goToStep(2);
  });

  window.addEventListener('popstate', (e) => {
    const step = e.state?.step || 1;
    goToStep(step, false);
  });

  // Paper selection
  $('#paper-select').addEventListener('change', () => {
    state.paper = PAPERS.find(p => p.id === $('#paper-select').value);
    if (state.photos.length === 1) state.photos[0].qty = calcGridSlots();
    renderPrintPreview();
  });

  // Orientation selection
  $('#orientation-select').addEventListener('change', (e) => {
    state.orientation = e.target.value;
    if (state.photos.length === 1) state.photos[0].qty = calcGridSlots();
    renderPrintPreview();
  });

  // Border preset selection
  $('#border-presets').addEventListener('click', (e) => {
    const option = e.target.closest('.border-option');
    if (!option) return;
    $$('.border-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
    state.borderPreset = BORDER_PRESETS.find(b => b.id === option.dataset.id);
    if (state.photos.length === 1) state.photos[0].qty = calcGridSlots();
    renderPrintPreview();
  });

  // Download
  $('#btn-download').addEventListener('click', downloadPrint);
}

// ===== File Handling =====
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadFile(file);
}

function loadFile(file) {
  if (state.isAddingAnother) {
    if (state.currentImageURL) URL.revokeObjectURL(state.currentImageURL);
    if (state.cropper) {
      state.cropper.destroy();
      state.cropper = null;
    }
    state.isAddingAnother = false;
    $('#cancel-add-container').style.display = 'none';
  } else {
    if (state.currentImageURL) URL.revokeObjectURL(state.currentImageURL);
  }

  state.currentFile = file;
  state.currentImageURL = URL.createObjectURL(file);

  const preview = $('#image-preview');
  const img = $('#preview-img');
  img.src = state.currentImageURL;
  preview.classList.add('visible');

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  $('#file-info').textContent = `${file.name} — ${sizeMB} MB`;

  const uploadArea = $('#upload-area');
  $('#upload-title').textContent = 'Photo loaded';
  $('#upload-subtitle').textContent = 'Drop another photo to replace';

  $('#btn-to-crop').disabled = false;
}

// ===== Step Navigation =====
function goToStep(n, pushHistory = true) {
  // Fail-safe routing fixes
  if (n === 2 && !state.currentImageURL) n = 1;
  if (n === 3 && state.photos.length === 0 && !state.currentImageURL) n = 1;

  if (state.cropper && n !== 2 && !state.isAddingAnother) {
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

  // History API
  if (pushHistory) {
    const url = new URL(window.location);
    url.searchParams.set('step', n);
    window.history.pushState({ step: n }, '', url);
  }

  // Lifecycle calls per step
  if (n === 1) {
    // If not adding another, and returning to step 1, setup for brand new
    if (!state.isAddingAnother) {
      $('#cancel-add-container').style.display = 'none';
      if (state.currentImageURL) $('#upload-title').textContent = 'Photo loaded';
      else $('#upload-title').textContent = 'Drop your photo here';
    }
  } else if (n === 2) {
    $('.photo-bank-section').style.display = 'block';
    $('#btn-add-photo').style.display = 'inline-flex';
    $('#btn-to-print').disabled = false;
    renderPhotoBank();
    updateCropStepButtons();
    if (state.currentImageURL && !state.cropper) {
       initCropper();
    }
  }
}

// function goToCrop has been safely moved into the generic goToStep lifecycle, but let's keep a placeholder if any buttons directly call it.

function initCropper() {
  const cropImage = $('#crop-image');
  cropImage.src = state.currentImageURL;
  
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
}

function addCurrentCrop() {
  if (!state.cropper) return;

  state.autoCropped = false;

  const { w, h } = state.standard;
  const pxW = Math.round(w / 25.4 * DPI);
  const pxH = Math.round(h / 25.4 * DPI);

  const croppedCanvas = state.cropper.getCroppedCanvas({
    width: pxW,
    height: pxH,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });

  const label = `Person ${state.nextPhotoId}`;
  state.photos.push({
    id: state.nextPhotoId++,
    label,
    croppedCanvas,
    imageURL: state.currentImageURL,
    qty: 1,
  });

  renderPhotoBank();
  updateCropStepButtons();

  // Show confirmation flash
  const addBtn = $('#btn-add-photo');
  addBtn.textContent = 'Added!';
  addBtn.disabled = true;
  setTimeout(() => {
    addBtn.textContent = 'Add to Print';
    addBtn.disabled = false;
  }, 800);
}

function resetForAnotherPhoto() {
  state.isAddingAnother = true;
  goToStep(1);

  $('#upload-title').textContent = 'Upload next person\'s photo';
  $('#upload-subtitle').textContent = 'Drop or click to browse for the next batch';
  $('#image-preview').classList.remove('visible');
  $('#file-input').value = '';
  $('#btn-to-crop').disabled = true;
  $('#cancel-add-container').style.display = 'block';
}

function updateCropStepButtons() {
  const hasPhotos = state.photos.length > 0;
  $('#btn-to-print').disabled = false;
  $('#btn-add-another').style.display = hasPhotos ? 'inline-flex' : 'none';
}

// ===== Step 3: Print Layout =====
function goToPrint() {
  // Always update auto-crop on 'Continue to Print' in case they tweaked cropper
  if (state.cropper && (state.photos.length === 0 || state.autoCropped)) {
    const { w, h } = state.standard;
    const pxW = Math.round(w / 25.4 * DPI);
    const pxH = Math.round(h / 25.4 * DPI);

    const croppedCanvas = state.cropper.getCroppedCanvas({
      width: pxW,
      height: pxH,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    state.photos = [{
      id: 1,
      label: 'Photo',
      croppedCanvas,
      imageURL: state.currentImageURL,
      qty: 0
    }];
    state.autoCropped = true;
  }

  // Set default quantities: if all are 0, set them to fill the paper
  const totalQty = state.photos.reduce((s, p) => s + p.qty, 0);
  if (totalQty === 0 || state.photos.length === 1) {
    // Auto-fill: distribute evenly
    const slots = calcGridSlots();
    const perPhoto = Math.max(1, Math.floor(slots / state.photos.length));
    state.photos.forEach(p => p.qty = perPhoto);
  }

  goToStep(3);
  
  if (state.photos.length === 1) {
    $('.qty-section').style.display = 'none';
  } else {
    $('.qty-section').style.display = 'block';
    renderQuantityControls();
  }
  
  renderPrintPreview();
}

function getPaperDimensions() {
  const paper = state.paper;
  if (state.orientation === 'landscape') {
    return { w: Math.max(paper.w, paper.h), h: Math.min(paper.w, paper.h), name: paper.name, id: paper.id };
  }
  return { w: Math.min(paper.w, paper.h), h: Math.max(paper.w, paper.h), name: paper.name, id: paper.id };
}

function calcGridSlots() {
  const paper = getPaperDimensions();
  const std = state.standard;
  const preset = state.borderPreset;
  const gutterMm = preset.gutterMm;

  if (gutterMm === 0) {
    const cols = Math.floor(paper.w / std.w);
    const rows = Math.floor(paper.h / std.h);
    return cols * rows;
  } else {
    const cols = Math.floor((paper.w + gutterMm) / (std.w + gutterMm));
    const rows = Math.floor((paper.h + gutterMm) / (std.h + gutterMm));
    return cols * rows;
  }
}

function renderPrintPreview() {
  const paper = getPaperDimensions();
  const std = state.standard;
  const preset = state.borderPreset;
  const gutterPx = Math.round(preset.gutterMm / 25.4 * DPI);

  // Paper dimensions in pixels at 300 DPI
  const paperPxW = Math.round(paper.w / 25.4 * DPI);
  const paperPxH = Math.round(paper.h / 25.4 * DPI);

  // Photo dimensions in pixels
  const photoPxW = Math.round(std.w / 25.4 * DPI);
  const photoPxH = Math.round(std.h / 25.4 * DPI);

  // Calculate grid
  let cols, rows;
  if (gutterPx === 0) {
    cols = Math.floor(paperPxW / photoPxW);
    rows = Math.floor(paperPxH / photoPxH);
  } else {
    cols = Math.floor((paperPxW + gutterPx) / (photoPxW + gutterPx));
    rows = Math.floor((paperPxH + gutterPx) / (photoPxH + gutterPx));
  }

  const maxSlots = cols * rows;

  // Build flat photo list from quantities
  const photoList = [];
  for (const p of state.photos) {
    for (let i = 0; i < p.qty; i++) {
      photoList.push(p);
    }
  }
  const totalPhotos = Math.min(photoList.length, maxSlots);

  // Calculate offsets based on alignment
  let offsetX, offsetY;
  if (preset.align === 'corner') {
    offsetX = 0;
    offsetY = 0;
  } else {
    // Center
    const gridW = cols * photoPxW + (cols - 1) * gutterPx;
    const gridH = rows * photoPxH + (rows - 1) * gutterPx;
    offsetX = Math.round((paperPxW - gridW) / 2);
    offsetY = Math.round((paperPxH - gridH) / 2);
  }

  // Draw on canvas
  const canvas = $('#print-canvas');
  canvas.width = paperPxW;
  canvas.height = paperPxH;
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, paperPxW, paperPxH);

  // Draw photos
  let photoIdx = 0;
  for (let r = 0; r < rows && photoIdx < totalPhotos; r++) {
    for (let c = 0; c < cols && photoIdx < totalPhotos; c++) {
      const x = offsetX + c * (photoPxW + gutterPx);
      const y = offsetY + r * (photoPxH + gutterPx);
      ctx.drawImage(photoList[photoIdx].croppedCanvas, x, y, photoPxW, photoPxH);
      photoIdx++;
    }
  }

  // Draw cutting guides
  if (preset.id === 'dotted' || gutterPx > 0) {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);

    const lineExtend = gutterPx > 0 ? gutterPx / 2 : 0;
    const drawGridW = cols * photoPxW + (cols > 0 ? (cols - 1) * gutterPx : 0);
    const drawGridH = rows * photoPxH + (rows > 0 ? (rows - 1) * gutterPx : 0);

    // Vertical cut lines
    for (let c = 0; c <= cols; c++) {
      const x = offsetX + c * (photoPxW + gutterPx) - lineExtend;
      // Do not stroke dashed line exactly on the physical edge
      if (Math.abs(x) < 2 || Math.abs(x - paperPxW) < 2) continue;

      ctx.beginPath();
      ctx.moveTo(x, offsetY - lineExtend);
      ctx.lineTo(x, offsetY + drawGridH + lineExtend);
      ctx.stroke();
    }

    // Horizontal cut lines
    for (let r = 0; r <= rows; r++) {
      const y = offsetY + r * (photoPxH + gutterPx) - lineExtend;
      // Do not stroke dashed line exactly on the physical edge
      if (Math.abs(y) < 2 || Math.abs(y - paperPxH) < 2) continue;

      ctx.beginPath();
      ctx.moveTo(offsetX - lineExtend, y);
      ctx.lineTo(offsetX + drawGridW + lineExtend, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // Corner crop marks for compact mode
  if (preset.id === 'compact') {
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const markLen = Math.round(3 / 25.4 * DPI); // 3mm marks

    const gridW = cols * photoPxW;
    const gridH = rows * photoPxH;

    // Outer edge boundary marks pointing outward from the grid bounds
    for (let r = 0; r <= rows; r++) {
      const y = offsetY + r * photoPxH;
      // Left side tick
      ctx.beginPath(); ctx.moveTo(offsetX - markLen, y); ctx.lineTo(offsetX, y); ctx.stroke();
      // Right side tick
      ctx.beginPath(); ctx.moveTo(offsetX + gridW, y); ctx.lineTo(offsetX + gridW + markLen, y); ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      const x = offsetX + c * photoPxW;
      // Top side tick
      ctx.beginPath(); ctx.moveTo(x, offsetY - markLen); ctx.lineTo(x, offsetY); ctx.stroke();
      // Bottom side tick
      ctx.beginPath(); ctx.moveTo(x, offsetY + gridH); ctx.lineTo(x, offsetY + gridH + markLen); ctx.stroke();
    }

    // Internal intersection crosses
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const x = offsetX + c * photoPxW;
        const y = offsetY + r * photoPxH;
        ctx.beginPath();
        ctx.moveTo(x - markLen, y);
        ctx.lineTo(x + markLen, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - markLen);
        ctx.lineTo(x, y + markLen);
        ctx.stroke();
      }
    }
  }

  // Info text
  const slotsUsed = totalPhotos;
  const slotsAvailable = maxSlots;
  const personSummary = state.photos.filter(p => p.qty > 0).map(p => `${p.qty}× ${p.label}`).join(', ');
  const warnText = photoList.length > maxSlots ? ` (${photoList.length - maxSlots} won't fit)` : '';

  $('#layout-info').textContent =
    `${slotsUsed} / ${slotsAvailable} slots (${cols}×${rows}) on ${paper.name} at 300 DPI` +
    (personSummary ? ` — ${personSummary}` : '') +
    warnText;

  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
}

// ===== Download =====
function downloadPrint() {
  const format = $('#format-select').value;
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.95;
  const ext = format === 'png' ? 'png' : 'jpg';

  $('#print-canvas').toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passport-photo-${state.standard.id}-${getPaperDimensions().id}-${state.orientation}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, mimeType, quality);
}

// ===== Start =====
init();
