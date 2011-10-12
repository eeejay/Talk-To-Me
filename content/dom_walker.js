var EXPORTED_SYMBOLS = ["DOMWalker"];

Components.utils.import("resource://talktome/content/utils.js");

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

const STATE_BUSY = Ci.nsIAccessibleStates.STATE_BUSY;

function DOMWalker(content, newNodeFunc) {
    this.newNodeFunc = newNodeFunc;
    this.content = content;
    this.docRoot = null;
    this.currentNode = null;
}

// borrowed from a11y mochitests.
DOMWalker.prototype.getDocRoot = function(onLoadFunc) {
    onLoadFunc = onLoadFunc || this.newNodeFunc;
    function getDocRootInner() {
        let docRoot = DOMWalker.getAccessible(this.content.document);
        
        let state = {};
        docRoot.getState(state, {});
        if (state.value & STATE_BUSY)
            return this.getDocRoot (onLoadFunc); // Try again
        
        this.docRoot = docRoot;
        this.currentNode = this._searchSubtreeDepth(
            this.docRoot, this._isItemOfInterest);
        
        // DOMWalker.printTree (this.docRoot);
        
        if (onLoadFunc)
            onLoadFunc(this.currentNode, "onload");
    }
    this.content.setTimeout (Callback(getDocRootInner, this), 0);
};


DOMWalker.prototype._isItemOfInterest = function (obj) {
    return ((obj.name && obj.name.trim() &&
             obj.role == Ci.nsIAccessibleRole.ROLE_TEXT_LEAF) ||
            obj.role == Ci.nsIAccessibleRole.ROLE_LINK ||
            obj.role == Ci.nsIAccessibleRole.ROLE_GRAPHIC ||
            obj.role == Ci.nsIAccessibleRole.ROLE_ENTRY ||
            obj.role == Ci.nsIAccessibleRole.ROLE_CHECKBUTTON ||
            obj.role == Ci.nsIAccessibleRole.ROLE_RADIOBUTTON ||
            obj.role == Ci.nsIAccessibleRole.ROLE_COMBOBOX_OPTION);
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
    console.log("prev: "+ DOMWalker.accToString(this.currentNode));
}

DOMWalker.prototype.next = function () {
    this._doWalk("nextSibling");
    console.log("next: "+ DOMWalker.accToString(this.currentNode));
}

DOMWalker.prototype._doWalk = function (sibling) {
    var obj = null;
    var nextNode = null;

    try {
        nextNode = this._nextNode(this.currentNode, sibling);
    } catch (e) {
        this.getDocRoot(
            Callback(function (currentNode) {this._doWalk(sibling);}, this));
        return;
    }

    while (nextNode) {
        obj = this._searchSubtreeDepth(nextNode, this._isItemOfInterest, sibling);

        if (obj)
            break;

        nextNode = this._nextNode(nextNode, sibling);
    }

    if (obj) {
        this.currentNode = obj;
        if (this.newNodeFunc)
            this.newNodeFunc(this.currentNode, "walked");
    } else {
        console.warning("No new node.");
    }
}

DOMWalker.prototype.activate = function (node) {
    node = node || this.currentNode;

    // Not fantastic, but works for now.
    // TODO: Either integrate it with the visual interface, or at least
    // treat ROLE_COMBOBOX as an atomic item until the user activates it, and then
    // iterate through the options.
    if (node.role == Ci.nsIAccessibleRole.ROLE_COMBOBOX_OPTION) {
        node.takeSelection();
        return;
    }

    for (let i=0;i<node.numActions;i++) {
        let actionName = node.getActionName(i);
        console.log(DOMWalker.accToString(node) + " " + actionName);
        if (actionName == "jump" ||
            actionName == "press" ||
            actionName == "click" ||
            actionName == "activate" ||
            actionName == "check" ||
            actionName == "uncheck") {
            node.doAction (i);
            return;
        }
    }

    if (node.parent)
        this.activate(node.parent);
}

DOMWalker.prototype.navigateToPoint = function (x, y) {
    if (!this.docRoot) return;

    let child = this.docRoot.getChildAtPoint(x, y);

    while (child) {
        if (this._isItemOfInterest (child) ||
            // TODO: remove comb box special case
            child.role == Ci.nsIAccessibleRole.ROLE_COMBOBOX) { 
            if (child != this.currentNode) {
                this.currentNode = child;
                if (this.newNodeFunc)
                    this.newNodeFunc(this.currentNode, "atpoint");
            }
            return;
        }
        let _child = child.getChildAtPoint(x, y);

        if (_child === child)
            break;

        child = _child;
    }
};

// Static utility methods

DOMWalker.accToRect = function accToRect (offsetx, offsety, acc, islocal) {
    if (!acc) // Bady bad
        return {top: 0, bottom: 0, left: 0, right: 0};

    if (islocal) {
        acc.QueryInterface(Ci.nsIAccessNode);
        let node = acc.DOMNode;

        if (!node.getBoundingClientRect)
            node = node.parentNode;

        let rv = node.getBoundingClientRect();
        
        return {top: rv.top,
                left: rv.left,
                bottom: rv.bottom,
                right: rv.right};
    }

    let x = {}, y = {}, w = {}, h = {};
    try {
        acc.getBounds(x, y, w, h);
    } catch (e) {
        x.value = y.value = w.value = h.value = 0;
    }
    return {left: x.value + offsetx,
            top: y.value + offsety,
            right: x.value + w.value + offsetx,
            bottom: y.value + h.value + offsety};
};

DOMWalker.accToPhrase = function accToPhrase (acc) {
    if (!acc) // Grave error
        return "";

    let phrase = [];

    if (acc.name)
        phrase.push(acc.name);

    if (acc.role != Ci.nsIAccessibleRole.ROLE_TEXT_LEAF)
        phrase.push(gAccRetrieval.getStringRole(acc.role));

    return phrase.join(" ");
};

DOMWalker.accToString = function accToString (acc) {
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
};

DOMWalker.getAccessible = function getAccessible (node) {
    return gAccRetrieval.getAccessibleFor(node).QueryInterface(Ci.nsIAccessible);
};


DOMWalker.printTree = function printTree (acc, indent) {
    if (!indent)
        indent = 0;

    var padding = "";   
    for (var i=0;i<indent;i++) {
        padding += ".";
    }

    console.log(padding + accToString(acc));

    var child = acc.firstChild;
    while (child) {
        DOMWalker.printTree(child, indent + 1)
        try {
            child = child.nextSibling;
        } catch (e) {
            break;
        }
    }
};