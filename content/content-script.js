Components.utils.import("resource://talktome/content/utils.js");

try {
    Components.utils.import("resource://talktome/content/dom_walker.js");
} catch (e) {
    console.printException(e);
}

var Cc = Components.classes;
var Ci = Components.interfaces;

var domWalker = null;

console.log("content-script.js");

addEventListener('DOMContentLoaded', Callback(contentLoadedHandler));
addMessageListener("TalkToMe:Navigate", Callback(navigateHandler));
addMessageListener("TalkToMe:Activate", Callback(activateHandler));
addMessageListener("TalkToMe:CurrentBounds", Callback(currentBoundsHandler));

function contentLoadedHandler (e) {
    domWalker = new DOMWalker(content);
    domWalker.newNodeFunc = function (currentNode, reason) {
        console.log(reason);
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
    };
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
    domWalker.activate();
}

function currentBoundsHandler(message) {
    if (!domWalker || !domWalker.currentNode) return;

    let bounds = DOMWalker.accToRect(
        content.window.pageXOffset,
        content.window.pageYOffset,
        domWalker.currentNode,
        // TODO: must be a better way to know if we are local.
        (content.location == "about:home"));
    sendAsyncMessage("TalkToMe:ShowBounds", { bounds: bounds });
}
