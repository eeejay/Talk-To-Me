var EXPORTED_SYMBOLS=["TextToSpeech"];

Components.utils.import("resource://gre/modules/ctypes.jsm")
Components.utils.import("resource://talktome/content/console.js");

var using_android = true;

try {
    Components.utils.import("resource://talktome/content/android_api.js");
} catch (e) {
    using_android = false;
}

function TextToSpeech() {
    if (using_android)
        this._init_android();
}

TextToSpeech.prototype._init_android = function() {
    this.jenv = new JavaEnvironment();

    let tts = this.jenv.getClass("android/speech/tts/TextToSpeech",
                                  {constructor: "(Landroid/content/Context;Landroid/speech/tts/TextToSpeech$OnInitListener;)V",
                                   methods: {speak: "(Ljava/lang/String;ILjava/util/HashMap;)I"}});

    let app = this.jenv.getClass("org/mozilla/gecko/GeckoApp", {});

    let fid = this.jenv.GetStaticFieldID(app.jcls, "mAppContext",
                                         "Lorg/mozilla/gecko/GeckoApp;");

    let ctx = this.jenv.GetStaticObjectField(app.jcls, fid);

    this.jtts = tts.newObject(ctx, new ctypes.voidptr_t(0));
}

TextToSpeech.prototype.speak = function (s) {
    console.log("SPEAK: " + s);
    if (this.jtts) {
        let ret = this.jtts.speak(s, 0, 0);
        if (ret != 0)
            throw "Error in TextToSpeech.speak";
    }
}