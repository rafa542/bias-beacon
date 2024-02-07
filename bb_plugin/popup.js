// This script controls the popup interface for the plugin.
document.getElementById('checkBias').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { action: "fetchBiasData", content: document.body.innerText });
  });
});