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

        // Load content script
        window.messageManager.addMessageListener(
            "TalkToMe:BootstrapMe",
            function (message) {
                window.messageManager.sendAsyncMessage(
                    "TalkToMe:Bootstrap",
                    {extName: extName, installPathString: installPathURI.spec});
            });
        window.messageManager.loadFrameScript(
            PlatformUtils.resolveResourceURI(
                "resource://talktome/content/content-script.js"), true);

        this.presenter = new Presenter (window, window.tts);
        this.navigator = new Navigator (window, this.presenter);
        this.inputManager = new InputManager(window, this.navigator);
        this.inputManager.start();
    },

    unloadFunc: function () {
        this.presenter.remove();
        this.inputManager.stop();
        window.messageManager.sendAsyncMessage("TalkToMe:Shutdown");
    }
}

var unloadFunc = Callback(TalkToMe.unloadFunc, TalkToMe);

// Try to load into a window, if it is premature listen for events.
if (window.document.readyState == "complete")
    Callback(TalkToMe.onUIReady, TalkToMe)(null);
else 
    window.addEventListener("UIReady",
                            Callback(TalkToMe.onUIReady, TalkToMe), false);
