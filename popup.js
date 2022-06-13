// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");
    console.log(request);
    // alert('received message in popup.js');
    // alert(request.greeting);
    if (request.greeting === "hello") {
      sendResponse({ farewell: "goodbye" });
    }
  }
);

// The body of this function will be executed as a content script inside the current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;


    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    // https://stackoverflow.com/questions/2257070/detect-numbers-or-letters-with-jquery-javascript

    document.body.addEventListener("keydown", async (event) => {

      const key = event.key.toUpperCase();
      if (key.length !== 1) {
        return;
      }

      const isLetter = (key >= 'A' && key <= 'Z');

      if (isLetter) {
        console.log(key);
        const keyDownMessage = { keyDown: key };
        // chrome.runtime.sendMessage({ keyDown: key }, function (response) {
        chrome.runtime.sendMessage(keyDownMessage, function (response) {
          // console.log(response.farewell);
          console.warn('flibbet');
          // alert('send greeting to background script');
        });

      }
      event.preventDefault();
    });
  });
}

