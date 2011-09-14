Components.utils.import("resource://talktome/content/dom_walker.js");
Components.utils.import("resource://talktome/content/console.js");
Components.utils.import("resource://talktome/content/utils.js");

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval;

var domWalker = null;

console.log("content-script.js");

addEventListener('keypress', function (e) {
    if (e.altKey) {
        switch (e.keyCode) {
        case e.DOM_VK_DOWN:
            console.log("---");
            domWalker.next();
            sendAsyncMessage("TalkToMe:Speak",
                             { phrase: accToPhrase(domWalker.currentNode) });
            break;
        case e.DOM_VK_UP:
            console.log("---");
            domWalker.prev();
            sendAsyncMessage("TalkToMe:Speak",
                             { phrase: accToPhrase(domWalker.currentNode) });
            break;
        default:
            break;
        }
    }
});

addEventListener('DOMContentLoaded', function (e) {
    console.log(content.document.title);
    console.log(content.document.body instanceof Ci.nsIDOMNode);
    console.log(content.document.title);
    var docAcc = gAccRetrieval.getAccessibleFor(content.document)
        .QueryInterface(Ci.nsIAccessible);
    domWalker = new DOMWalker(docAcc);
    printTree(docAcc);
});

addMessageListener("TalkToMe:Navigate", function (message) {
    if (message.json.direction == "next")
        domWalker.next();
    else if (message.json.direction == "prev")
        domWalker.prev();
    else
        return;

    sendAsyncMessage("TalkToMe:Speak",
                     { phrase: accToPhrase(domWalker.currentNode) });
        
});