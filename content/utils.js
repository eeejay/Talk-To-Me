const Ci = Components.interfaces;
const Cu = Components.utils;
const Cc = Components.classes;

Cu.import("resource://gre/modules/ctypes.jsm")
Cu.import("resource://gre/modules/NetUtil.jsm");  
Cu.import("resource://gre/modules/FileUtils.jsm");  
Cu.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = ["console", "PlatformUtils", "Callback", "StringBundle"];

// Console

function Console() {
    this._consoleService = Cc["@mozilla.org/consoleservice;1"].
        getService(Ci.nsIConsoleService);

    this._prefs =  Cc["@mozilla.org/preferences-service;1"].
        getService(Ci.nsIPrefBranch).QueryInterface(Ci.nsIPrefBranch2);

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
    props = [];
    for (let prop in obj) {
        props.push(prop);
    }
    for (let i in props.sort()) {
        let prop = props[i];
        if (prop.toUpperCase() == prop && !dump_const) // Probably a constant
            continue;
        try {
            if ((obj[prop] == "" || obj[prop] == null) && ommit_empty)
                continue;
            this.log(" " + prop + ": " + this._toString(obj[prop]));
        } catch (e) {
            this.log(" " + prop + ": " + e);
        }
    }
}

Console.prototype.dumpArgs = function (args) {
    console.log(args.callee.name);
    for (let i = 0; args.length > i; i++)
        console.log(" " + this._toString(args[i]));
}

Console.prototype.printException = function (exc) {
    if (exc.message)
        this.log ("Error: " + exc.message);
    else
        this.log ("Error: " + exc);

    if (exc.fileName) {
        let filename = exc.fileName.split(' -> ');
        this.log (" " + filename[filename.length - 1] + ":" + exc.lineNumber);
    } else if (exc.filename) {
        this.log (" " + exc.filename + ":" + exc.lineNumber);
    }
}

Console.prototype.warning = function (s) {
    this.log ("Warning::" +  arguments.callee.caller.name + ": " + s);
}

var console = new Console();

// Platform utils

var PlatformUtils = {
    resolveResourceURI: function (aResourceURI) {
        let resource = Services.io.getProtocolHandler("resource").
            QueryInterface(Ci.nsIResProtocolHandler);
        let uri = Services.io.newURI(aResourceURI, null, null);
        return resource.resolveURI(uri);
    },
    getAppDir: function (name) {
        Cu.import("resource://talktome/content/android_api.js");
        let _jfile = JavaEnvironment.getAppContext().getDir(name, 1);
        let jfile = new JavaObject ();
        jfile.fromInstanceInit(
            _jfile,
            {methods: {getAbsolutePath: "()Ljava/lang/String;"}});
        var file = Components.classes["@mozilla.org/file/local;1"].  
            createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(jfile.getAbsolutePath ());
        return file;
    },
    pathIsWorldReadable: function (path) {
        let readable = true;
        let _path = path.clone();
        while (_path) {
            readable &= (_path.permissions & 1)
            _path = _path.parent;
        }
        return readable;
    },
    asyncFilesCopy: function (files, newDir, callback) {
        let filesNum = files.length;
        for (let i in files) {
            NetUtil.asyncFetch(
                files[i], 
                Callback(function (inputStream, status, channel, file) {
                    if (!Components.isSuccessCode(status)) {
                        throw new Error("asyncFileCopy error: " + status);
                    }
                    let dest = newDir.clone();
                    dest.append(file.leafName);
                    var output = FileUtils.openSafeFileOutputStream(dest);
                    NetUtil.asyncCopy(
                        inputStream, output,
                        Callback(function (status) {
                            if (!Components.isSuccessCode(status))
                                throw new Error("Error copying " + file.leafName +
                                                " to " + newDir.path + ": " +
                                                status);
                            else
                                console.log("Copied " + file.leafName +
                                            " to " + newDir.path);

                            if (--filesNum <= 0 && callback)
                                callback ();
                        }, this));
                }, this, files[i]));
        }
    },
    isAndroid: function () {
        let osString = Components.classes["@mozilla.org/xre/app-info;1"]  
            .getService(Components.interfaces.nsIXULRuntime).OS;
        return (osString == "Android");
    }
};

// Callback closure


function Callback (func, self) {
    if (!func)
        throw new Error("Callback function is not defined! " + self);
    let extra_args = Array.prototype.slice.call(arguments, 2);
    return function () {
        try {
            let args = Array.prototype.slice.call(arguments);
            args.push.apply(args, extra_args);
            func.apply(self || this, args);
        } catch (e) {
            console.printException(e, func.name);
        }
    };
}

// Localization

function StringBundle () {
    let locale = Cc["@mozilla.org/chrome/chrome-registry;1"]
        .getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global");

    let locales = [locale, locale.split('-')[0]];

    for (let i in locales) {
        let uri = Services.io.newURI(
            "resource://talktome/locale/" + locales[i] + "/talktome.properties",
            null, null);
        let file = uri.QueryInterface(Components.interfaces.nsIFileURL).file;

        console.log(file.path);

        if (file.exists()) {
            this._bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService)  
                .createBundle(uri.spec); 
            return;
        }
    }

    throw new Error("No strings for locale '" +
                    locale + 
                    "', and no fallback found");
}

StringBundle.prototype.getStr = function (msg, args) {
    // from https://developer.mozilla.org/en/Code_snippets/Miscellaneous#Using_string_bundles_from_JavaScript
    if (args){
        args = Array.prototype.slice.call(arguments, 1);
        return this._bundle.formatStringFromName(msg,args,args.length);
    } else {
        return this._bundle.GetStringFromName(msg);
    }
}