// COntent script

// This script will be injected into the webpage to highlight biased words.

console.log("content-script.js loaded.");

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
