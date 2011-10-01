Components.utils.import("resource://talktome/content/dom_walker.js");
Components.utils.import("resource://talktome/content/console.js");
Components.utils.import("resource://talktome/content/utils.js");

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

function contentLoadedHandler (e) {
    domWalker = new DOMWalker(
        content,
        function (currentNode) {
    sendAsyncMessage("TalkToMe:Speak",
                     { phrase: accToPhrase(currentNode),
                       bounds: accToRect(
                           content.window.pageXOffset,
                           content.window.pageYOffset,
                           currentNode,
                           // TODO: must be a better way to know if we are local.
                           (content.location == "about:home")) 
                     });
        });
}

function navigateHandler(message) {
    if (message.json.direction == "next")
        domWalker.next();
    else if (message.json.direction == "prev")
        domWalker.prev();
    else
        throw "bad nav direction: " + message.json.direction;
}