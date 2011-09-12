var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
     getService(Components.interfaces.nsIConsoleService);

var console = {
    _consoleService: Components.classes["@mozilla.org/consoleservice;1"].
        getService(Components.interfaces.nsIConsoleService),
    _do_dump: Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch).
        getBoolPref("browser.dom.window.dump.enabled"),
    
    log: function (s) {
        if (this._do_dump)
            dump (String(s) + '\n');
        else
            this._consoleService.logStringMessage(String(s));
    },

    dumpObj: function (obj) {
        this.log(obj);
        for (var prop in obj) {
            this.log(" " + prop + ": " + String(obj[prop]));
        }
    }
}

var gAccRetrieval;

var Cc = Components.classes;
var Ci = Components.interfaces;

function init () {
    if (!gAccRetrieval) {
        gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
            .getService(Ci.nsIAccessibleRetrieval);
        console.log ("Inited " + gAccRetrieval);
    }
}

function accToString (acc) {
    if (!acc)
        return "[ null ]";

    var text;
    try {
        var textIface = acc.QueryInterface(Ci.nsIAccessibleText);
        text = "(" + textIface.getText(0, -1) + ")";
    } catch (e) {
        text = "";
    }
    return "[ " + acc.name + " | " + gAccRetrieval.getStringRole(acc.role) + " ]" +
        text;
}

function getAccessible (node) {
    return gAccRetrieval.getAccessibleFor(node).QueryInterface(Ci.nsIAccessible);
}

function printTree (acc, indent) {
    if (!indent)
        indent = 0;

    var padding = "";        
    for (var i=0;i<indent;i++) {
        padding += " ";
    }

    console.log(padding + accToString(acc));

    var child = acc.firstChild;
    while (child) {
        printTree(child, indent + 1)
        try {
            child = child.nextSibling;
        } catch (e) {
            break;
        }
    }
}

function DOMWalker(docRoot) {
    this.docRoot = docRoot;
    this.currentNode = null;
}

DOMWalker.prototype._isItemOfInterest = function (obj) {
    return (obj.role == Ci.nsIAccessibleRole.ROLE_LINK);
}

DOMWalker.prototype._searchSubtreeDepth = function (obj, pred) {
    if (!obj)
        return null;

    if (pred(obj))
        return obj;

    var child = obj.firstChild;
    while (child) {
        var ret = this._searchSubtreeDepth (child, pred);
        if (ret)
            return ret;

        try {
            child = child.nextSibling;
        } catch (e) {
            break;
        }
    }

    return null;
}

DOMWalker.prototype._getNextNode = function (node) {
    var nextNode = node;

    if (!nextNode)
        return null;

    while (!nextNode.nextSibling)  {
        nextNode = nextNode.parent;
        if (!nextNode)
            return null;
    }

    return nextNode.nextSibling;
}

DOMWalker.prototype.next = function () {
    var obj = null;
    var nextNode = this._getNextNode(this.currentNode);

    console.log ("currentNode: " + accToString(this.currentNode));

    while (nextNode) {
        console.log ("nextNode: " + accToString(nextNode));
        obj = this._searchSubtreeDepth(nextNode, this._isItemOfInterest);

        if (obj)
            break;

        nextNode = this._getNextNode(nextNode);
    }

    if (!obj) // Start from the start.
        obj = this._searchSubtreeDepth(this.docRoot, this._isItemOfInterest);

    console.log("next: "+ accToString(obj));

    this.currentNode = obj;
}

DOMWalker.prototype.prev = function () {
    console.log ("Previous item");
}

init ();

var domWalker = null;

addEventListener('keypress', function (e) {
    if (e.altKey) {
        switch (e.keyCode) {
        case e.DOM_VK_DOWN:
            console.log("---");
            domWalker.next();
            break;
        case e.DOM_VK_UP:
            domWalker.prev();
            break;
        default:
            break;
        }
    }
});

addEventListener('DOMContentLoaded', function (e) {
    console.log("loaded?");
    console.log(content.document.title);
    console.log(content.document.body instanceof Ci.nsIDOMNode);
    console.log(content.document.title);
    var docAcc = gAccRetrieval.getAccessibleFor(content.document)
        .QueryInterface(Ci.nsIAccessible);
    domWalker = new DOMWalker(docAcc);
    printTree(docAcc);
});

console.log("anything new??");