const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader);

/* From http://starkravingfinkle.org/blog/2011/01/bootstrap-jones-adventures-in-restartless-add-ons/ */

var windowListener = {
  onOpenWindow: function(aWindow) {
      let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
      loadIntoWindow(domWindow);
  },
  onCloseWindow: function(aWindow) { },
  onWindowTitleChange: function(aWindow, aTitle) { }
};

function loadIntoWindow (aWindow) {
    let _globals = {window: aWindow};
    loader.loadSubScript("resource://talktome/content/main.js", _globals);
}

function startup (data, reason) {
    dump ("started! " + data.id.substring(0, data.id.indexOf('@')) + "\n");

    let ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
    let resource = ios.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);

    let alias = ios.newFileURI(data.installPath);
    resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), alias);

    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);

    // Load into any existing windows
    let enumerator = wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
        loadIntoWindow(win);
    }

    // Load into any new windows
    wm.addListener(windowListener);
}

function install (data, reason) { }

function shutdown (data, reason) {
    if (aReason == APP_SHUTDOWN) return;

    let ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
    let resource = ios.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);
    resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), null);
}