try {
    Components.utils.import("resource://talktome/content/console.js");
    Components.utils.import("resource://talktome/content/gesture_mangler.js");
    Components.utils.import("resource://talktome/content/highlighter.js");
    Components.utils.import("resource://talktome/content/input_manager.js");
    Components.utils.import("resource://talktome/content/closure_utils.js");
} catch (e) {
    console.printException(e);
}

var TalkToMe = {
    _highlighter: null,

    onLoad : function (aEvent) {
        this.gesture_mangler = new GestureMangler(window);
        this.gesture_mangler.enable();
        
        this.input_manager = new InputManager(window);

        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener(
            "TalkToMe:Speak", Callback(this.speakHandler,this));
        window.messageManager.addMessageListener(
            "TalkToMe:Tick", Callback(this.tickHandler,this));
    },

    onUIReady : function (aEvent) {
        this._highlighter = new Highlighter (window);
    },

    tickHandler: function (aMessage) {
        console.log("tick");
        window.tts.playTick();
    },

    speakHandler: function (aMessage) {
        let phrase = aMessage.json.phrase;
        let bounds = aMessage.json.bounds;
            
        window.tts.speakContent(phrase);
        this._highlighter.highlight(bounds);
    }
}

// Setup the main event listeners
window.addEventListener("UIReady", Callback(TalkToMe.onUIReady, TalkToMe), false);
window.addEventListener("load", Callback(TalkToMe.onLoad, TalkToMe), false);
