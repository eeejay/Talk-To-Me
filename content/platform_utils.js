const Ci = Components.interfaces;
const Cu = Components.utils;
const Cc = Components.classes;

Cu.import("resource://gre/modules/NetUtil.jsm");  
Cu.import("resource://gre/modules/FileUtils.jsm");  
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://talktome/content/console.js");
Cu.import("resource://talktome/content/closure_utils.js");

EXPORTED_SYMBOLS = ["PlatformUtils"]

var PlatformUtils = {
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