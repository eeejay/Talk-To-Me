var TalkToMe = {
  onLoad : function(aEvent) {
      window.messageManager.loadFrameScript("resource://talktome/content/content.js",
                                            true);
  },

  onUIReady : function(aEvent) {
  },

  onUIReadyDelayed : function(aEvent) {
  }
};

// Setup the main event listeners
window.addEventListener("load", function(e) {
  TalkToMe.onLoad(e);
}, false);

window.addEventListener("UIReady", function(e) {
  TalkToMe.onUIReady(e);
}, false);

window.addEventListener("UIReadyDelayed", function(e) {
  TalkToMe.onUIReadyDelayed(e);
}, false);

