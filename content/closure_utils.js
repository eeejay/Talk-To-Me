Components.utils.import("resource://talktome/content/console.js");

EXPORTED_SYMBOLS=["Callback"];

function Callback (func, self) {
    if (!func)
        throw new Error("Callback function is not defined! " + self);
    return function () {
        try {
            func.apply(self || this, arguments);
        } catch (e) {
            console.printException(e, func.name);
        }
    };
}
