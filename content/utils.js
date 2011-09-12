var EXPORTED_SYMBOLS = ["gAccRetrieval", "accToString", "getAccessible", "printTree"];

Components.utils.import("resource://talktome/content/console.js");

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

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

