const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/Services.jsm");

var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader);

var tts = null;

var externalMediaPath = null;

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
    aWindow.tts = tts;
    let _globals = {window: aWindow};
    loader.loadSubScript("resource://talktome/content/main.js", _globals);
}

function initialize_tts (newInstall, installPath) {
    console.log("initialize_tts");
    Cu.import("resource://talktome/content/platform_utils.js");
    Cu.import("resource://talktome/content/speech.js");

    let mediaPath = installPath.clone();
    mediaPath.append('media');
    
    if (PlatformUtils.isAndroid() &&
        !PlatformUtils.pathIsWorldReadable(mediaPath)) {
        /* Due to the security model on android, the extension is not
           world-readable, so the tts service cannot load the earcon files.
           We need to copy them to a readable location. */
        let mediaFiles = mediaPath.directoryEntries;
        mediaPath = PlatformUtils.getAppDir("TalkToMe_media");
        externalMediaPath = mediaPath.clone();
        if (newInstall) {
            // Install media files.
            let _files = [];
            while (mediaFiles.hasMoreElements())
                _files.push(mediaFiles.getNext().
                            QueryInterface(Components.interfaces.nsILocalFile));
            PlatformUtils.asyncFilesCopy (
                _files, mediaPath,
                function () {
                    tts = new TextToSpeech(mediaPath, true);
                });
        } else {
            tts = new TextToSpeech(mediaPath, true);
        }
    } else {
        tts = new TextToSpeech(mediaPath, PlatformUtils.isAndroid());
    }
}

function startup (data, reason) {
    dump ("started! " + data.id.substring(0, data.id.indexOf('@')) + "\n");
    let resource = Services.io.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);

    let alias = Services.io.newFileURI(data.installPath);
    resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), alias);

    Cu.import("resource://talktome/content/console.js");
    
    try {
        initialize_tts ((reason == ADDON_INSTALL ||
                         reason == ADDON_UPGRADE ||
                         reason == ADDON_DOWNGRADE), data.installPath);
    } catch (e) {
        console.printException (e);
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

    try {
        let resource = Services.io.getProtocolHandler("resource").
            QueryInterface(Ci.nsIResProtocolHandler);
        resource.setSubstitution(data.id.substring(0, data.id.indexOf('@')), null);
        if (reason != APP_SHUTDOWN || reason != ADDON_DISABLE) {
            console.log("Uninstalling");
            if (PlatformUtils.isAndroid() && externalMediaPath) {
                console.log("Removing " + externalMediaPath.path);
                externalMediaPath.remove(true);
            }
        }
    } catch (e) {
        console.printException(e);
    }
}
