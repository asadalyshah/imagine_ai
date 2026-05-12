// ===== STATE =====
let selectedStyle = '';
let selectedW = 512;
let selectedH = 512;
let selectedModel = 'flux';
let gallery = [];

// ===== RANDOM PROMPTS =====
const randomPrompts = [
  "a majestic snow leopard on Himalayan peaks, golden hour, cinematic",
  "ancient Mughal palace at sunset, reflections in water, hyperrealistic",
  "a futuristic Karachi skyline at night, neon lights, cyberpunk",
  "a Sufi dervish spinning in desert, long exposure, mystical light",
  "a giant robot walking through a pine forest, foggy morning",
  "a cozy tea house in the mountains of Swat, warm lighting",
  "an octopus playing chess in the ocean, surreal art",
  "a dragon made of storm clouds above ancient ruins",
  "an astronaut discovering flowers on Mars, digital art",
  "a lone wolf in a neon-lit rainy street, synthwave",
  "a magical library inside a giant tree, fantasy art",
  "a samurai standing in a cherry blossom storm, ink painting"
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('promptInput');
  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    document.getElementById('charCount').textContent = `${len} / 500`;
    if (len > 500) textarea.value = textarea.value.substring(0, 500);
  });

  // Style tags
  document.getElementById('styleGrid').querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.getElementById('styleGrid').querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      selectedStyle = tag.dataset.val;
    });
  });

  // Size tags
  document.querySelectorAll('[data-w]').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('[data-w]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      selectedW = parseInt(tag.dataset.w);
      selectedH = parseInt(tag.dataset.h);
    });
  });

  // Model tags
  document.querySelectorAll('[data-model]').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('[data-model]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      selectedModel = tag.dataset.model;
    });
  });

  // Enter key to generate
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) generate();
  });
});

// ===== RANDOM PROMPT =====
function randomPrompt() {
  const r = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
  const ta = document.getElementById('promptInput');
  ta.value = r;
  ta.dispatchEvent(new Event('input'));
}

// ===== USE SUGGESTION =====
function useSug(el) {
  const ta = document.getElementById('promptInput');
  ta.value = el.textContent;
  ta.dispatchEvent(new Event('input'));
  ta.focus();
}

// ===== GENERATE =====
async function generate() {
  const prompt = document.getElementById('promptInput').value.trim();
  if (!prompt) {
    document.getElementById('promptInput').focus();
    document.getElementById('promptInput').style.borderColor = '#ff6b6b';
    setTimeout(() => document.getElementById('promptInput').style.borderColor = '', 1500);
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.classList.add('loading');

  showLoading();

  const fullPrompt = selectedStyle ? `${prompt}, ${selectedStyle}` : prompt;
  const seed = Math.floor(Math.random() * 999999);

  const url = buildUrl(fullPrompt, seed);

  const messages = [
    'Generating your masterpiece...',
    'Mixing colors and shapes...',
    'Painting pixels with AI...',
    'Almost there, adding details...'
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % messages.length;
    const el = document.getElementById('loadingMsg');
    if (el) el.textContent = messages[msgIdx];
  }, 3000);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
      setTimeout(reject, 60000); // 60s timeout
    });

    clearInterval(msgInterval);
    showResult(url, fullPrompt, seed);
    addToGallery(url, prompt);

  } catch (err) {
    clearInterval(msgInterval);
    showError('Image generate nahi hui. Network check karein ya dobara try karein.');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

// ===== BUILD URL =====
function buildUrl(prompt, seed) {
  const modelMap = {
    'flux': 'flux',
    'flux-realism': 'flux-realism',
    'turbo': 'turbo'
  };
  const model = modelMap[selectedModel] || 'flux';
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=${selectedW}&height=${selectedH}&seed=${seed}&nologo=true&enhance=true`;
}

// ===== UI STATES =====
function showLoading() {
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('resultState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('loadingMsg').textContent = 'Generating your masterpiece...';
}

function showResult(url, prompt, seed) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';

  const imgEl = document.getElementById('resultImg');
  imgEl.src = url;

  const dlBtn = document.getElementById('downloadBtn');
  dlBtn.href = url;
  dlBtn.download = `imagine-ai-${seed}.jpg`;

  document.getElementById('resultPromptText').textContent = prompt.substring(0, 60) + (prompt.length > 60 ? '...' : '');
  document.getElementById('resultSeed').textContent = `Seed: ${seed}`;

  document.getElementById('resultState').style.display = 'block';
  document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(msg) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('resultState').style.display = 'none';
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorState').style.display = 'block';
}

// ===== GALLERY =====
function addToGallery(url, prompt) {
  gallery.unshift({ url, prompt });
  if (gallery.length > 12) gallery.pop();
  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (gallery.length === 0) {
    grid.innerHTML = '<p class="gallery-empty">Generate karne ke baad images yahan save hongi</p>';
    return;
  }
  grid.innerHTML = gallery.map(item => `
    <div class="gallery-item" onclick="viewGalleryItem('${item.url}')">
      <img src="${item.url}" alt="Generated image" loading="lazy" />
      <div class="gallery-overlay"><p>${item.prompt}</p></div>
    </div>
  `).join('');
}

function viewGalleryItem(url) {
  window.open(url, '_blank');
}
