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
          .then(response => {
            const candidateWords = JSON.parse(response).words;
            console.log(candidateWords);
            const candidateWordsList = document.getElementById('candidateWordsList');

            // clear previous items
            candidateWordsList.innerHTML = '';

            for (var i = 0; i < candidateWords.length; i++) {

              // Create the list item:
              var item = document.createElement('li');

              // Set its contents:
              item.appendChild(document.createTextNode(candidateWords[i]));

              // Add it to the list:
              candidateWordsList.appendChild(item);

            }
          })
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

    // console.log('get body');
    // const body = document.querySelectorAll('body');
    // console.log(body);

    // const wordleAppGame = document.querySelectorAll('div#wordle-app-game');



    console.log('attempt to find gameRows');
    // updated implementation - 6/24/2022
    const gameRows = document.querySelectorAll('.Row-module_row__dEHfN');
    //     const gameRow = document.querySelectorAll('.Row-module_row__dEHfN')[0].querySelectorAll(".Tile-module_tile__3ayIZ")
    //     gameRow[0].getAttribute("data-state") // 'absent', 'correct', 'present'
    //     gameRow[0].innerHtml
    console.log('rows length: ' + gameRows.length);
    gameRows.forEach((gameRow, rowIndex) => {
      // const gameRow = document.querySelectorAll('.Row-module_row__dEHfN')[rowIndex].querySelectorAll(".Tile-module_tile__3ayIZ")
      let letters = '';
      const evaluations = [];
      gameRow.childNodes.forEach((gameRowChildNode, letterIndex) => {
        const realGameRow = gameRowChildNode.childNodes[0];
        const letterText = realGameRow.innerHTML;
        const evaluation = realGameRow.getAttribute('data-state');
        letters += letterText;
        evaluations.push(evaluation);
        // console.log('rowIndex: ', rowIndex, ' letterIndex: ', letterIndex, ' evaluation: ', evaluation, ' letterText: ', letterText);
      });
      console.log('rowIndex: ', rowIndex, 'Guess: ', letters, 'Evaluations: ', evaluations);
      const enteredLine = {
        letters,
        evaluations
      };
      enteredLines.push(enteredLine);
    });





    // original implementation
    // const gameRows = document.querySelectorAll('game-app')[0].shadowRoot.querySelectorAll('#game')[0].querySelectorAll('game-row');
    // console.log('rows length: ' + gameRows.length);
    // gameRows.forEach((gameRow, rowIndex) => {

    //   const letters = gameRow.getAttribute('letters');

    //   const enteredLine = {
    //     letters,
    //     evaluations: []
    //   };

    //   const gameTiles = gameRow.shadowRoot.querySelectorAll('game-tile');

    //   gameTiles.forEach((gameTile) => {
    //     const evaluation = gameTile.getAttribute('evaluation')
    //     enteredLine.evaluations.push(evaluation);
    //   });

    //   enteredLines.push(enteredLine);

    // });

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


