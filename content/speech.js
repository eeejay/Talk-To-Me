var EXPORTED_SYMBOLS=["TextToSpeech"];

const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/ctypes.jsm")
Cu.import("resource://talktome/content/utils.js");

function TextToSpeech(mediaPath, usingAndroid) {
    this.mediaPath = mediaPath;

    if (usingAndroid)
        this.android_tts = this._get_android_tts();
    
    this._registered_earcons = false;
    this._playing_earcon = false;
}

TextToSpeech.prototype._register_earcons = function () {
    let earcons = {"tick.wav": "[tick]",
                   "activate.wav": "[activate]",
                   "thud.wav": "[thud]"};
    for (let fname in earcons) {
        let _path = this.mediaPath.clone();
        _path.append(fname);
        let rv = this.android_tts.addEarcon(earcons[fname], _path.path);
        console.log ("Adding earcon: " + _path.path +
                     ((rv == 0) ? " (success)" : " (fail)"));
    }
}

TextToSpeech.prototype._get_android_tts = function () {
    Cu.import("resource://talktome/content/android_api.js");

    JavaEnvironment.pushFrame();

    let tts = JavaEnvironment.getClass(
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

    let android_tts = tts.newObject(
        JavaEnvironment.getAppContext().getApplication(),
        new ctypes.voidptr_t(0));

    JavaEnvironment.popFrame(android_tts.jobj);

    return android_tts;
}

TextToSpeech.prototype.playEarcon = function (earcon, queue) {
    console.log("TextToSpeech.playEarcon");
    queue = (queue == undefined) ?
        TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD;
    if (this.android_tts) {
        if (!this._registered_earcons)
            this._register_earcons();
        this.android_tts.playEarcon(earcon, queue, 0);
    }
    this._playing_earcon = true;
}

TextToSpeech.prototype.speakContent = function (s) {
    this.setPitch(1.0);
    console.log("TextToSpeech.speakContent: " + s);
    this._playing_earcon = false;
    if (this.android_tts) {
        let ret = this.android_tts.speak(s || "", TextToSpeech.QUEUE_ADD, 0);
        console.log(ret);
        return (ret == 0);
    }

    return true;
}

TextToSpeech.prototype.speakAppState = function (s) {
    this.setPitch(0.7);
    console.log("TextToSpeech.speakAppState: " + s);
    let queue = (this._playing_earcon) ?
        TextToSpeech.QUEUE_ADD : TextToSpeech.QUEUE_FLUSH;
    this._playing_earcon = false;
    if (this.android_tts) {
        let ret = this.android_tts.speak(s || "", queue, 0);
        console.log(ret);
        return (ret == 0);
    }

    return true;
}

TextToSpeech.prototype.setPitch = function (f) {
    console.log("TextToSpeech.setPitch: " + f);
    if (this.android_tts) {
        let ret = this.android_tts.setPitch(f);
        return (ret == 0);
    }

    return true;
}

TextToSpeech.prototype.shutdown = function () {
    console.log("TextToSpeech.shutdown");

    if (this.android_tts) {
        this.android_tts.shutdown();
        this.android_tts = null;
    }
}

TextToSpeech.QUEUE_FLUSH = 0;
TextToSpeech.QUEUE_ADD = 1;
