var EXPORTED_SYMBOLS = ["DOMWalker"];

Components.utils.import("resource://talktome/content/utils.js");

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

const STATE_BUSY = Ci.nsIAccessibleStates.STATE_BUSY;
const STATE_CHECKED = Ci.nsIAccessibleStates.STATE_CHECKED;

function DOMWalker(content, newNodeFunc) {
    this.newNodeFunc = newNodeFunc;
    this.content = content;
    this.docRoot = null;
    this.currentNode = null;
    this.isContentProcess =
        (Cc["@mozilla.org/xre/app-info;1"]
         .getService(Ci.nsIXULRuntime).processType == 2);
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

    if (obj)
        this.currentNode = obj;

    if (this.newNodeFunc)
        this.newNodeFunc(obj, "walked");
}

DOMWalker.prototype.activate = function (node) {
    node = node || this.currentNode;

    // Not fantastic, but works for now.
    // TODO: Either integrate it with the visual interface, or at least
    // treat ROLE_COMBOBOX as an atomic item until the user activates it, and then
    // iterate through the options.
    if (node.role == Ci.nsIAccessibleRole.ROLE_COMBOBOX_OPTION) {
        node.takeSelection();
        return true;
    }

    for (let i=0;i<node.numActions;i++) {
        let actionName = node.getActionName(i);
        console.log(DOMWalker.accToString(node) + " " + actionName);
        if (actionName == "jump" ||
            actionName == "press" ||
            actionName == "click" ||
            actionName == "activate" ||
            actionName == "check" ||
            actionName == "uncheck" ||
            actionName == "select") {
            node.doAction (i);
            return true;
        }
    }

    if (node.parent)
        return this.activate(node.parent);
    else
        return false;
}

DOMWalker.prototype.navigateToPoint = function (x, y) {
    if (!this.docRoot) return;

    if (!this.isContentProcess) {
        let docBounds = DOMWalker.getBounds(this.docRoot);

        x += docBounds.x;
        y += docBounds.y;
    }

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

DOMWalker.prototype.nodeRect = function nodeRect (acc) {
    acc = acc || this.currentNode;

    if (!acc) // Bady bad
        return {top: 0, bottom: 0, left: 0, right: 0};

    let offsetX = this.content.window.pageXOffset;
    let offsetY = this.content.window.pageYOffset;

    if (!this.isContentProcess) {
        let docBounds = DOMWalker.getBounds(this.docRoot);

        offsetX -= docBounds.x;
        offsetY -= docBounds.y;
    }

    let bounds = DOMWalker.getBounds(acc);

    return {left: bounds.x + offsetX,
            top: bounds.y + offsetY,
            right: bounds.x + bounds.w + offsetX,
            bottom: bounds.y + bounds.h + offsetY};
};

// Static utility methods

DOMWalker.accToPhrase = function accToPhrase (acc) {
    if (!acc) // Grave error
        return "";

    let phrase = [];

    if (acc.name)
        phrase.push(acc.name);

    if (acc.role != Ci.nsIAccessibleRole.ROLE_TEXT_LEAF)
        phrase.push(gAccRetrieval.getStringRole(acc.role));

    let state = {};
    acc.getState(state, {});

    if (state.value & STATE_CHECKED)
        phrase.push("checked");

    return phrase.join(" ");
};

DOMWalker.accToString = function accToString (acc) {
    if (!acc)
        return "[ null ]";

    var text;
    try {
        var textIface = acc.QueryInterface(Ci.nsIAccessibleText);
        text = " (" + textIface.getText(0, -1) + ")";
    } catch (e) {
        text = "";
    }

    let state = {};
    let ext_state = {};
    acc.getState(state, ext_state);

    let _states = gAccRetrieval.getStringStates(state.value, ext_state.value);
    let states = [];
    

    let bounds = DOMWalker.getBounds(acc);
    
    let boundString = " (" + bounds.x + ", " + bounds.y +
        ", " + bounds.w + ", " + bounds.h + ")";

    for (let i=0;i<_states.length;i++)
        states.push(_states.item(i));

    return "[ " + acc.name + " | " + gAccRetrieval.getStringRole(acc.role) +
        " ] " + states + text + boundString;
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

    console.log(padding + DOMWalker.accToString(acc));

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

DOMWalker.getBounds = function getBounds (acc) {
    let x = {}, y = {}, w = {}, h = {};

    try {
        acc.getBounds(x, y, w, h);
    } catch (e) {
        x.value = y.value = w.value = h.value = 0;
    }

    return {x: x.value, y: y.value, w: w.value, h: h.value};
};