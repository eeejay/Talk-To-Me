Components.utils.import("resource://gre/modules/ctypes.jsm")

var EXPORTED_SYMBOLS = ["console"];

var console = {
    _consoleService: Components.classes["@mozilla.org/consoleservice;1"].
        getService(Components.interfaces.nsIConsoleService),
    _do_dump: Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch).
        getBoolPref("browser.dom.window.dump.enabled"),
    _android_log: null,

    log: function (s) {
        if (this._android_log)
            this._android_log(3, "TalkToMe", String(s));
        else if (this._do_dump)
            dump (String(s) + '\n');
        else
            this._consoleService.logStringMessage(String(s));
    },

    _toString: function (obj) {
        if (obj === null) 
            return "null";
        else if (obj.call)
            return "[ function ]";
        else
            return String(obj);
    },

    dumpObj: function (obj, dump_const) {
        this.log(obj);
        for (var prop in obj) {
            if (prop.toUpperCase() == prop && !dump_const) // Probably a constant
                continue;
            this.log(" " + prop + ": " + this._toString(obj[prop]));
        }
    }
}

try {
    liblog=ctypes.open('liblog.so');
    console._android_log = liblog.declare("__android_log_write",
                                          ctypes.default_abi,
                                          ctypes.int32_t,
                                          ctypes.int32_t,
                                          ctypes.char.ptr,
                                          ctypes.char.ptr);
} catch (e) {
}
