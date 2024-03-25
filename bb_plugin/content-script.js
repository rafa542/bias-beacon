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
      // Check if the response object exists to handle potential messaging errors
      if (response && response.isCached) {
        console.log("URL content is cached. Using cached data.");
      } else if (response && response.error) {
        console.error("Error checking cache:", response.error);
      } else {
        console.log(
          "URL content not in cache or error occurred. Extracting content."
        );
        extractCleanContentAndSend();
      }
    }
  );
}

// SCRAPE WEBSITE CONTENT WORDS, CLEAN IT, INDEX WORDS (BACKGROUND.JS CAN ACCESS THIS)

function extractAndIndexContentAndFindH1() {
  let textContent = "";
  let nodeIndex = []; // Store {node, startOffset, endOffset} for each text node
  let h1Content = []; // To store content of all <h1> tags

  function traverseNodes(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Check if the node is an <h1> element
      if (node.tagName === "H1") {
        h1Content.push(node.innerText.trim());
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue.trim();
      const length = text.length;
      if (length > 0) {
        // Add node and its text to the index
        nodeIndex.push({
          node,
          startOffset: textContent.length,
          endOffset: textContent.length + length,
        });
        textContent += text + " "; // Append text with a space
      }
    }

    // Recursively process child nodes
    node.childNodes.forEach(traverseNodes);
  }

  traverseNodes(document.body);

  return { textContent, nodeIndex, h1Content };
}

let { textContent, nodeIndex, h1Content } = extractAndIndexContentAndFindH1();

// Log the content of all <h1> tags
console.log("H1 Content:", h1Content.join(", "));

// View textContent and nodeIndex in console
console.log(
  "First 500 characters of extracted content:",
  textContent.slice(0, 500)
);
console.log(
  "Details of first few indexed nodes:",
  JSON.stringify(nodeIndex.slice(0, 5), null, 2)
);

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
