// Background script

// NOTE: We should have the model on a server with an API. Can build an API with FastAPI, very quick.

console.log("Background script loaded");

// This script runs in the background and communicates with the server to fetch bias data.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchBiasData") {
    console.log("Received message for bias data fetch");

    // Example fetch request to your server
    const fetchData = async () => {
      try {
        // URL of the deployed API
        const apiUrl = "https://yourmodelapi.com/api/bias";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: request.content }),
        });
        if (!response.ok) throw new Error("Network response was not ok.");
        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        console.error("Fetch error:", error);
        sendResponse({ success: false, error: error.message });
      }
    };

    fetchData();

    // Must return true when using sendResponse asynchronously
    return true;
  }
});
