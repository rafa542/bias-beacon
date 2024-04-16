// COntent script

// This script will be injected into the webpage to highlight biased words.

console.log("content-script.js loaded.");

/*
##################################
### SCRAPE BODY CONTENT
##################################
*/

// function getParentWithMostParagraphs(element) {
//   let bestParent = null;
//   let highestParagraphCount = 0;
//   const paragraphElements = element.querySelectorAll("p");

//   // Create a map to count paragraphs per parent
//   const parentParagraphCountMap = new Map();

//   paragraphElements.forEach((paragraph) => {
//     const parentElement = paragraph.parentElement;
//     if (parentParagraphCountMap.has(parentElement)) {
//       parentParagraphCountMap.set(
//         parentElement,
//         parentParagraphCountMap.get(parentElement) + 1
//       );
//     } else {
//       parentParagraphCountMap.set(parentElement, 1);
//     }
//   });

//   // Determine which parent has the highest count of <p> tags
//   for (let [parent, count] of parentParagraphCountMap) {
//     if (count > highestParagraphCount) {
//       highestParagraphCount = count;
//       bestParent = parent;
//     }
//   }

//   return bestParent;
// }

// const mainElement = document.querySelector("main") || document.body; // Fallback to document.body if <main> is not present
// const contentParent = getParentWithMostParagraphs(mainElement);

// if (contentParent) {
//   console.log("The likely element with content:", contentParent);
// } else {
//   console.log("No element with a significant number of paragraphs was found.");
// }

// function extractAndIndexTextIncludingLinks(element) {
//   let index = 0; // Initialize an index for all text-containing elements
//   let indexedSentences = []; // Array to hold the indexed sentence data

//   console.log("Starting traversal and indexing...");

//   function traverseAndProcess(node) {
//     let directTextContent = "";
//     let containsLink = false;
//     Array.from(node.childNodes).forEach((child) => {
//       if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
//         // Accumulate direct text content for non-empty text nodes
//         directTextContent += ` ${child.textContent.trim()}`;
//       } else if (child.nodeType === Node.ELEMENT_NODE) {
//         if (child.tagName === "A") {
//           // If the element is an <a> tag, process its text content specifically
//           directTextContent += ` <a href="${
//             child.href
//           }">${child.textContent.trim()}</a>`;
//           containsLink = true;
//         } else {
//           // Recursively process other elements
//           traverseAndProcess(child);
//         }
//       }
//     });

//     if (directTextContent.trim()) {
//       // If there's accumulated direct text content (including <a> tags), index this node
//       console.log(`Indexing element: ${node.tagName}, Index: ${index}`);
//       node.setAttribute(`data-sentence-index-${index}`, "");
//       indexedSentences.push({
//         index: index,
//         text: directTextContent.trim(),
//         containsLink: containsLink,
//       });
//       index++; // Increment index for the next text-containing node
//     }
//   }

//   traverseAndProcess(element);

//   console.log("Traversal and indexing complete.");
//   return indexedSentences; // Return the collected and indexed sentence data
// }

// // Use the content parent determined by your heuristic to extract and index sentences
// const indexedSentences = extractAndIndexTextIncludingLinks(contentParent);
// console.log("Indexed Sentences Object:", indexedSentences);

function extractAndIndexTextNodesV2(element) {
  let sentenceIndex = 0; // Initialize sentence index
  const indexedSentences = []; // Initialize array to store indexed sentences

  console.log("Starting traversal and indexing...");

  function traverseAndIndexNodes(node) {
    // This function will be used to check if a node directly contains text or an anchor (<a>) with text
    function hasDirectTextOrLink(node) {
      for (let child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          // Node directly contains text
          return true;
        } else if (
          child.nodeType === Node.ELEMENT_NODE &&
          child.tagName === "A" &&
          child.textContent.trim()
        ) {
          // Node directly contains an <a> tag with text
          return true;
        }
      }
      return false; // No direct text or anchor (<a>) with text found
    }

    if (
      node.nodeType === Node.ELEMENT_NODE &&
      !["SCRIPT", "STYLE"].includes(node.tagName) &&
      hasDirectTextOrLink(node)
    ) {
      const textContent = node.textContent.trim();
      node.setAttribute(`data-sentence-index`, sentenceIndex);
      indexedSentences.push({
        sentenceIndex: sentenceIndex,
        sentence: textContent,
        tagName: node.tagName,
      });
      // console.log(
      //   `Indexed: '${textContent}' at Index: ${sentenceIndex} in <${node.tagName}> directly`
      // );
      sentenceIndex++;
    }

    // Traverse child nodes
    Array.from(node.childNodes).forEach((childNode) => {
      if (!["SCRIPT", "STYLE", "A"].includes(childNode.tagName)) {
        traverseAndIndexNodes(childNode);
      }
    });
  }

  traverseAndIndexNodes(element);

  console.log("Traversal and indexing complete.");

  // Returning the indexed sentences array
  return indexedSentences;
}

