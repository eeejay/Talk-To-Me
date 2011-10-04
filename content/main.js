try {
    Components.utils.import("resource://talktome/content/console.js");
    Components.utils.import("resource://talktome/content/input_mangler.js");
    Components.utils.import("resource://talktome/content/highlighter.js");
} catch (e) {
    console.printException(e);
}

var TalkToMe = {
    _highlighter: null,

    onLoad : function(aEvent) {
        this.input_mangler = new InputMangler(window);
        this.input_mangler.enable();

        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener("TalkToMe:Speak", this);
    },

    onUIReady : function(aEvent) {
        this._highlighter = new Highlighter (window);
    },

    onUIReadyDelayed : function(aEvent) {
    },

    receiveMessage: function(aMessage) {
        try {
            let phrase = aMessage.json.phrase;
            let bounds = aMessage.json.bounds;

            tts.speak(phrase);
            this._highlighter.highlight(bounds);
        } catch (e) {
            console.log ("Error::receiveMessage: " + e);
        }
    }
}

// Setup the main event listeners
window.addEventListener("load", function(e) {
    try {
        console.log ("load");
        TalkToMe.onLoad(e);
    } catch (e) {
        console.log ("Error::onLoad: " + e);
    }
}, false);

window.addEventListener("UIReady", function(e) {
    try {
        TalkToMe.onUIReady(e);
    } catch (e) {
        console.log ("Error::onUIReady: " + e);
    }
}, false);

window.addEventListener("UIReadyDelayed", function(e) {
  TalkToMe.onUIReadyDelayed(e);
}, false);

window.addEventListener("TalkToMe::Swipe", function (e) {
    console.log ("Swipe");
    console.dumpObj (e.detail);
}, false);

console.dumpObj(window);