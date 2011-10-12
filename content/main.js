try {
    Components.utils.import("resource://talktome/content/utils.js");
    Components.utils.import("resource://talktome/content/gesture_mangler.js");
    Components.utils.import("resource://talktome/content/presenter.js");
    Components.utils.import("resource://talktome/content/input_manager.js");
} catch (e) {
    console.printException(e);
}

var TalkToMe = {
    presenter: null,

    onLoad : function (aEvent) {
        this.gesture_mangler = new GestureMangler(window);
        this.gesture_mangler.enable();
        
        this.input_manager = new InputManager(window);

        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
    },

    onUIReady : function (aEvent) {
        this.presenter = new Presenter (window, window.tts);
    },

    tickHandler: function (aMessage) {
        console.log("tick");
        window.tts.playTick();
    },

    speakHandler: function (aMessage) {
        window.tts.speakContent(aMessage.json.phrase);
    },
}

// Setup the main event listeners
window.addEventListener("UIReady", Callback(TalkToMe.onUIReady, TalkToMe), false);
window.addEventListener("load", Callback(TalkToMe.onLoad, TalkToMe), false);
