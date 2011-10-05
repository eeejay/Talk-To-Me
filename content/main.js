try {
    Components.utils.import("resource://talktome/content/console.js");
    Components.utils.import("resource://talktome/content/gesture_mangler.js");
    Components.utils.import("resource://talktome/content/highlighter.js");
    Components.utils.import("resource://talktome/content/input_manager.js");
} catch (e) {
    console.printException(e);
}

var TalkToMe = {
    _highlighter: null,

    onLoad : function(aEvent) {
        this.gesture_mangler = new GestureMangler(window);
        this.gesture_mangler.enable();
        
        this.input_manager = new InputManager(window);

        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener("TalkToMe:Speak",
                                                 this.speakHandler(this));
        window.messageManager.addMessageListener("TalkToMe:Tick",
                                                 this.tickHandler(this));
    },

    onUIReady : function(aEvent) {
        this._highlighter = new Highlighter (window);
    },

    onUIReadyDelayed : function(aEvent) {
    },

    tickHandler: function(self) {
        return function (aMessage) {
            console.log("tick");
            window.tts.playTick();
        };
    },

    speakHandler: function(self) {
        return function (aMessage) {
            try {
                let phrase = aMessage.json.phrase;
                let bounds = aMessage.json.bounds;
            
                window.tts.speakContent(phrase);
                self._highlighter.highlight(bounds);
            } catch (e) {
                console.log ("Error::receiveMessage: " + e);
            }
        };
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
