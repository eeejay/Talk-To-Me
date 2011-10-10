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
            "TalkToMe:ShowBounds", Callback(this.showBoundsHandler,this));
        window.messageManager.addMessageListener(
            "TalkToMe:Tick", Callback(this.tickHandler,this));
    },

    onUIReady : function (aEvent) {
        let highlighter = this._highlighter = new Highlighter (window);
        // listen for events that require us to redraw the highlighter.
        window.messageManager.addMessageListener(
            "MozScrolledAreaChanged", Callback(this.askForBounds));
        window.Browser.controlsScrollbox.addEventListener(
            'scroll', Callback(this.askForBounds));
    },

    tickHandler: function (aMessage) {
        console.log("tick");
        window.tts.playTick();
    },

    speakHandler: function (aMessage) {
        window.tts.speakContent(aMessage.json.phrase);
    },

    showBoundsHandler: function (aMessage) {
        this._highlighter.highlight(aMessage.json.bounds);
    },

    askForBounds: function () {
        let mm = window.Browser.selectedTab.browser.messageManager;
        mm.sendAsyncMessage("TalkToMe:CurrentBounds");
    }
}

// Setup the main event listeners
window.addEventListener("UIReady", Callback(TalkToMe.onUIReady, TalkToMe), false);
window.addEventListener("load", Callback(TalkToMe.onLoad, TalkToMe), false);
