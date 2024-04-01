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
  let nodeIndex = [];
  let h1Content = [];

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
  textContent.slice(0, 3000)
);
console.log(
  "Details of first few indexed nodes:",
  JSON.stringify(nodeIndex.slice(0, 5), null, 2)
);

function h1_indexer(h1ContentArray) {
  let indexedWordsByH1 = []; // Initialize an empty array to hold the objects

  // Iterate over each content string in the h1ContentArray
  h1ContentArray.forEach((content, sentenceIndex) => {
    // Prepare the object structure for this H1 content
    let sentenceInfo = {
      sentenceIndex: sentenceIndex,
      sentence: content,
      sentenceInfo: [],
    };

    // Split content into words based on spaces
    const words = content.split(/\s+/);

    // Iterate over words to fill the sentenceInfo array with objects containing word and its position
    words.forEach((word, position) => {
      if (word.trim() !== "") {
        // Only add non-empty strings
        sentenceInfo.sentenceInfo.push({ index: position, word });
      }
    });

    // Add the structured object for this H1 content to the array
    indexedWordsByH1.push(sentenceInfo);
  });

  return indexedWordsByH1; // Return the array with structured objects
}

let indexedH1Words = h1_indexer(h1Content);
console.log(
  "Indexed H1 Words Further Enhanced:",
  JSON.stringify(indexedH1Words, null, 2)
);

function highlightBiasedWords(indexedH1Words) {
  indexedH1Words.forEach((sentenceObj) => {
    // Extract the original sentence's words as an array
    const words = sentenceObj.sentence.split(/\s+/);

    // Rebuild the sentence, inserting spans where necessary
    const rebuiltSentence = words
      .map((word, index) => {
        // Find if this word has a bias rating
        const wordInfo = sentenceObj.sentenceInfo.find(
          (info) => info.index === index
        );
        if (
          wordInfo &&
          wordInfo.biasRatings &&
          wordInfo.biasRatings.length > 0
        ) {
          // Word has bias; wrap it in a span
          return `<span style='background-color: yellow;'>${word}</span>`;
        } else {
          return word; // Word does not have bias; leave it as is
        }
      })
      .join(" "); // Rejoin the words into a single string

    // Now, update the HTML of the corresponding <h1> tag
    const h1Nodes = document.querySelectorAll("h1");
    h1Nodes.forEach((node) => {
      if (node.innerText.trim() === sentenceObj.sentence.trim()) {
        console.log(`Highlighting biased words in sentence:`, node.innerText);
        node.innerHTML = rebuiltSentence;
      }
    });
  });
}

// In content-script.js, modify the response handling
chrome.runtime.sendMessage(
  {
    action: "analyzeContentBias",
    data: indexedH1Words,
  },
  function (response) {
    if (response && response.results) {
      response.results.forEach((result) => {
        if (result.error) {
          console.error(
            `Error analyzing content bias for sentence index ${result.index}: ${result.error}`
          );
        } else {
          // Find the corresponding sentence using sentenceIndex
          const sentenceObj = indexedH1Words.find(
            (s) => s.sentenceIndex === result.index
          );
          if (sentenceObj) {
            // Ensure we have a place to store bias ratings
            sentenceObj.sentenceInfo.forEach(
              (wordInfo) => (wordInfo.biasRatings = [])
            );

            result.data.content_bias.forEach((biasInfo) => {
              // Find the matching word in sentenceInfo
              const wordObj = sentenceObj.sentenceInfo.find(
                (word) => word.index === biasInfo.word_index_in_sentence
              );
              if (wordObj) {
                // Add the biasRating to this word
                wordObj.biasRatings.push(biasInfo.bias_rating);
              }
            });

            console.log(
              `Enhanced sentence info for sentence at index ${result.index}:`,
              sentenceObj
            );
          }
          highlightBiasedWords(indexedH1Words);
        }
      });
    } else {
      console.error(
        "Failed to get bias analysis results without specific error details."
      );
    }
  }
);

/*
##################
SECTION:
- HIGHLIGHT BIAS WORDS
- CREATE A TOOLTIP 
- SHOW TOOLTIP ON HOVER
##################
*/
