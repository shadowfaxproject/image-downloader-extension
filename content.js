let hoveredImg = null;
let btn = null;

function getFilename(url) {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop();
    return name && name.includes('.') ? name : 'image.jpg';
  } catch {
    return 'image.jpg';
  }
}

function downloadImage(url) {
  chrome.runtime.sendMessage({ action: 'download', url, filename: getFilename(url) });
}

function createBtn() {
  const el = document.createElement('div');
  el.id = 'img-dl-btn';
  el.title = 'Download image (Alt+D)';
  el.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
  </svg>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (hoveredImg) downloadImage(hoveredImg.src || hoveredImg.currentSrc);
  });
  document.body.appendChild(el);
  return el;
}

function showBtn(img, e) {
  if (!btn) btn = createBtn();
  const pad = 8;
  btn.style.left = (e.clientX - 44) + 'px';
  btn.style.top  = (e.clientY - 44) + 'px';
  btn.style.display = 'flex';
}

function hideBtn() {
  if (btn) btn.style.display = 'none';
}

document.addEventListener('mouseover', (e) => {
  const img = e.target.closest('img, [style*="background-image"]');
  if (img && img.tagName === 'IMG' && img.src) {
    hoveredImg = img;
    showBtn(img, e);
  }
}, true);

document.addEventListener('mousemove', (e) => {
  if (!hoveredImg) return;
  if (btn && btn.style.display === 'flex') {
    btn.style.left = (e.clientX - 44) + 'px';
    btn.style.top  = (e.clientY - 44) + 'px';
  }
});

document.addEventListener('mouseout', (e) => {
  const to = e.relatedTarget;
  if (!to || (to !== btn && !to.closest('#img-dl-btn'))) {
    if (e.target === hoveredImg) {
      setTimeout(() => {
        if (!btn || btn.matches(':hover')) return;
        hoveredImg = null;
        hideBtn();
      }, 200);
    }
  }
}, true);

// Keyboard shortcut listener (Alt+D)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'keyboard-download' && hoveredImg) {
    downloadImage(hoveredImg.src || hoveredImg.currentSrc);
  }
});
