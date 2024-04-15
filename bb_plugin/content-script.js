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

// SCRAPE WEBSITE CONTENT WORDS, CLEAN IT, INDEX WORDS (BACKGROUND.JS CAN ACCESS THIS)

function getParentWithMostParagraphs(element) {
  let bestParent = null;
  let highestParagraphCount = 0;
  const paragraphElements = element.querySelectorAll("p");

  // Create a map to count paragraphs per parent
  const parentParagraphCountMap = new Map();

  paragraphElements.forEach((paragraph) => {
    const parentElement = paragraph.parentElement;
    if (parentParagraphCountMap.has(parentElement)) {
      parentParagraphCountMap.set(
        parentElement,
        parentParagraphCountMap.get(parentElement) + 1
      );
    } else {
      parentParagraphCountMap.set(parentElement, 1);
    }
  });

  // Determine which parent has the highest count of <p> tags
  for (let [parent, count] of parentParagraphCountMap) {
    if (count > highestParagraphCount) {
      highestParagraphCount = count;
      bestParent = parent;
    }
  }

  return bestParent;
}

const mainElement = document.querySelector("main") || document.body; // Fallback to document.body if <main> is not present
const contentParent = getParentWithMostParagraphs(mainElement);

if (contentParent) {
  console.log("The likely body element:", contentParent);
} else {
  console.log("No element with a significant number of paragraphs was found.");
}

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

// FOR INDIVIDUAL WORDS
// function h1_indexer(h1ContentArray) {
//   let indexedWordsByH1 = []; // Initialize an empty array to hold the objects

//   // Iterate over each content string in the h1ContentArray
//   h1ContentArray.forEach((content, sentenceIndex) => {
//     // Prepare the object structure for this H1 content
//     let sentenceInfo = {
//       sentenceIndex: sentenceIndex,
//       sentence: content,
//       sentenceInfo: [],
//     };

//     // Split content into words based on spaces
//     const words = content.split(/\s+/);

//     // Iterate over words to fill the sentenceInfo array with objects containing word and its position
//     words.forEach((word, position) => {
//       if (word.trim() !== "") {
//         // Only add non-empty strings
//         sentenceInfo.sentenceInfo.push({ index: position, word });
//       }
//     });

//     // Add the structured object for this H1 content to the array
//     indexedWordsByH1.push(sentenceInfo);
//   });

//   return indexedWordsByH1; // Return the array with structured objects
// }

function h1_indexer(h1ContentArray) {
  let indexedHeadlines = [];

  // Iterate over each content string in the h1ContentArray
  h1ContentArray.forEach((content, sentenceIndex) => {
    // Prepare the object structure for this headline
    let headlineInfo = {
      sentenceIndex: sentenceIndex,
      sentence: content,
    };

    // Add the structured object for this headline to the array
    indexedHeadlines.push(headlineInfo);
  });

  return indexedHeadlines;
}

let indexedH1Sentence = h1_indexer(h1Content);

console.log(
  "Indexed H1 Words Further Enhanced:",
  JSON.stringify(indexedH1Sentence, null, 2)
);

// FOR INDIVIDUAL WORDS
// function highlightBiasedWords(indexedH1Sentence) {
//   indexedH1Words.forEach((sentenceObj) => {
//     // Extract the original sentence's words as an array
//     const words = sentenceObj.sentence.split(/\s+/);

//     // Rebuild the sentence, inserting spans where necessary
//     const rebuiltSentence = words
//       .map((word, index) => {
//         // Find if this word has a bias rating
//         const wordInfo = sentenceObj.sentenceInfo.find(
//           (info) => info.index === index
//         );
//         if (
//           wordInfo &&
//           wordInfo.biasRatings &&
//           wordInfo.biasRatings.length > 0
//         ) {
//           // Word has bias; wrap it in a span
//           return `<span style='background-color: yellow;'>${word}</span>`;
//         } else {
//           return word; // Word does not have bias; leave it as is
//         }
//       })
//       .join(" "); // Rejoin the words into a single string

//     // Now, update the HTML of the corresponding <h1> tag
//     const h1Nodes = document.querySelectorAll("h1");
//     h1Nodes.forEach((node) => {
//       if (node.innerText.trim() === sentenceObj.sentence.trim()) {
//         console.log(`Highlighting biased words in sentence:`, node.innerText);
//         node.innerHTML = rebuiltSentence;
//       }
//     });
//   });
// }

function highlightBiasedSentences(indexedSentences, biasResults) {
  console.log("Attempting to highlight sentences...");
  console.log("Indexed sentences:", indexedSentences);
  console.log("Bias results:", biasResults);

  indexedSentences.forEach((sentenceObj) => {
    const biasInfo = biasResults.find(
      (result) => result.sentence_id === sentenceObj.sentenceIndex
    );

    console.log("Searching for bias info:", biasInfo);

    const h1Nodes = document.querySelectorAll("h1");
    console.log(`Found ${h1Nodes.length} H1 nodes`);

    h1Nodes.forEach((node) => {
      console.log(
        `Comparing: [${node.innerText.trim()}] to [${sentenceObj.sentence.trim()}]`
      );

      if (node.innerText.trim() === sentenceObj.sentence.trim() && biasInfo) {
        console.log(`Highlighting sentence: ${node.innerText}`);

        const highlightSpan = document.createElement("span");
        highlightSpan.style.backgroundColor = "yellow";
        highlightSpan.setAttribute(
          "data-bias-type",
          biasInfo.bias_rating.bias_type
        );
        highlightSpan.setAttribute(
          "data-bias-score",
          biasInfo.bias_rating.bias_score.toString()
        );
        highlightSpan.innerHTML = node.innerHTML;

        node.innerHTML = "";
        node.appendChild(highlightSpan);
      } else {
        console.log("No match or no bias info found.");
      }
    });
  });
}

function injectBiasInfoPopup() {
  fetch(chrome.runtime.getURL("bias-info.html"))
    .then((response) => response.text())
    .then((data) => {
      document.body.insertAdjacentHTML("beforeend", data);
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("bias-info.js");
      document.body.appendChild(script);
    });
}

injectBiasInfoPopup();

/*
########################
### RUNTIME SECTION
########################
*/

chrome.runtime.sendMessage(
  {
    action: "analyzeContentBias",
    // Include the URL in the data sent to the background script
    data: {
      url: window.location.href.split("?")[0],
      sentences: indexedH1Sentence,
    },
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
          console.log("Analysis successful");
          console.log(result);
          const sentenceObj = indexedSentences.find(
            (s) => s.sentenceIndex === result.index
          );
          if (sentenceObj) {
            console.log(
              `Received analysis for sentence at index ${result.index}:`,
              sentenceObj
            );

            // Highlight the sentence based on the received analysis
            highlightBiasedSentences([sentenceObj]);
          }
        }
      });
    } else {
      console.error(
        "Failed to get bias analysis results without specific error details."
      );
    }
  }
);
