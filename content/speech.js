var EXPORTED_SYMBOLS=["TextToSpeech"];

Components.utils.import("resource://gre/modules/ctypes.jsm")
Components.utils.import("resource://talktome/content/console.js");

var using_android = true;

try {
    Components.utils.import("resource://talktome/content/android_api.js");
} catch (e) {
    console.log("Error loading android_api.js: " + e);
    using_android = false;
}

function TextToSpeech() {
    if (using_android)
        this.android_tts = this._get_android_tts();
}

TextToSpeech.prototype._get_android_tts = function () {
    this.jenv = new JavaEnvironment();

    this.jenv.pushFrame();

    let tts = this.jenv.getClass(
        "android/speech/tts/TextToSpeech",
        {constructor: "(Landroid/content/Context;Landroid/speech/tts/TextToSpeech$OnInitListener;)V",
         methods: {
             speak: "(Ljava/lang/String;ILjava/util/HashMap;)I",
             setPitch: "(F)I",
             shutdown: "()V"
         }
        }
    );

    let app = this.jenv.getClass("org/mozilla/gecko/GeckoApp", {});

    let fid = this.jenv.GetStaticFieldID(app.jcls, "mAppContext",
                                         "Lorg/mozilla/gecko/GeckoApp;");

    let ctx = this.jenv.GetStaticObjectField(app.jcls, fid);

    let android_tts = tts.newObject(ctx, new ctypes.voidptr_t(0));

    this.jenv.popFrame(android_tts.jobj);

    return android_tts;
}

TextToSpeech.prototype.speak = function (s, queue) {
    let _queue = queue || TextToSpeech.QUEUE_FLUSH;
    console.log("SPEAK: " + s + " queue: " + _queue);
    if (this.android_tts) {
        let ret = this.android_tts.speak(s, 0, 0);
        console.log(ret);
        return (ret == 0);
    }

    return true;
}

TextToSpeech.prototype.setPitch = function (f) {
    console.log("setPitch: " + f);
    if (this.android_tts) {
        let ret = this.android_tts.setPitch(f);
        return (ret == 0);
    }

    return true;
}

TextToSpeech.prototype.shutdown = function () {
    console.log("shutdown");

    if (this.android_tts)
        this.android_tts.shutdown();
}

TextToSpeech.QUEUE_FLUSH = 0;
TextToSpeech.QUEUE_ADD = 1;
