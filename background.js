// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(function(activeTab){
  console.log('onClicked invoked - create tab');
  var newURL = "twordle.html";
  chrome.tabs.create({ url: newURL });
});
