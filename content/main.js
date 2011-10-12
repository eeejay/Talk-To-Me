try {
    Components.utils.import("resource://talktome/content/utils.js");
    Components.utils.import("resource://talktome/content/presenter.js");
    Components.utils.import("resource://talktome/content/input_manager.js");
} catch (e) {
    console.printException(e);
}

var TalkToMe = {
    presenter: null,
    inputManager: null,

    onLoad : function (aEvent) {
        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
    },

    onUIReady : function (aEvent) {
        console.log("onUIReady");
        this.presenter = new Presenter (window, window.tts);
        this.inputManager = new InputManager(window, this.presenter);
        this.inputManager.start();
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
