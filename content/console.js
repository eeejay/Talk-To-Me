Components.utils.import("resource://gre/modules/ctypes.jsm")

var EXPORTED_SYMBOLS = ["console"];

function Console() {
    this._consoleService = Components.classes["@mozilla.org/consoleservice;1"].
        getService(Components.interfaces.nsIConsoleService);

    this._prefs =  Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch)
        .QueryInterface(Components.interfaces.nsIPrefBranch2);

    this._do_dump = this._prefs.getBoolPref("browser.dom.window.dump.enabled");

    try {
        let liblog=ctypes.open('liblog.so');
        this._android_log = liblog.declare("__android_log_write",
                                           ctypes.default_abi,
                                           ctypes.int32_t,
                                           ctypes.int32_t,
                                           ctypes.char.ptr,
                                           ctypes.char.ptr);
    } catch (e) {
    }

    this._prefs.addObserver("", this, false);
}

Console.prototype.observe = function(aSubject, aTopic, aData) {  
    if(aTopic != "nsPref:changed" || aData != "browser.dom.window.dump.enabled")
        return;  

    this._do_dump = this._prefs.getBoolPref("browser.dom.window.dump.enabled");
}  

Console.prototype.log = function (s) {
    if (this._android_log)
        this._android_log(3, "TalkToMe", String(s));
    else if (this._do_dump)
        dump (String(s) + '\n');
    else
        this._consoleService.logStringMessage(String(s));
}

Console.prototype._toString = function (obj) {
    if (obj === null) 
        return "null";
    else if (obj.call)
        return "[ function ]";
    else
        return String(obj);
}

Console.prototype.dumpDOM = function (obj, indent) {
    let _indent = indent || 0;
    let _padding = "";   
    for (let i=0;i<_indent;i++) {
        _padding += " ";
    }
    this.log(_padding + obj + " " + obj.nodeName + " " + obj.id);
    for (let i=0;i<obj.childNodes.length;i++) {
        this.dumpDOM(obj.childNodes[i], _indent + 1);
    }
}

Console.prototype.dumpObj = function (obj, dump_const, ommit_empty) {
    this.log(obj);
    for (var prop in obj) {
        if (prop.toUpperCase() == prop && !dump_const) // Probably a constant
            continue;
        if ((obj[prop] == "" || obj[prop] == null) && ommit_empty)
            continue;
        this.log(" " + prop + ": " + this._toString(obj[prop]));
    }
}

Console.prototype.printException = function (exc) {
    if (exc.message) {
        this.log ("Exception: " + exc.message);
        this.log (exc.filename + ":" + exc.lineNumber + ":" + exc.columnNumber);
    } else {
        this.log ("Exception: " + exc);
    }
}

var console = new Console();
