Components.utils.import("resource://gre/modules/ctypes.jsm")
Components.utils.import("resource://talktome/content/android_api.js");
Components.utils.import("resource://talktome/content/console.js");

var EXPORTED_SYMBOLS=["TextToSpeech"];

function TextToSpeech() {
    this.jenv = new JavaEnvironment();

    let tts = this.jenv.getClass("android/speech/tts/TextToSpeech",
                                  {constructor: "(Landroid/content/Context;Landroid/speech/tts/TextToSpeech$OnInitListener;)V",
                                   methods: {speak: "(Ljava/lang/String;ILjava/util/HashMap;)I"}});
    console.log("texttospeech: " + tts.jcls);

    let app = this.jenv.getClass("org/mozilla/gecko/GeckoApp", {});

    console.log("app: " + app.jcls);

    let fid = this.jenv.GetStaticFieldID(app.jcls, "mAppContext",
                                         "Lorg/mozilla/gecko/GeckoApp;");

    console.log("fid: " + fid);

    let ctx = this.jenv.GetStaticObjectField(app.jcls, fid);

    console.log("ctx: " + ctx);

    this.jtts = tts.newObject(ctx, new ctypes.voidptr_t(0));

    console.log("jtts: " + this.jtts);
}

TextToSpeech.prototype.speak = function (s) {
    console.log("SPEAK: " + s);
    let ret = this.jtts.speak(s, 0, 0);
    if (ret != 0)
        throw "Error in TextToSpeech.speak";
}