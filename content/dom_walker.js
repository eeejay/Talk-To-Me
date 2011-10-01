var EXPORTED_SYMBOLS = ["DOMWalker"];

Components.utils.import("resource://talktome/content/utils.js");
Components.utils.import("resource://talktome/content/console.js");

var Ci = Components.interfaces;

function DOMWalker(docRoot) {
    this.docRoot = docRoot;
    var docAcc = gAccRetrieval.getAccessibleFor(docRoot)
        .QueryInterface(Ci.nsIAccessible);

    // Be on the first relevant node.
    this.currentNode = this._searchSubtreeDepth(docAcc, this._isItemOfInterest);
}

DOMWalker.prototype._isItemOfInterest = function (obj) {
    return (obj.name && obj.name.trim() &&
            obj.role == Ci.nsIAccessibleRole.ROLE_TEXT_LEAF ||
            obj.role == Ci.nsIAccessibleRole.ROLE_GRAPHIC);
}

DOMWalker.prototype._searchSubtreeDepth = function (obj, pred, sibling) {
    if (!obj)
        return null;

    if (pred(obj))
        return obj;

    var child = obj.firstChild;
    if (sibling == "previousSibling")
        child = obj.lastChild;

    while (child) {
        var ret = this._searchSubtreeDepth (child, pred, sibling);
        if (ret)
            return ret;

        try {
            child = child[(sibling || "nextSibling")];
        } catch (e) {
            break;
        }
    }

    return null;
}

DOMWalker.prototype._nextNode = function (node, sibling) {
    var nextNode = node;

    while (nextNode)  {
        try {
            if (nextNode[sibling])
                return nextNode[sibling];
        } catch (e) {
        }

        nextNode = nextNode.parent;
    }

    return null;
}

DOMWalker.prototype.prev = function () {
    this._doWalk("previousSibling");
    console.log("prev: "+ accToString(this.currentNode));
}

DOMWalker.prototype.next = function () {
    this._doWalk("nextSibling");
    console.log("next: "+ accToString(this.currentNode));
}

DOMWalker.prototype._doWalk = function (sibling) {
    var obj = null;
    var nextNode = null;

    try {
        nextNode = this._nextNode(this.currentNode, sibling);
    } catch (e) {
        nextNode = gAccRetrieval.getAccessibleFor(this.docRoot)
            .QueryInterface(Ci.nsIAccessible);
    }

    while (nextNode) {
        obj = this._searchSubtreeDepth(nextNode, this._isItemOfInterest, sibling);

        if (obj)
            break;

        nextNode = this._nextNode(nextNode, sibling);
    }

    if (obj)
        this.currentNode = obj;
}
