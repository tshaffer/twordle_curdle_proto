const serverUrl = 'http://localhost:8000';
const versionUrl = serverUrl + '/api/v1/version';

// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {

  fetch(versionUrl)
    .then(response => response.text())
    .then(response => flibbet(response));  

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});

chrome.runtime.onMessage.addListener(
  function (request) {
    console.log('extension onMessage.addListener invoked, received:');
    console.log(request);
  }
);

function flibbet(response) {
  console.log('response to getVersion');
  console.log(response);
}


// CONTENT SCRIPT
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;

    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    // https://stackoverflow.com/questions/2257070/detect-numbers-or-letters-with-jquery-javascript

    document.body.addEventListener("keydown", async (event) => {

      console.log('content script keydown handler invoked');

      const key = event.key.toUpperCase();
      if (key.length === 1) {

        const isLetter = (key >= 'A' && key <= 'Z');

        if (isLetter) {
          const keyDownMessage = { keyDown: key };
          console.log('send: ', keyDownMessage);
          chrome.runtime.sendMessage(keyDownMessage);
        }
        event.preventDefault();
      }
    });
  });
}

// http://localhost:8000