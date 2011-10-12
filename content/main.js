try {
    Components.utils.import("resource://talktome/content/utils.js");
    Components.utils.import("resource://talktome/content/presenter.js");
    Components.utils.import("resource://talktome/content/input_manager.js");
    Components.utils.import("resource://talktome/content/navigator.js");
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
        this.navigator = new Navigator (window, this.presenter);
        this.inputManager = new InputManager(window, this.navigator);
        this.inputManager.start();
    }
}

// Setup the main event listeners
window.addEventListener("UIReady", Callback(TalkToMe.onUIReady, TalkToMe), false);
window.addEventListener("load", Callback(TalkToMe.onLoad, TalkToMe), false);
