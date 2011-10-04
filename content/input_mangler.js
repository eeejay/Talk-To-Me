Components.utils.import("resource://talktome/content/console.js");
Components.utils.import("resource://gre/modules/Geometry.jsm");

EXPORTED_SYMBOLS = ["InputMangler"];

var Ci = Components.interfaces;

function InputMangler (window) {
    this.window = window;

    this.eventGenerator = new GestureEventGenerator(window);

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

    this._setHandler(w.MouseModule, function (inputMangler) {
        return function (e) {
            let rv = false;
            
            try {
                rv = InputMangler.prototype.mouseHandler.apply(inputMangler, [e]);
            } catch (e) {
                console.log("Error::mouseHandler: " + e);
            }
            
            if (!rv)
                inputMangler._origMouseHandler(e);
        };
    }(this));
    this._setHandler(w.GestureModule, function (inputMangler) {
        return function (e) {
            let rv = false;
            
            try {
                rv = InputMangler.prototype.gestureHandler.apply(inputMangler, [e]);
            } catch (e) {
                console.log("Error::gestureHandler: " + e);
            }
            
            if (!rv)
                inputMangler._origGestureHandler(e);
        };
    }(this));
    this.window.addEventListener('keypress', this.keypressHandler, false);
};

InputMangler.prototype.disable = function () {
    let w = this.window.wrappedJSObject;

    this._setHandler(w.MouseModule, this._origMouseHandler);
    this._setHandler(w.GestureModule, this._origGestureHandler);
    this.window.removeEventListener('keypress', this.keypressHandler, false);
};

InputMangler.prototype.mouseHandler = function (e) {
    if (!e.target.ownerDocument) {
        console.warning("e.target.ownerDocument is null");
        return false;
    }

    let window = e.target.ownerDocument.defaultView;
    switch (e.type) {
    case "mousedown":
        this.eventGenerator.down(e.timeStamp, e.clientX, e.clientY);
        return true;
    case "mouseup":
        this.eventGenerator.up(e.timeStamp, e.clientX, e.clientY);
        return true;
    case "mousemove":
        this.eventGenerator.move(e.timeStamp, e.clientX, e.clientY);
        return true;
    case "click":
        return true;
    default:
        return false;
        
    }
};

InputMangler.prototype.gestureHandler = function (e) {
    if (!e.target.ownerDocument) {
        console.warning("e.target.ownerDocument is null");
        return false;
    }

    let window = e.target.ownerDocument.defaultView;
    let mm = window.Browser.selectedTab.browser.messageManager

    if (e.type == "MozMagnifyGestureStart" ||
        e.type == "MozMagnifyGestureUpdate" ||
        e.type == "MozMagnifyGesture")
        return;

    if (e.type == "MozSwipeGesture") {
        this.eventGenerator.doingMozGesture = true;
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

function GestureEventGenerator (window) {
    this.window = window;
    this._dpi = window.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindowUtils).displayDPI;

    this._downTime = 0;
    this._downX = 0;
    this._downY = 0;

    this._upTime = 0;
    this._upX = 0;
    this._upY = 0;

    this._realDistance = 0;
    this._lastX = 0;
    this._lastY = 0;
    this._lastTime;

    // moz gesture inter-op;
    this.doingMozGesture = false;
}

// minimal swipe distance in inches
const SWIPE_MIN_DISTANCE = 0.4;

// maximum duration of swipe
const SWIPE_MAX_DURATION = 400;

// maximum double tap delay
const DOUBLE_TAP_MAX_DELAY = 400;

// delay before tap turns into dwell
const DWELL_MIN_TIME = 500;

// maximum distance the mouse could move during a dwell in inches
const DWELL_MAX_RADIUS = 0.2;

GestureEventGenerator.prototype = {
    UNKNOWN: 0,
    SWIPE_LEFT: 1,
    SWIPE_RIGHT: 2,
    SWIPE_UP: 3,
    SWIPE_DOWN: 4,
    FINGER_DWELL: 5,
    down: function (timestamp, x, y) {
        this._downTime = timestamp;
        this._downX = x;
        this._downY = y;
        this._lastX = x;
        this._lastY = y;
        this._realDistance = 0;
        this.doingMozGesture = false;
    },
    up: function (timestamp, x, y) {
        if (this.doingMozGesture)
            return;
        this._upTime = timestamp;
        this._upX = x;
        this._upY = y;
        this._examineEvents(this._upTime - this._downTime, this._realDistance,
                            this._upX, this._upY, this._downX, this._downY);
    },
    move: function (timestamp, x, y) {
        this._realDistance += this._distance(this._lastX, this._lastY, x, y);
        this._lastX = x;
        this._lastY = y;
    },
    _distance: function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    _examineEvents: function (duration, realDistance,
                              startX, startY, endX, endY) {
        let directDistance = this._distance (endX, endY, startX, startY);

        console.log ("Duration: " + duration);
        console.log ("Distance: " + directDistance);
        console.log ("Real distance: " + realDistance);

        // To long of a duration to be considered a swipe
        if (duration > SWIPE_MAX_DURATION) return;

        // To small to consider a swipe.
        if ((directDistance / this._dpi) < SWIPE_MIN_DISTANCE) return;

        // Didn't trace a direct enough line.
        if ((directDistance * 1.2) < realDistance) return;

        let deltaX = endX - startX;
        let deltaY = endY - startY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe.
            if (deltaX > 0)
                console.log ("swipe left");
            else
                this._emitEvent("TalkToMe::Swipe", {direction: "right"});
        } else if (Math.abs(deltaX) < Math.abs(deltaY)) {
            // Vertical swipe.
            if (deltaY > 0)
                console.log ("swipe down");
            else
                console.log ("swipe up");
        } else {
            // A perfect 45 degree swipe?? Not in our book.
        }
    },
    _emitEvent: function (eventType, eventDetails) {
        let e = this.window.document.createEvent("CustomEvent");
        e.initCustomEvent(eventType, true, true, eventDetails);

        this.window.document.dispatchEvent(e);
    }
};