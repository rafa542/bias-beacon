// COntent script

// This script will be injected into the webpage to highlight biased words.

console.log("content-script.js loaded.");

/*

##################
SECTION:
- EXTRACT URL
- SEND TO URL BACKGROUND.JS TO CHECK IF IT EXISTS IN CACHE
- SCRAPE WEBSITE CONTENT WORDS, CLEAN IT, INDEX WORDS (BACKGROUND.JS CAN ACCESS THIS)
- RECEIVE RESULTS FROM BACKGROUND.JS ASYNCHRONOUSLY
- INDEXED WORDS ARE MATCHED, <SPAN> TAGS ARE APPLIED TO THE INDEXED WORD AND THE BACKGROUND IS HIGHLIGHTED IN YELLOW
##################

*/

// SEND TO URL BACKGROUND.JS TO CHECK IF IT EXISTS IN CACHE

function checkCacheAndSendURL() {
  const currentURL = window.location.href;
  console.log("Sending URL to background.js to check cache", currentURL);

  chrome.runtime.sendMessage(
    {
      action: "checkCache",
      url: currentURL,
    },
    function (response) {
      if (response.isCached) {
        console.log("URL content is cached. Using cached data.");
        // Optionally, process cached data
      } else {
        console.log("URL content not in cache. Extracting content.");
        extractCleanContentAndSend();
      }
    }
  );
}

// SCRAPE WEBSITE CONTENT WORDS, CLEAN IT, INDEX WORDS (BACKGROUND.JS CAN ACCESS THIS)

function extractContent() {
  // Extract the entire document text content
  return document.body.textContent;
}

// Query for the active tab and execute content extraction logic
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];

  // Execute content extraction logic on the active tab
  chrome.scripting.executeScript(
    {
      target: { tabId: activeTab.id },
      func: extractContent,
    },
    (results) => {
      // Handle execution results here
      if (chrome.runtime.lastError) {
        console.error(
          "Error executing content script:",
          chrome.runtime.lastError.message
        );
      } else {
        const pageContent = results[0].result;
        console.log("Got page content.");

        // Send the extracted content to the background script for further processing
        chrome.runtime.sendMessage(
          {
            action: "fetchPageContent",
            content: pageContent,
          },
          (response) => {
            if (response.status === "Process completed!") {
              console.log(
                "Data processed successfully by the model:",
                response
              );
              // Update the DOM based on the received data if necessary
            } else {
              console.error("Error processing data:", response.error);
              // Error handling; user error messages
            }
          }
        );
      }
    }
  );
});

/*

##################
SECTION:
- HIGHLIGHT BIAS WORDS
- CREATE A TOOLTIP 
- SHOW TOOLTIP ON HOVER
##################

*/

// const highlightBiasWords = (biasData) => {
//   // Iterate over each word data received from the server and highlight them
//   Object.values(biasData).forEach(
//     ({ index_in_text, word, bias_score, bias_reason }) => {
//       if (bias_score > 0.8) {
//         // Find the word in the content and wrap it with a span tag

//         const regex = new RegExp(`\\b${word}\\b`, "gi");
//         document.body.innerHTML = document.body.innerHTML.replace(
//           regex,
//           (match) => {
//             return `<span class="bias-highlighted" data-bias-score="${bias_score}" data-bias-reason="${bias_reason}">${match}</span>`;
//           }
//         );
//       }
//     }
//   );
// };

// // Listen for messages from the background script
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "highlightBiasWords") {
//     highlightBiasWords(request.data);
//   }
// });

// // Add event listeners for tooltips
// document.addEventListener("mouseover", (event) => {
//   if (event.target.classList.contains("bias-highlighted")) {
//     const tooltip = document.createElement("div");
//     tooltip.className = "bias-tooltip";
//     tooltip.innerHTML = `<strong>${event.target.innerText}</strong><br>Score: ${event.target.dataset.biasScore}<br>Reason: ${event.target.dataset.biasReason}`;
//     document.body.appendChild(tooltip);
//     tooltip.style.left = `${event.pageX}px`;
//     tooltip.style.top = `${event.pageY}px`;
//   }
// });

// document.addEventListener("mouseout", (event) => {
//   if (event.target.classList.contains("bias-highlighted")) {
//     const tooltips = document.getElementsByClassName("bias-tooltip");
//     while (tooltips.length > 0) {
//       tooltips[0].parentNode.removeChild(tooltips[0]);
//     }
//   }
// });
