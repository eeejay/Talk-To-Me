Components.utils.import("resource://gre/modules/ctypes.jsm")

var EXPORTED_SYMBOLS = ["JavaEnvironment", "JavaObject"];

var libxul = ctypes.open("libxul.so");

var jclass = ctypes.voidptr_t;
var jobject = ctypes.voidptr_t;
var jvalue = ctypes.voidptr_t;
var jmethodid = ctypes.voidptr_t;
var jfieldid = ctypes.voidptr_t;
var jthrowable = ctypes.voidptr_t;

const N_REFS = 16;

var JNINativeInterface = new ctypes.StructType(
    "JNINativeInterface",
    [{reserved0: ctypes.voidptr_t},
     {reserved1: ctypes.voidptr_t},
     {reserved2: ctypes.voidptr_t},
     {reserved3: ctypes.voidptr_t},
     {GetVersion: new ctypes.FunctionType(ctypes.default_abi,
                                          ctypes.int32_t,
                                          [ctypes.voidptr_t]).ptr},
     {DefineClass: ctypes.voidptr_t},
     {FindClass: new ctypes.FunctionType(ctypes.default_abi,
                                         jclass,
                                         [ctypes.voidptr_t,
                                          ctypes.char.ptr]).ptr},
     {FromReflectedMethodprintf: ctypes.voidptr_t},
     {FromReflectedField: ctypes.voidptr_t},
     {ToReflectedMethod: ctypes.voidptr_t},
     {GetSuperclass: new ctypes.FunctionType(ctypes.default_abi,
                                             jclass, [ctypes.voidptr_t, jclass]).ptr},
     {IsAssignableFrom: ctypes.voidptr_t},
     {ToReflectedField: ctypes.voidptr_t},
     {Throw: ctypes.voidptr_t},
     {ThrowNew: ctypes.voidptr_t},
     {ExceptionOccurred: new ctypes.FunctionType(
         ctypes.default_abi,
         jthrowable, [ctypes.voidptr_t]).ptr},
     {ExceptionDescribe:  new ctypes.FunctionType(
         ctypes.default_abi,
         ctypes.void_t, [ctypes.voidptr_t]).ptr},
     {ExceptionClear: new ctypes.FunctionType(
         ctypes.default_abi,
         ctypes.void_t, [ctypes.voidptr_t]).ptr},
     {FatalError: ctypes.voidptr_t},
     {PushLocalFrame: new ctypes.FunctionType(ctypes.default_abi,
                                              ctypes.int32_t,
                                              [ctypes.voidptr_t,
                                               ctypes.int32_t]).ptr},
     {PopLocalFrame: new ctypes.FunctionType(ctypes.default_abi,
                                             ctypes.int32_t,
                                             [ctypes.voidptr_t,
                                              jobject]).ptr},
     {NewGlobalRef: new ctypes.FunctionType(ctypes.default_abi,
                                            jobject,
                                            [ctypes.voidptr_t,
                                             jobject]).ptr},
     {DeleteGlobalRef: new ctypes.FunctionType(ctypes.default_abi,
                                               ctypes.void_t,
                                               [ctypes.voidptr_t,
                                                jobject]).ptr},
     {DeleteLocalRef: new ctypes.FunctionType(ctypes.default_abi,
                                         ctypes.void_t,
                                         [ctypes.voidptr_t,
                                          jobject]).ptr},
     {IsSameObject: ctypes.voidptr_t},
     {NewLocalRef: ctypes.voidptr_t},
     {EnsureLocalCapacity: ctypes.voidptr_t},
     {AllocObject: ctypes.voidptr_t},
     {NewObject: new ctypes.FunctionType(ctypes.default_abi,
                                         jobject,
                                         [ctypes.voidptr_t,
                                          jclass,
                                          jmethodid,
                                          "..."]).ptr},
     {NewObjectV: ctypes.voidptr_t},
     {NewObjectA: ctypes.voidptr_t},
     {GetObjectClass: new ctypes.FunctionType(ctypes.default_abi,
                                              jclass,
                                              [ctypes.voidptr_t,
                                               jobject]).ptr},
     {IsInstanceOf: ctypes.voidptr_t},
     {GetMethodID: new ctypes.FunctionType(ctypes.default_abi,
                                           jmethodid,
                                           [ctypes.voidptr_t,
                                            jclass,
                                            ctypes.char.ptr,
                                            ctypes.char.ptr]).ptr},
     {CallObjectMethod: new ctypes.FunctionType(ctypes.default_abi,
                                                jobject,
                                                [ctypes.voidptr_t,
                                                 jobject,
                                                 jmethodid,
                                                 "..."]).ptr},
     {CallObjectMethodV: ctypes.voidptr_t},
     {CallObjectMethodA: ctypes.voidptr_t},
     {CallBooleanMethod: new ctypes.FunctionType(ctypes.default_abi,
                                                 ctypes.uint8_t,
                                                 [ctypes.voidptr_t,
                                                  jobject,
                                                  jmethodid,
                                                  "..."]).ptr},
     {CallBooleanMethodV: ctypes.voidptr_t},
     {CallBooleanMethodA: ctypes.voidptr_t},
     {CallByteMethod: ctypes.voidptr_t},
     {CallByteMethodV: ctypes.voidptr_t},
     {CallByteMethodA: ctypes.voidptr_t},
     {CallCharMethod: ctypes.voidptr_t},
     {CallCharMethodV: ctypes.voidptr_t},
     {CallCharMethodA: ctypes.voidptr_t},
     {CallShortMethod: ctypes.voidptr_t},
     {CallShortMethodV: ctypes.voidptr_t},
     {CallShortMethodA: ctypes.voidptr_t},
     {CallIntMethod: new ctypes.FunctionType(ctypes.default_abi,
                                             ctypes.int32_t,
                                             [ctypes.voidptr_t,
                                              jobject,
                                              jmethodid,
                                              "..."]).ptr},
     {CallIntMethodV: ctypes.voidptr_t},
     {CallIntMethodA: ctypes.voidptr_t},
     {CallLongMethod: ctypes.voidptr_t},
     {CallLongMethodV: ctypes.voidptr_t},
     {CallLongMethodA: ctypes.voidptr_t},
     {CallFloatMethod: ctypes.voidptr_t},
     {CallFloatMethodV: ctypes.voidptr_t},
     {CallFloatMethodA: ctypes.voidptr_t},
     {CallDoubleMethod: ctypes.voidptr_t},
     {CallDoubleMethodV: ctypes.voidptr_t},
     {CallDoubleMethodA: ctypes.voidptr_t},
     {CallVoidMethod: new ctypes.FunctionType(ctypes.default_abi,
                                              ctypes.void_t,
                                              [ctypes.voidptr_t,
                                               jobject,
                                               jmethodid,
                                               "..."]).ptr},
     {CallVoidMethodV: ctypes.voidptr_t},
     {CallVoidMethodA: ctypes.voidptr_t},
     {CallNonvirtualObjectMethod: ctypes.voidptr_t},
     {CallNonvirtualObjectMethodV: ctypes.voidptr_t},
     {CallNonvirtualObjectMethodA: ctypes.voidptr_t},
     {CallNonvirtualBooleanMethod: ctypes.voidptr_t},
     {CallNonvirtualBooleanMethodV: ctypes.voidptr_t},
     {CallNonvirtualBooleanMethodA: ctypes.voidptr_t},
     {CallNonvirtualByteMethod: ctypes.voidptr_t},
     {CallNonvirtualByteMethodV: ctypes.voidptr_t},
     {CallNonvirtualByteMethodA: ctypes.voidptr_t},
     {CallNonvirtualCharMethod: ctypes.voidptr_t},
     {CallNonvirtualCharMethodV: ctypes.voidptr_t},
     {CallNonvirtualCharMethodA: ctypes.voidptr_t},
     {CallNonvirtualShortMethod: ctypes.voidptr_t},
     {CallNonvirtualShortMethodV: ctypes.voidptr_t},
     {CallNonvirtualShortMethodA: ctypes.voidptr_t},
     {CallNonvirtualIntMethod: ctypes.voidptr_t},
     {CallNonvirtualIntMethodV: ctypes.voidptr_t},
     {CallNonvirtualIntMethodA: ctypes.voidptr_t},
     {CallNonvirtualLongMethod: ctypes.voidptr_t},
     {CallNonvirtualLongMethodV: ctypes.voidptr_t},
     {CallNonvirtualLongMethodA: ctypes.voidptr_t},
     {CallNonvirtualFloatMethod: ctypes.voidptr_t},
     {CallNonvirtualFloatMethodV: ctypes.voidptr_t},
     {CallNonvirtualFloatMethodA: ctypes.voidptr_t},
     {CallNonvirtualDoubleMethod: ctypes.voidptr_t},
     {CallNonvirtualDoubleMethodV: ctypes.voidptr_t},
     {CallNonvirtualDoubleMethodA: ctypes.voidptr_t},
     {CallNonvirtualVoidMethod: ctypes.voidptr_t},
     {CallNonvirtualVoidMethodV: ctypes.voidptr_t},
     {CallNonvirtualVoidMethodA: ctypes.voidptr_t},
     {GetFieldID: ctypes.voidptr_t},
     {GetObjectField: ctypes.voidptr_t},
     {GetBooleanField: ctypes.voidptr_t},
     {GetByteField: ctypes.voidptr_t},
     {GetCharField: ctypes.voidptr_t},
     {GetShortField: ctypes.voidptr_t},
     {GetIntField: ctypes.voidptr_t},
     {GetLongField: ctypes.voidptr_t},
     {GetFloatField: ctypes.voidptr_t},
     {GetDoubleField: ctypes.voidptr_t},
     {SetObjectField: ctypes.voidptr_t},
     {SetBooleanField: ctypes.voidptr_t},
     {SetByteField: ctypes.voidptr_t},
     {SetCharField: ctypes.voidptr_t},
     {SetShortField: ctypes.voidptr_t},
     {SetIntField: ctypes.voidptr_t},
     {SetLongField: ctypes.voidptr_t},
     {SetFloatField: ctypes.voidptr_t},
     {SetDoubleField: ctypes.voidptr_t},
     {GetStaticMethodID: ctypes.voidptr_t},
     {CallStaticObjectMethod: ctypes.voidptr_t},
     {CallStaticObjectMethodV: ctypes.voidptr_t},
     {CallStaticObjectMethodA: ctypes.voidptr_t},
     {CallStaticBooleanMethod: ctypes.voidptr_t},
     {CallStaticBooleanMethodV: ctypes.voidptr_t},
     {CallStaticBooleanMethodA: ctypes.voidptr_t},
     {CallStaticByteMethod: ctypes.voidptr_t},
     {CallStaticByteMethodV: ctypes.voidptr_t},
     {CallStaticByteMethodA: ctypes.voidptr_t},
     {CallStaticCharMethod: ctypes.voidptr_t},
     {CallStaticCharMethodV: ctypes.voidptr_t},
     {CallStaticCharMethodA: ctypes.voidptr_t},
     {CallStaticShortMethod: ctypes.voidptr_t},
     {CallStaticShortMethodV: ctypes.voidptr_t},
     {CallStaticShortMethodA: ctypes.voidptr_t},
     {CallStaticIntMethod: ctypes.voidptr_t},
     {CallStaticIntMethodV: ctypes.voidptr_t},
     {CallStaticIntMethodA: ctypes.voidptr_t},
     {CallStaticLongMethod: ctypes.voidptr_t},
     {CallStaticLongMethodV: ctypes.voidptr_t},
     {CallStaticLongMethodA: ctypes.voidptr_t},
     {CallStaticFloatMethod: ctypes.voidptr_t},
     {CallStaticFloatMethodV: ctypes.voidptr_t},
     {CallStaticFloatMethodA: ctypes.voidptr_t},
     {CallStaticDoubleMethod: ctypes.voidptr_t},
     {CallStaticDoubleMethodV: ctypes.voidptr_t},
     {CallStaticDoubleMethodA: ctypes.voidptr_t},
     {CallStaticVoidMethod: ctypes.voidptr_t},
     {CallStaticVoidMethodV: ctypes.voidptr_t},
     {CallStaticVoidMethodA: ctypes.voidptr_t},
     {GetStaticFieldID: new ctypes.FunctionType(ctypes.default_abi,
                                                jfieldid,
                                                [ctypes.voidptr_t,
                                                 jclass,
                                                 ctypes.char.ptr,
                                                 ctypes.char.ptr]).ptr},
     {GetStaticObjectField: new ctypes.FunctionType(ctypes.default_abi,
                                                    jobject,
                                                    [ctypes.voidptr_t,
                                                     jclass,
                                                     jfieldid]).ptr},
     {GetStaticBooleanField: ctypes.voidptr_t},
     {GetStaticByteField: ctypes.voidptr_t},
     {GetStaticCharField: ctypes.voidptr_t},
     {GetStaticShortField: ctypes.voidptr_t},
     {GetStaticIntField: ctypes.voidptr_t},
     {GetStaticLongField: ctypes.voidptr_t},
     {GetStaticFloatField: ctypes.voidptr_t},
     {GetStaticDoubleField: ctypes.voidptr_t},
     {SetStaticObjectField: ctypes.voidptr_t},
     {SetStaticBooleanField: ctypes.voidptr_t},
     {SetStaticByteField: ctypes.voidptr_t},
     {SetStaticCharField: ctypes.voidptr_t},
     {SetStaticShortField: ctypes.voidptr_t},
     {SetStaticIntField: ctypes.voidptr_t},
     {SetStaticLongField: ctypes.voidptr_t},
     {SetStaticFloatField: ctypes.voidptr_t},
     {SetStaticDoubleField: ctypes.voidptr_t},
     {NewString: ctypes.voidptr_t},
     {GetStringLength: ctypes.voidptr_t},
     {GetStringChars: ctypes.voidptr_t},
     {ReleaseStringChars: ctypes.voidptr_t},
     {NewStringUTF: new ctypes.FunctionType(ctypes.default_abi,
                                            jobject,
                                            [ctypes.voidptr_t,
                                             ctypes.char.ptr]).ptr},
     {GetStringUTFLength: new ctypes.FunctionType(ctypes.default_abi,
                                                  ctypes.int32_t,
                                                  [ctypes.voidptr_t,
                                                   jobject]).ptr},
     {GetStringUTFChars: ctypes.voidptr_t},
     {ReleaseStringUTFChars: ctypes.voidptr_t},
     {GetArrayLength: ctypes.voidptr_t},
     {NewObjectArray: ctypes.voidptr_t},
     {GetObjectArrayElement: ctypes.voidptr_t},
     {SetObjectArrayElement: ctypes.voidptr_t},
     {NewBooleanArray: ctypes.voidptr_t},
     {NewByteArray: ctypes.voidptr_t},
     {NewCharArray: ctypes.voidptr_t},
     {NewShortArray: ctypes.voidptr_t},
     {NewIntArray: ctypes.voidptr_t},
     {NewLongArray: ctypes.voidptr_t},
     {NewFloatArray: ctypes.voidptr_t},
     {NewDoubleArray: ctypes.voidptr_t},
     {GetBooleanArrayElements: ctypes.voidptr_t},
     {GetByteArrayElements: ctypes.voidptr_t},
     {GetCharArrayElements: ctypes.voidptr_t},
     {GetShortArrayElements: ctypes.voidptr_t},
     {GetIntArrayElements: ctypes.voidptr_t},
     {GetLongArrayElements: ctypes.voidptr_t},
     {GetFloatArrayElements: ctypes.voidptr_t},
     {GetDoubleArrayElements: ctypes.voidptr_t},
     {ReleaseBooleanArrayElements: ctypes.voidptr_t},
     {ReleaseByteArrayElements: ctypes.voidptr_t},
     {ReleaseCharArrayElements: ctypes.voidptr_t},
     {ReleaseShortArrayElements: ctypes.voidptr_t},
     {ReleaseIntArrayElements: ctypes.voidptr_t},
     {ReleaseLongArrayElements: ctypes.voidptr_t},
     {ReleaseFloatArrayElements: ctypes.voidptr_t},
     {ReleaseDoubleArrayElements: ctypes.voidptr_t},
     {GetBooleanArrayRegion: ctypes.voidptr_t},
     {GetByteArrayRegion: ctypes.voidptr_t},
     {GetCharArrayRegion: ctypes.voidptr_t},
     {GetShortArrayRegion: ctypes.voidptr_t},
     {GetIntArrayRegion: ctypes.voidptr_t},
     {GetLongArrayRegion: ctypes.voidptr_t},
     {GetFloatArrayRegion: ctypes.voidptr_t},
     {GetDoubleArrayRegion: ctypes.voidptr_t},
     {SetBooleanArrayRegion: ctypes.voidptr_t},
     {SetByteArrayRegion: ctypes.voidptr_t},
     {SetCharArrayRegion: ctypes.voidptr_t},
     {SetShortArrayRegion: ctypes.voidptr_t},
     {SetIntArrayRegion: ctypes.voidptr_t},
     {SetLongArrayRegion: ctypes.voidptr_t},
     {SetFloatArrayRegion: ctypes.voidptr_t},
     {SetDoubleArrayRegion: ctypes.voidptr_t},
     {RegisterNatives: ctypes.voidptr_t},
     {UnregisterNatives: ctypes.voidptr_t},
     {MonitorEnter: ctypes.voidptr_t},
     {MonitorExit: ctypes.voidptr_t},
     {GetJavaVM: ctypes.voidptr_t},
     {GetStringRegion: ctypes.voidptr_t},
     {GetStringUTFRegion: new ctypes.FunctionType(ctypes.default_abi,
                                                  ctypes.void_t,
                                                  [ctypes.voidptr_t,
                                                   jobject,
                                                   ctypes.int32_t,
                                                   ctypes.int32_t,
                                                   ctypes.char.ptr]).ptr},
     {GetPrimitiveArrayCritical: ctypes.voidptr_t},
     {ReleasePrimitiveArrayCritical: ctypes.voidptr_t},
     {GetStringCritical: ctypes.voidptr_t},
     {ReleaseStringCritical: ctypes.voidptr_t},
     {NewWeakGlobalRef: ctypes.voidptr_t},
     {DeleteWeakGlobalRef: ctypes.voidptr_t},
     {ExceptionCheck: ctypes.voidptr_t},
     {NewDirectByteBuffer: ctypes.voidptr_t},
     {GetDirectBufferAddress: ctypes.voidptr_t},
     {GetDirectBufferCapacity: ctypes.voidptr_t},
     {GetObjectRefType: ctypes.voidptr_t}]
);

