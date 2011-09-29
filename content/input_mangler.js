Components.utils.import("resource://talktome/content/console.js");

EXPORTED_SYMBOLS = ["InputMangler"];

function InputMangler (window) {
    this.window = window;
    let w = window.wrappedJSObject;

    if (!w.MouseModule)
        throw "No MouseModule found";

    this._origMouseHandler = w.MouseModule.prototype.handleEvent;

    if (!w.GestureModule)
        throw "No GestureModule found";

    this._origGestureHandler = w.GestureModule.prototype.handleEvent;
    
}

InputMangler.prototype._setHandler = function (module, handler) {
    module.prototype.handleEvent = handler;
}

InputMangler.prototype.enable = function () {
    let w = this.window.wrappedJSObject;

    this._setHandler(w.MouseModule, this.mouseHandler);
    this._setHandler(w.GestureModule, this.gestureHandler);
    this.window.addEventListener('keypress', this.keypressHandler, false);
};

InputMangler.prototype.disable = function () {
    let w = this.window.wrappedJSObject;

    this._setHandler(w.MouseModule, this._origMouseHandler);
    this._setHandler(w.GestureModule, this._origGestureHandler);
    this.window.removeEventListener('keypress', this.keypressHandler, false);
};

InputMangler.prototype.mouseHandler = function (e) {
    let rv = false;
    try {
        rv = InputMangler._mouseHandler(e);
    } catch (e) {
        console.log("Error::mouseHandler: " + e);
    }

    if (!rv)
        this._origMouseHandler(e);
};

InputMangler._mouseHandler = function (e) {
    let window = e.target.ownerDocument.defaultView;
    if (e.type == "mousedown" || e.type == "mousemove" || e.type == "mouseup" ||
        e.type == "click")
        return true;

    return false;
};

InputMangler.prototype.gestureHandler = function (e) {
    let rv = false;
    try {
        rv = InputMangler._gestureHandler(e);
    } catch (e) {
        console.log("Error::gestureHandler: " + e);
    }
    
    if (!rv)
        this._origGestureHandler(e);
};

InputMangler._gestureHandler = function (e) {
    let window = e.target.ownerDocument.defaultView;
    let mm = window.Browser.selectedTab.browser.messageManager

    if (e.type == "MozMagnifyGestureStart" ||
        e.type == "MozMagnifyGestureUpdate" ||
        e.type == "MozMagnifyGesture")
        return;

    if (e.type == "MozSwipeGesture") {
        switch (e.direction) {
        case e.DIRECTION_RIGHT:
            console.log ("next");
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "next" });
            return true;
        case e.DIRECTION_LEFT:
            console.log ("prev");
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "prev" });
            return true;
        default:
            break;
        }
    }

    return false;
};

InputMangler.prototype.keypressHandler = function (e) {
    if (e.altKey) {
        let mm = this.window.Browser.selectedTab.browser.messageManager
        switch (e.keyCode) {
        case e.DOM_VK_DOWN:
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "next" });
            console.log ("next");
            break;
        case e.DOM_VK_UP:
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "prev" });
            console.log ("prev");
            break;
        default:
            break;
        }
    }
};

