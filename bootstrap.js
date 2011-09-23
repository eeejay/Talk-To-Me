const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/Services.jsm");

var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader);

var tts = null;

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
    let _globals = {window: aWindow, tts: tts};
    loader.loadSubScript("resource://talktome/content/main.js", _globals);
}

function startup (data, reason) {
    dump ("started! " + data.id.substring(0, data.id.indexOf('@')) + "\n");

    let resource = Services.io.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);

    let alias = Services.io.newFileURI(data.installPath);
    resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), alias);

    try {
        Cu.import("resource://talktome/content/speech.js");
        tts = new TextToSpeech();
    } catch (e) {
        dump ("FAILED TO LOAD TTS: " + e + "\n");
    }


    // Load into any existing windows
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext();
        loadIntoWindow(win);
    }

    // Load into any new windows
    Services.wm.addListener(windowListener);
}

function install (data, reason) { }

function shutdown (data, reason) {
    tts.shutdown();
    if (aReason == APP_SHUTDOWN) return;

    let resource = Services.io.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);
    resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), null);
}