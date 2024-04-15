// bias-info.js

// Define the functions for showing, hiding, and updating the bias info popup
function showBiasPopup(x, y) {
  const popup = document.getElementById("bias-info");
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.display = "block";
}

function hideBiasPopup() {
  const popup = document.getElementById("bias-info");
  popup.style.display = "none";
}

function updateBiasPopupContent(biasType, biasScore) {
  document.getElementById("bias-type").textContent = biasType;
  document.getElementById("bias-score").textContent = biasScore;
}

// Use mouseover event to display the bias popup
document.addEventListener("mouseover", function (e) {
  if (e.target.matches("[data-bias-type]")) {
    const biasType = e.target.getAttribute("data-bias-type");
    const biasScore = e.target.getAttribute("data-bias-score");

    // Update popup content with bias info
    updateBiasPopupContent(biasType, biasScore);

    // Show the popup near the cursor
    showBiasPopup(e.pageX, e.pageY);
  }
});

// Use mouseout event to hide the bias popup
document.addEventListener("mouseout", function (e) {
  if (e.target.matches("[data-bias-type]")) {
    // Hide the popup when the mouse leaves the element
    hideBiasPopup();
  }
});
