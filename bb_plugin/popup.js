// This script controls the popup interface for the plugin.

document.addEventListener("DOMContentLoaded", function () {
  //This event page waits for content to loads. Then it pulls in the current URL of the page and sends it to the popup.html to display. It also populates the app version from the manifest.json file.

  // Query the active tab, which will be your current window
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // tabs[0] is the active tab of the current window
    let currentTab = tabs[0];

    // Create a URL object from the tab's URL
    let tabUrl = new URL(currentTab.url);

    // Extract the domain from the URL object
    let domain = tabUrl.hostname;

    // Set the text content of the outlet URL span to the domain of the tab's URL
    document.getElementById("outlet-url").textContent = domain;
  });

  // Fetch and display the extension version from manifest.json
  const manifestData = chrome.runtime.getManifest();
  const appVersion = manifestData.version;
  document.getElementById(
    "app-version"
  ).textContent = `App version: ${appVersion}`;
});
