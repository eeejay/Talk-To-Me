Components.utils.import("resource://talktome/content/console.js");

try {
    Components.utils.import("resource://talktome/content/dom_walker.js");
    Components.utils.import("resource://talktome/content/utils.js");
} catch (e) {
    console.printException(e);
}

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval;

var domWalker = null;

console.log("content-script.js");

addEventListener('DOMContentLoaded', function (e) {
    try {
        contentLoadedHandler (e);
    } catch (e) {
        console.printException(e);
    }
});

addMessageListener("TalkToMe:Navigate", function (message) {
    try {
        navigateHandler (message);
    } catch (e) {
        console.printException(e);
    }
});

addMessageListener("TalkToMe:Activate", function (message) {
    try {
        activateHandler (message);
    } catch (e) {
        console.printException(e);
    }
});

function contentLoadedHandler (e) {
    domWalker = new DOMWalker(content);
    domWalker.newNodeFunc = function (currentNode, reason) {
        console.log(reason);
        if (reason == "atpoint")
            sendAsyncMessage("TalkToMe:Tick");
        sendAsyncMessage("TalkToMe:Speak",
                         { phrase: accToPhrase(currentNode),
                           bounds: accToRect(
                               content.window.pageXOffset,
                               content.window.pageYOffset,
                               currentNode,
                               // TODO: must be a better way to know if we are local.
                               (content.location == "about:home")) 
                         });
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
        domWalker.navigateToPoint(message.json.x, message.json.y);
    } else {
        throw "bad nav command"
    }
}

function activateHandler(message) {
    domWalker.activate();
}