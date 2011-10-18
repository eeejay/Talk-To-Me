const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

EXPORTED_SYMBOLS = ["AboutHandler"];

function AboutHandler() { }

AboutHandler.prototype = {
    newChannel : function(aURI) {
        if(!aURI.spec == "about:talktome") return;
        var channel = Services.io.newChannel("resource://talktome/doc/index.html",
                                             null, null);
        channel.originalURI = aURI;
        return channel;
    },
    getURIFlags: function(aURI) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT |
            Ci.nsIAboutModule.ALLOW_SCRIPT;
    },

    classDescription: "About TalkToMe",
    classID: Components.ID("8ce61eee-3516-4b1e-988a-ccc312a956a2"),
    contractID: "@mozilla.org/network/protocol/about;1?what=talktome",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule])
}

function AboutHandlerFactory () {}

AboutHandlerFactory.prototype = {
    createInstance: function createInstance () {
        return new AboutHandler ();
    },
    lockFactory: function lockFactory () {
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory])
}

var aboutHandlerFactory = new AboutHandlerFactory ();

AboutHandler.registerFactory = function () {
    dump("registering\n");
    let compman = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    compman.registerFactory(
        AboutHandler.prototype.classID, "AboutHandler",
        AboutHandler.prototype.contractID, aboutHandlerFactory);
};

AboutHandler.unregisterFactory = function () {
    let compman = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    compman.unregisterFactory(AboutHandler.prototype.classID,
                              aboutHandlerFactory);
};