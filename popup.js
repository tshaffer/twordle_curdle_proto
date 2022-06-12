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
    alert('received message in popup.js');
    alert(request.greeting);
    if (request.greeting === "hello") {
      sendResponse({ farewell: "goodbye" });
    }
  }
);

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;

    document.body.addEventListener("click", async () => {
      alert("Click event on web page");
    });

    document.body.addEventListener("keydown", async (event) => {
      console.log("keyboard event");
      console.log(event.code);
      console.log(event);
      alert("New Keyboard event on document");
      alert(event);
      alert(event.code);
      event.preventDefault();
    });

    chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
      console.log(response.farewell);
      console.warn('flibbet');
      // alert('send greeting to background script');
    });

  });
}

