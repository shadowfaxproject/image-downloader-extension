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
  try {
    chrome.runtime.sendMessage({ action: 'download', url, filename: getFilename(url) });
  } catch (e) {
    // Extension context invalidated — fall back to direct download via anchor
    const a = document.createElement('a');
    a.href = url;
    a.download = getFilename(url);
    a.click();
  }
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

function positionBtn(img) {
  const rect = img.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  btn.style.left = (rect.left + scrollX + 8) + 'px';
  btn.style.top  = (rect.top  + scrollY + 8) + 'px';
  btn.style.display = 'flex';
}

function showBtn(img) {
  if (!btn) btn = createBtn();
  hoveredImg = img;
  positionBtn(img);
}

function hideBtn() {
  hoveredImg = null;
  if (btn) btn.style.display = 'none';
}

document.addEventListener('mouseover', (e) => {
  const img = e.target.closest('img');
  if (img && img.src) {
    showBtn(img);
  }
}, true);

document.addEventListener('mouseout', (e) => {
  const to = e.relatedTarget;
  if (to && to.closest('#img-dl-btn')) return;
  if (e.target === hoveredImg) {
    setTimeout(() => {
      if (btn && btn.matches(':hover')) return;
      hideBtn();
    }, 150);
  }
}, true);

// Reposition on scroll/resize
window.addEventListener('scroll', () => { if (hoveredImg) positionBtn(hoveredImg); }, true);
window.addEventListener('resize', () => { if (hoveredImg) positionBtn(hoveredImg); });

// Keyboard shortcut
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'keyboard-download' && hoveredImg) {
    downloadImage(hoveredImg.src || hoveredImg.currentSrc);
  }
});

// Reset state on any navigation (back/forward keys, SPA route changes)
function resetState() {
  hideBtn();
  if (btn) { btn.remove(); btn = null; }
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    resetState();
  }
}).observe(document, { subtree: true, childList: true });

window.addEventListener('popstate', resetState);
window.addEventListener('pageshow', resetState);
