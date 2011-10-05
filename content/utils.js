var EXPORTED_SYMBOLS = ["gAccRetrieval", "accToString", "getAccessible", "printTree",
                        "accToPhrase", "accToRect"];

Components.utils.import("resource://talktome/content/console.js");

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

function accToRect (offsetx, offsety, acc, islocal) {
    if (!acc) // Bady bad
        return {x: 0, y: 0, w: 0, h: 0};

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
    acc.getBounds(x, y, w, h);
    return {left: x.value + offsetx,
            top: y.value + offsety,
            right: x.value + w.value + offsetx,
            bottom: y.value + h.value + offsety};
}

function accToPhrase (acc) {
    if (!acc) // Grave error
        return "";

    let phrase = [];

    if (acc.name)
        phrase.push(acc.name);

    if (acc.role != Ci.nsIAccessibleRole.ROLE_TEXT_LEAF)
        phrase.push(gAccRetrieval.getStringRole(acc.role));

    return phrase.join(" ");
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
        padding += ".";
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
