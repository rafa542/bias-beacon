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

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "fetchPageContent") {
//     console.log("Background: Request to fetch page content received.");

//     // Acquire the current tab and fetch its content
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: tabs[0].id },
//           func: scrapePageText,
//         },
//         (results) => {
//           // Getting the content from the scrapePageText function, check data, error handling for disallowed resources
//           if (results[0]) {
//             const allSentences = results[0].result;
//             console.log(
//               `Content scraped successfully. Found ${allSentences.length} sentences to analyze.`
//             );
//             processAndSendToServer(allSentences, sendResponse);
//           } else {
//             console.error(
//               "Failed to scrape the data from the tab. Please check permissions."
//             );
//           }
//         }
//       );
//     });
//     return true; // Keep the message port active for asynchronous loading
//   }
// });

// // The scraping function
// function scrapePageText() {
//   // Print to test
//   console.log("scrapePageText() invoked.");

//   const page_text = document.body.innerText.split(/\.\s/);

//   return page_text;
// }

// // Method to parse and process the particularities of a section before passing the remainder of the world
// async function processAndSendToServer(allSentences, sendResponse) {
//   for (let i = 0; i < allSentences.length; i++) {
//     const sentence = allSentences[i];

//     try {
//       // Sending to localhost server
//       const response = await fetch("http://127.0.0.1:8000/api/contentbias", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ text: sentence }),
//       });

//       const data = await response.json();
//       if (data.bias) {
//         console.log(`Analysis complete for sentence: ${sentence}.`);
//         chrome.runtime.sendMessage({
//           action: "updateBias",
//           sentenceIndex: i,
//           data: data.bias,
//         });
//       }
//     } catch (error) {
//       console.error(
//         "An error occurred when posting sentence to the server:",
//         sentence,
//         error
//       );
//     }
//   }
//   console.log("Completed analyzing the text content.");
//   sendResponse({ status: "Process completed!" });
// }
