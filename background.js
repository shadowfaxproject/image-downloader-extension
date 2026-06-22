chrome.commands.onCommand.addListener((command) => {
  if (command === 'download-image') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'keyboard-download' }, () => {
        if (chrome.runtime.lastError) {
          // Content script not yet injected — inject it now and retry
          chrome.scripting.executeScript(
            { target: { tabId: tabs[0].id }, files: ['content.js'] },
            () => {
              chrome.tabs.insertCSS?.(tabs[0].id, { file: 'content.css' });
              chrome.tabs.sendMessage(tabs[0].id, { action: 'keyboard-download' });
            }
          );
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'download' && msg.url) {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename,
      saveAs: false
    });
  }
});
