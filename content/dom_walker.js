var EXPORTED_SYMBOLS = ["DOMWalker"];

Components.utils.import("resource://talktome/content/accessible_utils.js");
Components.utils.import("resource://talktome/content/console.js");

var Ci = Components.interfaces;

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
    function getDocRootClosure (self, onLoadFunc) {
        return function () {
            try {
                let docRoot = getAccessible(self.content.document);

                let state = {};
                docRoot.getState(state, {});
                if (state.value & STATE_BUSY)
                    return self.getDocRoot (onLoadFunc); // Try again
                
                self.docRoot = docRoot;
                self.currentNode = self._searchSubtreeDepth(
                    self.docRoot, self._isItemOfInterest);

                // printTree (self.docRoot);
                
                if (onLoadFunc)
                    onLoadFunc(self.currentNode, "onload");
            } catch (e) {
                console.printException(e);
            }
        };
    }

    this.content.setTimeout (getDocRootClosure (this, onLoadFunc), 0);
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
        this.getDocRoot(function (self) {
            return function (currentNode) {self._doWalk(sibling);};
        } (this));
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
        console.log(accToString(node) + " " + actionName);
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
