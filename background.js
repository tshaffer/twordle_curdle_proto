// background.js
const serverUrl = 'http://localhost:8000';
const versionUrl = serverUrl + '/api/v1/version';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(function(activeTab){
  console.log('onClicked invoked - create tab');
  var newURL = "./twordle.html";
  chrome.tabs.create({ url: newURL });

  console.log('invoke getVersion');
  getVersion(versionUrl);
});

function getVersion(versionUrl) {
  console.log('getVersion invoked');
  fetch(versionUrl)
    .then(response => response.text())
    .then(response => console.log(response));
}

