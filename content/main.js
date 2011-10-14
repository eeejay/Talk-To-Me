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

    onUIReady : function (aEvent) {
        console.log("onUIReady");
        this.presenter = new Presenter (window, window.tts);
        this.navigator = new Navigator (window, this.presenter);
        this.inputManager = new InputManager(window, this.navigator);
        this.inputManager.start();
    }
}

// Try to load into a window, if it is premature listen for events.
if (window.document.readyState == "complete")
    TalkToMe.onUIReady(null);
else 
    window.addEventListener("UIReady",
                            Callback(TalkToMe.onUIReady, TalkToMe), false);
