var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

try {
    contentInit ();
} catch (e) {
    addMessageListener(
        "TalkToMe:Bootstrap", function (message) {
            let data = message.json;
            let resource = Services.io.getProtocolHandler("resource").
                QueryInterface(Ci.nsIResProtocolHandler);
            
            dump ("creating subsitution\n");
            let alias = Services.io.newURI(data.installPathString, null, null);
            resource.setSubstitution(data.extName, alias);
            
            contentInit();
        }
    );
    sendAsyncMessage("TalkToMe:BootstrapMe");
}

var domWalker = null;

function contentInit () {
    Cu.import("resource://talktome/content/utils.js");
    Cu.import("resource://talktome/content/dom_walker.js");
    
    addEventListener('DOMContentLoaded',
                     Callback(contentLoadedHandler));
    addMessageListener("TalkToMe:Navigate",
                       Callback(navigateHandler));
    addMessageListener("TalkToMe:Activate",
                       Callback(activateHandler));
    addMessageListener("TalkToMe:CurrentBounds",
                       Callback(currentBoundsHandler));
    addEventListener("MozScrolledAreaChanged",
                     Callback(currentBoundsHandler));

    if (content.document.readyState == "complete")
        contentLoadedHandler({target: content.document});
}


function WebProgressListener() {
    let flags = Ci.nsIWebProgress.NOTIFY_ALL;

    let webProgress = docShell.QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIWebProgress);
    webProgress.addProgressListener(this, flags);
}

WebProgressListener.prototype = {
    STATE_STRINGS: {
        0x00000001: "START",
        0x00000002: "REDIRECTING",
        0x00000004: "TRANSFERING",
        0x00000008: "NEGOTIATING",
        0x00000010: "STOP",

        0x00010000: "IS_REQUEST",
        0x00020000: "IS_DOCUMENT",
        0x00040000: "IS_NETWORK",
        0x00080000: "IS_WINDOW",

        0x01000000: "RESTORING"
    },
    _stateToString: function _stateToString(aStateFlags) {
        let stateStrings = [];
        for (let flag in this.STATE_STRINGS) {
            if (flag & aStateFlags)
                stateStrings.push(this.STATE_STRINGS[flag]);
        }
        return stateStrings.toString();
    },
    onStateChange: function onStateChange(aWebProgress, aRequest, aStateFlags,
                                          aStatus) {
        try {
            let load_start = Ci.nsIWebProgressListener.STATE_START |
                Ci.nsIWebProgressListener.STATE_IS_REQUEST |
                Ci.nsIWebProgressListener.STATE_IS_DOCUMENT |
                Ci.nsIWebProgressListener.STATE_IS_WINDOW |
                Ci.nsIWebProgressListener.STATE_IS_NETWORK;
            
            if ((aStateFlags & load_start) == load_start &&
                content.location != "about:blank")  {
                sendAsyncMessage("TalkToMe:SpeakAppState",
                                 { phrase: "Loading" });
            }
        } catch (e) {
            console.printException(e);
        }
    },

    onProgressChange: function onProgressChange() {},
    onLocationChange: function onLocationChange() {},
    onStatusChange: function onStatusChange() {},
    onSecurityChange: function onSecurityChange() {},

    QueryInterface: function QueryInterface(aIID) {
        if (aIID.equals(Ci.nsIWebProgressListener) ||
            aIID.equals(Ci.nsISupportsWeakReference) ||
            aIID.equals(Ci.nsISupports)) {
            return this;
        }
        
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
};

try {
    var webProgressListener = new WebProgressListener();
} catch (e) {
    console.printException(e);
}

function contentLoadedHandler (e) {
    // only interested in top-level.
    if (content.document != e.target || e.target.location == "about:blank")
        return;

    sendAsyncMessage("TalkToMe:SpeakAppState",
                     { phrase: content.document.title + " loaded." });
    
    domWalker = new DOMWalker(content);
    domWalker.newNodeFunc = 
        Callback(function (currentNode, reason) {
            if (!currentNode) {
                sendAsyncMessage("TalkToMe:" + "DeadEnd");
                return;
            }

            let mname = (reason != "atpoint") ? "SpeakNav" : "SpeakPoint";
            
            sendAsyncMessage("TalkToMe:" + mname,
                             { phrase: DOMWalker.accToPhrase(currentNode) });
            let bounds = DOMWalker.accToRect(
                content.window.pageXOffset,
                content.window.pageYOffset,
                currentNode,
                // TODO: must be a better way to know if we are local.
                (content.location == "about:home"));
            sendAsyncMessage("TalkToMe:ShowBounds", { bounds: bounds });
        }, this);
    domWalker.getDocRoot ();
}

function navigateHandler(message) {
    let direction = message.json.direction;

    if (direction) {
        if (direction == "next")
            domWalker.next();
        else if (direction == "prev")
            domWalker.prev();
    } else if (message.json.x != undefined && message.json.y != undefined) {
        console.log("navigateToPoint");
        domWalker.navigateToPoint(message.json.x, message.json.y);
    } else {
        throw new Error("bad nav command");
    }
}

function activateHandler(message) {
    if (domWalker.activate())
        sendAsyncMessage("TalkToMe:Activated");
}

function currentBoundsHandler() {
    if (!domWalker || !domWalker.currentNode) return;

    let bounds = DOMWalker.accToRect(
        content.window.pageXOffset,
        content.window.pageYOffset,
        domWalker.currentNode,
        // TODO: must be a better way to know if we are local.
        (content.location == "about:home"));
    sendAsyncMessage("TalkToMe:ShowBounds", { bounds: bounds });
}
