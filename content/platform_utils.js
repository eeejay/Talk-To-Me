const Ci = Components.interfaces;
const Cu = Components.utils;
const Cc = Components.classes;

Cu.import("resource://gre/modules/NetUtil.jsm");  
Cu.import("resource://gre/modules/FileUtils.jsm");  
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://talktome/content/console.js");

EXPORTED_SYMBOLS = ["PlatformUtils"]

var PlatformUtils = {
    isAndroid: function () {
        let osString = Components.classes["@mozilla.org/xre/app-info;1"]  
            .getService(Components.interfaces.nsIXULRuntime).OS;
        return (osString == "Android");
    }
};