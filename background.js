// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(function(activeTab){
  var newURL = "twordle.html";
  chrome.tabs.create({ url: newURL });
});