const mainContent = document.querySelector("main") || document.body; // Using the main content area or the body as a fallback
const indexedSentences = extractAndIndexTextNodesV2(mainContent);
console.log("Indexed elements with text content:", indexedSentences);

/*
##################################
### SCRAPE HEADER CONTENT
##################################
*/

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

/*
##################################
### HIGHLIGHT BIASED SENTENCES
##################################
*/

function highlightBiasedSentences(biasResults) {
  console.log("Attempting to highlight sentences...");
  console.log("Bias results:", biasResults);

  // Directly process the biasResults object
  const { sentenceIndex, data } = biasResults;
  console.log(`Processing result for sentence index: ${sentenceIndex}`, data);

  const biasType = data.content_bias.bias_type;
  const biasScore = data.content_bias.bias_score;
  console.log(`Bias Type: ${biasType}, Bias Score: ${biasScore}`);

  // Check if biasScore is 0.8 or above
  if (biasScore >= 0.7) {
    // Find the element with the matching `data-sentence-index` attribute
    const attributeSelector = `[data-sentence-index='${sentenceIndex}']`;
    console.log(`Attribute selector: ${attributeSelector}`);

    const elementToHighlight = document.querySelector(attributeSelector);
    console.log("Element to highlight:", elementToHighlight);

    if (elementToHighlight) {
      console.log(`Highlighting sentence at index: ${sentenceIndex}`);

      // Add bias information attributes
      elementToHighlight.setAttribute("data-bias-type", biasType);
      elementToHighlight.setAttribute("data-bias-score", biasScore.toString()); // Ensure score is a string

      // Apply highlighting style
      elementToHighlight.style.backgroundColor = "yellow";
    } else {
      console.log(`No element found for sentence index: ${sentenceIndex}`);
    }
  } else {
    console.log(
      `Skipping sentence at index: ${sentenceIndex} due to low bias score.`
    );
  }
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
##################################
### RUNTIME SECTION
##################################
*/

// chrome.runtime.sendMessage(
//   {
//     action: "analyzeContentBias",
//     data: {
//       url: window.location.href.split("?")[0],
//       sentences: indexedSentences,
//     },
//   },
//   function (response) {
//     console.log("Initial response", response); // Confirm the response structure
//     if (response && response.results) {
//       console.log("Processing results...");

//       // Match the response results with the indexed sentences based on the index
//       let sentencesToHighlight = response.results
//         .filter((result) => !result.error) // Filter out any errors
//         .map((result) => {
//           // Find the corresponding sentence object by sentence index
//           const sentenceObj = indexedSentences.find(
//             (sentence) => sentence.index === result.sentence_id
//           );
//           if (sentenceObj) {
//             // Combine sentence object with bias information
//             return { ...sentenceObj, biasInfo: result.bias_rating };
//           }
//           return null;
//         })
//         .filter(Boolean); // Remove any nulls that may have been added due to unmatched sentences

//       console.log("Sentences to highlight:", sentencesToHighlight);

//       if (sentencesToHighlight.length > 0) {
//         console.log(`Highlighting ${sentencesToHighlight.length} sentences...`);
//         // Call a function to apply highlighting to sentences
//         highlightBiasedSentences(sentencesToHighlight);
//       } else {
//         console.log("No sentences to highlight.");
//       }
//     } else {
//       console.error(
//         "Failed to get bias analysis results without specific error details."
//       );
//     }
//   }
// );

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "contentBiasResult") {
//     const result = message.result;
//     // Now process this result
//     // For example, highlight the sentence or display bias info
//     console.log("Received bias analysis result:", result);
//     // Assume `highlightBiasedSentence` is a function you've written to handle the highlighting
//     highlightBiasedSentence(result);
//   }
// });

chrome.runtime.sendMessage({
  action: "analyzeContentBias",
  data: {
    url: window.location.href.split("?")[0],
    sentences: indexedSentences,
  },
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "contentBiasResult") {
    const result = message.result;
    console.log("Received bias analysis result:", result);
    // Process the result to highlight biased sentences
    highlightBiasedSentences(result);
  } else if (message.action === "contentBiasError") {
    console.error(
      "Error in bias analysis:",
      message.error,
      "for index:",
      message.index
    );
    // Optionally handle the error, such as displaying an error message
  }
});
