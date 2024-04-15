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
  // Handle "analyzeContentBias" action
  if (request.action === "analyzeContentBias") {
    console.log("Analyzing content bias for sentences.");

    // First, check if the URL is in the cache
    fetch(`http://localhost:8000/api/cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: request.data.url }),
    })
      .then((response) => response.json())
      .then((cacheData) => {
        if (cacheData.isCached) {
          console.log("URL is cached:", request.data.url);
          // If data is cached, immediately return the cached results
          sendResponse({ results: cacheData.content });
        } else {
          console.log("URL is not cached:", request.data.url);
          // If data is not cached, analyze content bias for each sentence
          const promises = request.data.sentences.map((item) =>
            fetch(`http://localhost:8000/api/contentbias`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: request.data.url,
                sentence_id: item.sentenceIndex,
                sentence: item.sentence,
              }),
            })
              .then((response) => response.json())
              .then((data) => ({ index: item.sentenceIndex, data }))
              .catch((error) => ({
                index: item.sentenceIndex,
                error: error.toString(),
              }))
          );

          // Wait for all content bias analyses to complete
          Promise.all(promises).then((results) => {
            sendResponse({ results });
          });
        }
      })
      .catch((error) => {
        console.error("Error checking cache or analyzing content bias:", error);
        sendResponse({
          isCached: false,
          error: "Failed to check cache or analyze content bias",
        });
      });

    return true; // keep the messaging channel open for the asynchronous response
  }
});
