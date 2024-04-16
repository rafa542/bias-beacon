// Background script

// This should receive the background text from content-script, generate indices for all words, and send it to model to process. JSON: {index, word, context_sentence}

// NOTE:
// This script runs in the background and communicates with the server to fetch bias data.
// ../model/llm_bias_detection.py has analyze_paragraph(). It takes a sentence and will return the bias for each word.
// The models are located in ../model.
// The server is located in ../server.The endpoints will need to be expanded accordingly.

console.log("Background.js loaded.");

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "analyzeContentBias") {
    console.log("Analyzing content bias for sentences.");

    fetch(`http://localhost:8000/api/cache`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: request.data.url }),
    })
      .then((response) => response.json())
      .then((cacheData) => {
        if (cacheData.isCached) {
          console.log("URL is cached:", request.data.url);
          // Simulate sending each cached result back to the content script
          cacheData.content.forEach((cachedResult) => {
            if (sender.tab?.id) {
              chrome.tabs.sendMessage(sender.tab.id, {
                action: "contentBiasResult",
                result: cachedResult,
              });
            }
          });
        } else {
          console.log("URL is not cached:", request.data.url);
          request.data.sentences.forEach((item) => {
            fetch(`http://localhost:8000/api/contentbias`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: request.data.url,
                sentence_id: item.sentenceIndex,
                sentence: item.sentence,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                if (sender.tab?.id) {
                  chrome.tabs.sendMessage(sender.tab.id, {
                    action: "contentBiasResult",
                    result: { sentenceIndex: item.sentenceIndex, data },
                  });
                }
              })
              .catch((error) => {
                if (sender.tab?.id) {
                  chrome.tabs.sendMessage(sender.tab.id, {
                    action: "contentBiasError",
                    error: error.toString(),
                    index: item.sentenceIndex,
                  });
                }
              });
          });
        }
      })
      .catch((error) => {
        console.error("Error checking cache or analyzing content bias:", error);
        // General error handling, might indicate issues with the cache checking request
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "contentBiasError",
            error: "Failed to check cache or start content bias analysis",
          });
        }
      });

    return true; // Keep the messaging channel open for asynchronous response
  }
});
