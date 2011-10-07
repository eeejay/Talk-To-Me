Components.utils.import("resource://talktome/content/console.js");

EXPORTED_SYMBOLS=["Callback"];

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
