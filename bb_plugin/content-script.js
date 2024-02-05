// COntent script

console.log("Content script loaded");

// Function to extract text or content from page

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
