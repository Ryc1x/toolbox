const numInput = document.getElementById('num-uuids');
const btnGenerate = document.getElementById('btn-generate');
const outputArea = document.getElementById('uuid-output');
const btnCopy = document.getElementById('btn-copy');

function generateUUIDv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function handleGenerate() {
  let count = parseInt(numInput.value, 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 500) count = 500; // soft limit

  const uuids = [];
  for (let i = 0; i < count; i++) {
    uuids.push(generateUUIDv4());
  }

  outputArea.value = uuids.join('\n');
}

btnGenerate.addEventListener('click', handleGenerate);

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

// Auto-generate 1 on load
handleGenerate();
