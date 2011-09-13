Components.utils.import("resource://talktome/content/console.js");

var TalkToMe = {
    onLoad : function(aEvent) {
        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener("TalkToMe:Speak", this);
    },

    onUIReady : function(aEvent) {
    },

    onUIReadyDelayed : function(aEvent) {
    },

    receiveMessage: function(aMessage) {
        let phrase = aMessage.json.phrase;
        console.log ("SPEAK: " + phrase);
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

