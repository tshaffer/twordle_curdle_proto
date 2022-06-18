const serverUrl = 'http://localhost:8000';
const versionUrl = serverUrl + '/api/v1/version';

getVersion(versionUrl);

chrome.tabs.query({ active: true, currentWindow: true })
  .then(([tab]) => {

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: executeContentScript,
    });

    chrome.runtime.onMessage.addListener(
      function (request) {
        console.log('extension onMessage.addListener invoked, received:');
        console.log(request);
      }
    );

  }
  );

function getVersion(versionUrl) {
  fetch(versionUrl)
    .then(response => response.text())
    .then(response => console.log(response));
}

// CONTENT SCRIPT
function executeContentScript() {

  function processEnteredLines() {

    console.log('processEnteredLines invoked');

    const enteredLines = [];

    const gameRows = document.querySelectorAll('game-app')[0].shadowRoot.querySelectorAll('#game')[0].querySelectorAll('game-row');
    console.log('rows length: ' + gameRows.length);

    gameRows.forEach((gameRow, rowIndex) => {

      const letters = gameRow.getAttribute('letters');

      const enteredLine = {
        letters,
        evaluations: []
      };

      const gameTiles = gameRow.shadowRoot.querySelectorAll('game-tile');

      gameTiles.forEach((gameTile) => {
        const evaluation = gameTile.getAttribute('evaluation')
        enteredLine.evaluations.push(evaluation);
      });

      enteredLines.push(enteredLine);

    });

    console.log('Entered lines');
    console.log(enteredLines);

    const enteredLinesMessage = { enteredLines };
    console.log('send: ', enteredLinesMessage);
    chrome.runtime.sendMessage(enteredLinesMessage);

  }

  document.body.addEventListener("keydown", async (event) => {

    console.log('content script keydown handler invoked');

    console.log(event);

    // TEDTODO - don't fail if not on Wordle page
    if (event.key === 'Enter') {
      setTimeout(() => {
        processEnteredLines();
      }, 1000);
    }
  });
}


