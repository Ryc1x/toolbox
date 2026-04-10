const inputArea = document.getElementById('json-input');
const outputArea = document.getElementById('json-output');
const errorMsg = document.getElementById('error-message');
const indentSelect = document.getElementById('indent-select');

const btnFormat = document.getElementById('btn-format');
const btnMinify = document.getElementById('btn-minify');
const btnPaste = document.getElementById('btn-paste');
const btnClear = document.getElementById('btn-clear');
const btnCopy = document.getElementById('btn-copy');

function getIndent() {
  const val = indentSelect.value;
  if (val === 'tab') return '\t';
  return parseInt(val, 10);
}

function processJSON(minify = false) {
  const raw = inputArea.value.trim();
  if (!raw) {
    outputArea.value = '';
    errorMsg.style.display = 'none';
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (minify) {
      outputArea.value = JSON.stringify(parsed);
    } else {
      outputArea.value = JSON.stringify(parsed, null, getIndent());
    }
    errorMsg.style.display = 'none';
    outputArea.style.color = '#1a1a1a';
  } catch (err) {
    outputArea.value = '';
    errorMsg.textContent = 'Invalid JSON: ' + err.message;
    errorMsg.style.display = 'block';
  }
}

btnFormat.addEventListener('click', () => processJSON(false));
btnMinify.addEventListener('click', () => processJSON(true));

btnClear.addEventListener('click', () => {
  inputArea.value = '';
  outputArea.value = '';
  errorMsg.style.display = 'none';
});

btnPaste.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    inputArea.value = text;
    processJSON(false);
  } catch (err) {
    alert('Failed to read clipboard text.');
  }
});

btnCopy.addEventListener('click', async () => {
  const text = outputArea.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const originalText = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(() => { btnCopy.textContent = originalText; }, 1500);
  } catch (err) {
    alert('Failed to copy to clipboard.');
  }
});
