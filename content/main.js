Components.utils.import("resource://talktome/content/console.js");

var tts = null;

try {
    Components.utils.import("resource://talktome/content/speech.js");
    tts = new TextToSpeech();
} catch (e) {
    console.log("ERROR: " + e);
}

var TalkToMe = {
    onLoad : function(aEvent) {
        try {
            this._wrapGestureModule ();
        } catch (e) {
            console.log("ERROR: " + e);
        }
        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener("TalkToMe:Speak", this);
    },

    _wrapMouseModule : function () {
        var w = window.wrappedJSObject;
        if (!w.MouseModule)
            return;

        /* borrowed from touching-is-good addon */

        var mmp = w.MouseModule.prototype;
        var mmpHandleEvent = mmp.handleEvent;

        mmp.handleEvent = function wrapped_handleEvent (e) {
            /* Could be useful one day... */
            return mmpHandleEvent.apply(this, [e]);
        }
        
    },

    _wrapGestureModule : function () {
        var w = window.wrappedJSObject;
        if (!w.GestureModule)
            return;

        /* borrowed from touching-is-good addon */

        var gmp = w.GestureModule.prototype;
        var gmpHandleEvent = gmp.handleEvent;

        gmp.handleEvent = function wrapped_handleEvent (e) {
            if (e.type == "MozSwipeGesture") {
                switch (e.direction) {
                case e.DIRECTION_RIGHT:
                    window.messageManager.sendAsyncMessage("TalkToMe:Navigate",
                                                           { direction : "next" });
                    console.log ("next");
                    break;
                case e.DIRECTION_LEFT:
                    window.messageManager.sendAsyncMessage("TalkToMe:Navigate",
                                                           { direction : "prev" });
                    console.log ("prev");
                    break;
                default:
                    break;
                }
            }

            return gmpHandleEvent.apply(this, [e]);
        }
        
    },

    onUIReady : function(aEvent) {
    },

    onUIReadyDelayed : function(aEvent) {
    },

    receiveMessage: function(aMessage) {
        let phrase = aMessage.json.phrase;
        tts.speak(phrase);
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
