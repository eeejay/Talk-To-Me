var EXPORTED_SYMBOLS = ["gAccRetrieval", "accToString", "getAccessible", "printTree",
                        "accToPhrase", "accToRect"];

Components.utils.import("resource://talktome/content/console.js");

var Cc = Components.classes;
var Ci = Components.interfaces;

var gAccRetrieval = Cc["@mozilla.org/accessibleRetrieval;1"]
    .getService(Ci.nsIAccessibleRetrieval);

var _interestingRoles = [Ci.nsIAccessibleRole.ROLE_PUSHBUTTON,
                         Ci.nsIAccessibleRole.ROLE_GRAPHIC,
                         Ci.nsIAccessibleRole.ROLE_LINK];

function accToRect (offsetx, offsety, acc) {
    if (!acc) // Bady bad
        return {x: 0, y: 0, w: 0, h: 0};

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

    let accOfInterest = acc;
    let phrase = acc.name;

    while (accOfInterest) {
        if (_interestingRoles.indexOf(accOfInterest.role) >= 0)
            break;
        accOfInterest = accOfInterest.parent;
    }

    if (accOfInterest)
        phrase += " " + gAccRetrieval.getStringRole(accOfInterest.role);

    return phrase;
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
