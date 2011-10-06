var EXPORTED_SYMBOLS=["TextToSpeech"];

const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/ctypes.jsm")
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://talktome/content/console.js");

var using_android = true;

try {
    Cu.import("resource://talktome/content/android_api.js");
} catch (e) {
    console.log("Error loading android_api.js");
    console.printException(e);
    using_android = false;
}

function TextToSpeech() {
    if (using_android)
        this.android_tts = this._get_android_tts();
    
    this._registered_earcons = false;
}

TextToSpeech.prototype._register_earcons = function () {
    let resource = Services.io.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);
    let uri = Services.io.newURI("resource://talktome/media/tick.wav",
                                 null, null);
    let tick_path = resource.resolveURI(uri);

    let rv = this.android_tts.addEarcon("[tick]", tick_path);

    console.log ("Register earcons: " + ((rv == 0) ? "success" : "fail"));
}

TextToSpeech.prototype._get_android_tts = function () {
    this.jenv = new JavaEnvironment();

    this.jenv.pushFrame();

    let tts = this.jenv.getClass(
        "android/speech/tts/TextToSpeech",
        {constructor: "(Landroid/content/Context;Landroid/speech/tts/TextToSpeech$OnInitListener;)V",
         methods: {
             speak: "(Ljava/lang/String;ILjava/util/HashMap;)I",
             addEarcon: "(Ljava/lang/String;Ljava/lang/String;)I",
             playEarcon: "(Ljava/lang/String;ILjava/util/HashMap;)I",
             setPitch: "(F)I",
             shutdown: "()V"
         }
        }
    );

    let android_tts = tts.newObject(this.jenv.app_ctx.jobj,
                                    new ctypes.voidptr_t(0));

    this.jenv.popFrame(android_tts.jobj);

    return android_tts;
}

TextToSpeech.prototype.playTick = function () {
    if (this.android_tts) {
        if (!this._registered_earcons)
            this._register_earcons();
        this.android_tts.playEarcon("[tick]", TextToSpeech.QUEUE_FLUSH, 0);
    }
    this._dont_interrupt = true;
}


TextToSpeech.prototype.speakContent = function (s) {
    console.log("SPEAK: " + s);
    let queue = (this._dont_interrupt) ?
        TextToSpeech.QUEUE_ADD :
        TextToSpeech.QUEUE_FLUSH;
    this._dont_interrupt = false;
    if (this.android_tts) {
        let ret = this.android_tts.speak(s || "", queue, 0);
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