var GetJNIForThread = libxul.declare("GetJNIForThread",
                                     ctypes.default_abi,
                                     JNINativeInterface.ptr.ptr);

/* JS-friendly API */

// ctypes.FunctionType does not support apply(), so THIS is what we have to do.
function _apply(fn, ar) {
    switch (ar.length) {
    case 0:
        return fn();
    case 1:
        return fn(ar[0]);
    case 2:
        return fn(ar[0], ar[1]);
    case 3:
        return fn(ar[0], ar[1], ar[2]);
    case 4:
        return fn(ar[0], ar[1], ar[2], ar[3]);
    case 5:
        return fn(ar[0], ar[1], ar[2], ar[3], ar[4]);
    case 6:
        return fn(ar[0], ar[1], ar[2], ar[3], ar[4], ar[5]);
    case 7:
        return fn(ar[0], ar[1], ar[2], ar[3], ar[4], ar[5], ar[6]);
    case 8:
        return fn(ar[0], ar[1], ar[2], ar[3], ar[4], ar[5], ar[6], ar[7]);
    case 9:
        return fn(ar[0], ar[1], ar[2], ar[3], ar[4], ar[5], ar[6], ar[7], ar[8]);
    case 10:
        return fn(ar[0], ar[1], ar[2], ar[3], ar[4], ar[5], ar[6], ar[7], ar[8], ar[9]);
    default:
        throw "unsupported amount of arguments"
    }
}

