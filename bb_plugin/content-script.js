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
  console.log("The likely element with content:", contentParent);
} else {
  console.log("No element with a significant number of paragraphs was found.");
}

function extractTextFromElement(element) {
  let textContent = "";

  function traverseChildren(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Compress multiple spaces into one and trim each text node's content
      textContent += node.textContent.replace(/\s+/g, " ").trim() + " ";
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      node.tagName !== "SCRIPT" &&
      node.tagName !== "STYLE"
    ) {
      // Skip <script> and <style> tags
      Array.from(node.childNodes).forEach(traverseChildren);
    }
  }

  traverseChildren(element);

  return textContent.trim(); // Further trim the fully concatenated text
}

// Using the identified content parent element to extract text
const contentParentText = extractTextFromElement(contentParent);
console.log("Extracted text content:", contentParentText);

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
    data: {
      url: window.location.href.split("?")[0],
      sentences: indexedH1Sentence,
    },
  },
  function (response) {
    console.log("Initial response", response); // Confirm the response structure
    if (response && response.results) {
      console.log("Processing results..."); // Check if results processing begins

      console.log("Results:", response.results); // Diagnostic: Log the results directly to inspect their structure

      let sentencesToHighlight = response.results
        .filter((result) => {
          // Only log and exclude if `error` is explicitly present
          if (result.error) {
            console.error(`Error in result:`, result.error); // Log any result errors
            return false; // Exclude results with errors
          }
          console.log("Indexed sentences for matching:", indexedH1Sentence);

          return true; // Include results without errors
        })
        .map((result) => {
          try {
            console.log(
              "Looking for match for ID:",
              result.sentence_id,
              "in",
              indexedH1Sentence.map((s) => s.sentenceIndex)
            );
            const sentenceMatch = indexedH1Sentence.find(
              // Changed to `indexedH1Sentence` based on your context
              (sentence) => {
                console.log(
                  typeof result.sentence_id,
                  typeof sentence.sentenceIndex
                ); // Correctly placed inside where `sentence` is defined
                return sentence.sentenceIndex === result.sentence_id;
              }
            );
            if (!sentenceMatch) {
              console.log(`No match for sentence ID: ${result.sentence_id}`); // Diagnostic for unmatched sentences
              return null;
            }
            return { ...sentenceMatch, biasInfo: result };
          } catch (error) {
            console.error("Error processing result:", error);
            return null;
          }
        })
        .filter(Boolean);

      console.log("Sentences to highlight", sentencesToHighlight); // Verify sentences to be highlighted

      if (sentencesToHighlight.length > 0) {
        console.log(`Highlighting ${sentencesToHighlight.length} sentences...`); // Confirm highlighting action
        highlightBiasedSentences(sentencesToHighlight, response.results);
      } else {
        console.log("No sentences to highlight."); // Indicate no sentences met criteria
      }
    } else {
      console.error(
        "Failed to get bias analysis results without specific error details."
      );
    }
  }
);
