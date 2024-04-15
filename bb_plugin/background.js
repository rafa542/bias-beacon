// Background script

// This should receive the background text from content-script, generate indices for all words, and send it to model to process. JSON: {index, word, context_sentence}

// NOTE:
// This script runs in the background and communicates with the server to fetch bias data.
// ../model/llm_bias_detection.py has analyze_paragraph(). It takes a sentence and will return the bias for each word.
// The models are located in ../model.
// The server is located in ../server.The endpoints will need to be expanded accordingly.

console.log("Background.js loaded.");

let urlCache = {};

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "checkCache") {
    console.log("Received checkCache action for URL:", request.url);

    // Send request to localhost to check if the URL is in the cache
    fetch(
      `http://localhost:8000/api/cache?url=${encodeURIComponent(request.url)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.isCached) {
          console.log("URL is cached:", request.url);
          sendResponse({ isCached: true });
        } else {
          console.log("URL is not cached:", request.url);
          sendResponse({ isCached: false });
        }
      })
      .catch((error) => {
        console.error("Error checking cache:", error);
        sendResponse({ isCached: false, error: "Failed to check cache" });
      });

    return true;
  } else if (request.action === "analyzeContentBias") {
    console.log("Analyzing content bias for indexed H1 words.");

    const promises = request.data.map((item, index) =>
      // fetch(`https://biasbeacon.replit.app/api/contentbias`, {
      fetch(`https://localhost:8000`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence: item.sentence }),
      })
        .then((response) => response.json())
        .then((data) => ({ index, data }))
        .catch((error) => ({ index, error: error.toString() }))
    );

    Promise.all(promises).then((results) => {
      sendResponse({ results });
    });

    return true; // keep the messaging channel open for the asynchronous response
  }
});