var _java_sig_patt = /^\((.*?)\)(.*?)$/;
var _java_arg_patt = /(?:\[?)(?:(?:L.*?;)|[ZBCSIJFD])/g;

var JavaEnvironment = {
    init: function () {
        this._javaenv = GetJNIForThread();
        this.jenv = this._javaenv.contents.contents;
        this._bindFunctions ();
    },
    _bindFunctions: function () {
        for (let i in JNINativeInterface.fields) {
            for (let attr in JNINativeInterface.fields[i]) {
                let field = JNINativeInterface.fields[i][attr];
                if (field.targetType instanceof ctypes.FunctionType) {
                    let fname = attr;
                    this[fname] = function () {
                        let _args = [this._javaenv]
                        _args.push.apply(_args, arguments);
                        return _apply(this.jenv[fname], _args);
                    }
                }
            }
        }
    },
    getAppContext: function () {
        this.pushFrame();
        let app = this.getClass("org/mozilla/gecko/GeckoApp", {});
        let fid = this.GetStaticFieldID(app.jcls, "mAppContext",
                                         "Lorg/mozilla/gecko/GeckoApp;");
        let jctx = this.GetStaticObjectField(app.jcls, fid);
        this.popFrame(jctx);
        let ctx = new JavaObject();
        ctx.fromInstanceInit(jctx, 
                             {methods: {
                                 getDir: "(Ljava/lang/String;I)Ljava/io/File;",
                                 getApplication: "()Landroid/app/Application;"
                             }
                             }
                            );
        return ctx;
    },
    getClass: function (name, iface) {
        return new JavaClass(name, iface);
    },
    pushFrame: function () {
        return (this.PushLocalFrame(ctypes.int32_t(N_REFS)) == 0);
    },
    popFrame: function (ref) {
        return (this.PopLocalFrame(ref || ctypes.voidptr_t(0)) == 0);
    }
};

function JavaClass(name, iface) {
    this.iface = iface;
    this.jcls = JavaEnvironment.FindClass(name);

    if (this.jcls.isNull()) {
        throw "can't find class";
    }
};

JavaClass.prototype.newObject = function () {
    let obj = new JavaObject();
    obj.constructInit(this, arguments);
    return obj;
};

var _returntypes = {
    V: "CallVoidMethod",
    Z: "CallBooleanMethod",
    I: "CallIntMethod",
    L: "CallObjectMethod"
};

function JavaObject () {
    this._placeholder = null;
};

JavaObject.prototype.constructInit = function (cls, args) {
    let methodid = JavaEnvironment.GetMethodID(cls.jcls, "<init>",
                                               cls.iface.constructor);
    let _args = [cls.jcls, methodid];
    _args.push.apply(_args, args);

    this.jobj = JavaEnvironment.NewObject.apply(JavaEnvironment, _args);
    this.iface = cls.iface;
    this._createMethods();
};

JavaObject.prototype.fromInstanceInit = function (jobj, iface) {
    this.jobj = jobj;
    this.iface = iface;

    this._createMethods();
};

JavaObject.prototype._createMethods = function () {
    for (let attr in this.iface.methods) {
        let _mname = attr;
        this[_mname] = function () {
            JavaEnvironment.pushFrame();

            let signature = this.iface.methods[_mname];
            let m = _java_sig_patt.exec(signature);
            let returntype = m[2];
            let jcls = JavaEnvironment.GetObjectClass(this.jobj);
            let methodid = JavaEnvironment.GetMethodID(jcls, _mname, signature);
            let _args = [this.jobj, methodid];
            let _arg;
            let i = 0;
            while (_arg = _java_arg_patt.exec(m[1])) {
                if (i >= arguments.length)
                    throw _mname + ": too many arguments";

                if (_arg[0][0] == "[")
                    throw _mname + ": arrays are not supported yet";

                if (_arg[0] == "Z" || _arg[0] == "C")
                    _args.push(ctypes.uint8_t(arguments[i]));
                else if (_arg[0] == "B")
                    _args.push(ctypes.int8_t(arguments[i]));
                else if (_arg[0] == "S")
                    _args.push(ctypes.int16_t(arguments[i]));
                else if (_arg[0] == "I")
                    _args.push(ctypes.int32_t(arguments[i]));
                else if (_arg[0] == "J")
                    _args.push(ctypes.int64_t(arguments[i]));
                else if (_arg[0] == "F")
                    _args.push(ctypes.float32_t(arguments[i]));
                else if (_arg[0] == "D")
                    _args.push(ctypes.float64_t(arguments[i]));
                else if (_arg[0] == "Ljava/lang/String;")
                    _args.push(JavaEnvironment.NewStringUTF(arguments[i]));
                else
                    _args.push(ctypes.voidptr_t(arguments[i]));
                i++;
            }

            let rv = JavaEnvironment[_returntypes[returntype[0]]]
                .apply(JavaEnvironment, _args);

            let exc = JavaEnvironment.ExceptionOccurred();

            if (!exc.isNull()) {
                JavaEnvironment.ExceptionDescribe();
                JavaEnvironment.ExceptionClear();
            }

            if (returntype == "Ljava/lang/String;") {
                let ln = JavaEnvironment.GetStringUTFLength(rv);
                let _chars = ctypes.char.array(ln);
                let chars = _chars();
                JavaEnvironment.GetStringUTFRegion(rv, 0, ln, chars);
                rv = chars.readString();
            }

            if (returntype[0] == 'L' && returntype != "Ljava/lang/String;")
                JavaEnvironment.popFrame(rv);
            else
                JavaEnvironment.popFrame(0);

            return rv;
        }
    }
};

JavaEnvironment.init();
