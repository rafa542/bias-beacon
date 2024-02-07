// COntent script

// This script will be injected into the webpage to extract content and highlight biased words.

function extractContent() {
  // Placeholder for content extraction logic
  // For example, document.body.textContent for simple text extraction (not recommended for production)

  return document.body.textContent;
}

// Send a message to the background script
chrome.runtime.sendMessage(
  {
    action: "fetchBiasData",
    content: extractContent(), // Sending page for content analysis
  },
  (response) => {
    if (response.success) {
      console.log("Data from API:", response.data);
      // Update the DOM based on the received data
      // Highlight biased words
    } else {
      console.error("Error fetching data:", response.error);
      // Error handling; user error messages
    }
  }
);

const highlightBiasWords = (biasData) => {
  // Iterate over each word data received from the server and highlight them
  Object.values(biasData).forEach(
    ({ index_in_text, word, bias_score, bias_reason }) => {
      if (bias_score > 0.8) {
        // Find the word in the content and wrap it with a span tag

        const regex = new RegExp(`\\b${word}\\b`, "gi");
        document.body.innerHTML = document.body.innerHTML.replace(
          regex,
          (match) => {
            return `<span class="bias-highlighted" data-bias-score="${bias_score}" data-bias-reason="${bias_reason}">${match}</span>`;
          }
        );
      }
    }
  );
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "highlightBiasWords") {
    highlightBiasWords(request.data);
  }
});

// Add event listeners for tooltips
document.addEventListener("mouseover", (event) => {
  if (event.target.classList.contains("bias-highlighted")) {
    const tooltip = document.createElement("div");
    tooltip.className = "bias-tooltip";
    tooltip.innerHTML = `<strong>${event.target.innerText}</strong><br>Score: ${event.target.dataset.biasScore}<br>Reason: ${event.target.dataset.biasReason}`;
    document.body.appendChild(tooltip);
    tooltip.style.left = `${event.pageX}px`;
    tooltip.style.top = `${event.pageY}px`;
  }
});

document.addEventListener("mouseout", (event) => {
  if (event.target.classList.contains("bias-highlighted")) {
    const tooltips = document.getElementsByClassName("bias-tooltip");
    while (tooltips.length > 0) {
      tooltips[0].parentNode.removeChild(tooltips[0]);
    }
  }
});
