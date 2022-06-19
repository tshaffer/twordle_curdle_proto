const serverUrl = 'http://localhost:8000';
const versionUrl = serverUrl + '/api/v1/version';
const getWordsUrl = serverUrl + '/api/v1/getWordsEndpoint';

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
        /*
                export interface LetterTypes {
                  lettersAtExactLocation: string[];
                  lettersNotAtExactLocation: string[];
                  lettersNotInWord: string;
                }
        */
        const letterTypes = getLetterTypes(request.enteredLines);
        fetch(getWordsUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
            'Content-type': 'application/json; charset=UTF-8'
          },
          body: JSON.stringify(letterTypes),
        })
          .then(response => response.text())
          .then(response => console.log(response));

        // .then(response => response.json())
        // .then(response => sendResponse(response))
        // .catch(error => console.log('Error:', error));
      }
    );

  });

function getVersion(versionUrl) {
  fetch(versionUrl)
    .then(response => response.text())
    .then(response => console.log(response));
}

/*
interface EnteredLine {
  letters: string;
  evaluations: string[]; // where each string is 'present', 'absent', or '?'
}
interface EnteredLines: EnteredLine[]  // length of enteredLines is 6

return
  export interface LetterTypes {
    lettersAtExactLocation: string[];
    lettersNotAtExactLocation: string[];
    lettersNotInWord: string;
  }
*/
function getLetterTypes(enteredLines) {

  let lettersNotInWord = '';
  const letterAnswerValues = [];
  const lettersAtExactLocation = ['', '', '', '', ''];
  const lettersNotAtExactLocation = ['', '', '', '', ''];

  const numColumns = 5;

  for (let rowIndex = 0; rowIndex < enteredLines.length; rowIndex++) {
    letterAnswerValues.push([]);
    const letterAnswersInRow = letterAnswerValues[rowIndex];

    const enteredLine = enteredLines[rowIndex];

    for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {

      const evaluation = enteredLine.evaluations[columnIndex];

      let letterAnswerType;
      if (evaluation === 'present') {
        letterAnswerType = 'InWordAtNonLocation';
      } else if (evaluation === 'absent') {
        letterAnswerType = 'NotInWord';
      } else if (evaluation === 'correct') {
        letterAnswerType = 'InWordAtExactLocation';
      } else {
        letterAnswerType = 'NotInWord';
      }

      console.log(rowIndex, columnIndex, letterAnswerType);

      letterAnswersInRow.push(letterAnswerType);

      const currentCharacter = enteredLine.letters.charAt(columnIndex);

      console.log(rowIndex, columnIndex, currentCharacter, letterAnswerType);

      switch (letterAnswerType) {
        case 'InWordAtExactLocation':
          lettersAtExactLocation[columnIndex] = currentCharacter;
          break;
        case 'InWordAtNonLocation':
          lettersNotAtExactLocation[columnIndex] = lettersNotAtExactLocation[columnIndex] + currentCharacter;
          break;
        case 'NotInWord':
        default:
          lettersNotInWord = lettersNotInWord + currentCharacter;
          break;
      }
    }
  }

  return {
    lettersAtExactLocation,
    lettersNotAtExactLocation,
    lettersNotInWord,
  };

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

  document.body.addEventListener('keydown', async (event) => {

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


