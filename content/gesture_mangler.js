Components.utils.import("resource://talktome/content/console.js");
Components.utils.import("resource://gre/modules/Geometry.jsm");

EXPORTED_SYMBOLS = ["GestureMangler"];

var Ci = Components.interfaces;

function GestureMangler (window) {
    this.window = window;

    this.eventGenerator = new GestureEventGenerator(window);

    let w = window.wrappedJSObject;

    if (!w.MouseModule) {
        console.warning("No MouseModule found");
        return;
    }

    this._origMouseHandler = w.MouseModule.prototype.handleEvent;

    if (!w.GestureModule) {
        console.warning("No GestureModule found");
        return;
    }

    this._origGestureHandler = w.GestureModule.prototype.handleEvent;
    
}

GestureMangler.prototype._setHandler = function (module, handler) {
    module.prototype.handleEvent = handler;
}

GestureMangler.prototype.enable = function () {
    let w = this.window.wrappedJSObject;

    this._setHandler(w.MouseModule, function (gesturemangler) {
        return function (e) {
            let rv = false;
            
            try {
                rv = GestureMangler.prototype.mouseHandler.apply(gesturemangler, [e]);
            } catch (e) {
                console.log("Error::mouseHandler: " + e);
            }
            
            if (!rv)
                gesturemangler._origMouseHandler(e);
        };
    }(this));
    this._setHandler(w.GestureModule, function (gesturemangler) {
        return function (e) {
            let rv = false;
            
            try {
                rv = GestureMangler.prototype.gestureHandler.apply(gesturemangler, [e]);
            } catch (e) {
                console.log("Error::gestureHandler: " + e);
            }
            
            if (!rv)
                gesturemangler._origGestureHandler(e);
        };
    }(this));
};

GestureMangler.prototype.disable = function () {
    let w = this.window.wrappedJSObject;

    this._setHandler(w.MouseModule, this._origMouseHandler);
    this._setHandler(w.GestureModule, this._origGestureHandler);
    this.window.removeEventListener('keypress', this.keypressHandler, false);
};

GestureMangler.prototype.mouseHandler = function (e) {
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

GestureMangler.prototype.gestureHandler = function (e) {
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
        let direction;

        switch (e.direction) {
        case e.DIRECTION_RIGHT:
            direction = "right";
            break;
        case e.DIRECTION_LEFT:
            direction = "left";
            break;
        case e.DIRECTION_UP:
            direction = "up";
            break;
        case e.DIRECTION_DOWN:
            direction = "down";
            break;
        default:
            break;
        }

        this.eventGenerator.emitEvent("Swipe",
                                      {direction: direction, fingers: 3});
        return true;
    }

    return false;
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

    // for counting consecutive gestures
    this._prevGestureType = "";
    this._prevGestureDetails = [];
    this._prevGestureTime = 0;

    // dwell support
    this._dwellTimeout = 0;
}

// minimal swipe distance in inches
const SWIPE_MIN_DISTANCE = 0.4;

// maximum duration of swipe
const SWIPE_MAX_DURATION = 400;

// maximum double tap delay
const DOUBLE_GESTURE_MAX_DELAY = 400;

// delay before tap turns into dwell
const DWELL_MIN_TIME = 500;

// delay before distinct dwell events
const DWELL_REPEAT_DELAY = 300;

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
        this._dwellTimeout = this.window.setTimeout(function (self) {
            return function () {
                try {
                    GestureEventGenerator.prototype._dwellEmit.apply(self, []);
                } catch (e) {
                    console.printException(e);
                }
            };}(this), DWELL_MIN_TIME);
    },
    up: function (timestamp, x, y) {
        this.window.clearTimeout(this._dwellTimeout);
        this._dwellTimeout = 0;
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

        // To be considered a tap...
        if (duration < DWELL_MIN_TIME && // Too short to be a dwell
            (realDistance / this._dpi) < SWIPE_MIN_DISTANCE) { // Didn't travel
            this.emitEvent("Tap", {x: startX, y: startY, fingers: 1});
        }
        // To be considered a swipe...
        else if (duration <= SWIPE_MAX_DURATION && // Quick enough
            (directDistance / this._dpi) >= SWIPE_MIN_DISTANCE && // Traveled far
            (directDistance * 1.2) >= realDistance) { // Direct enough

            let deltaX = endX - startX;
            let deltaY = endY - startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe.
                if (deltaX > 0)
                    this.emitEvent("Swipe", {direction: "left", fingers: 1});
                else
                    this.emitEvent("Swipe", {direction: "right", fingers: 1});
            } else if (Math.abs(deltaX) < Math.abs(deltaY)) {
                // Vertical swipe.
                if (deltaY > 0)
                    this.emitEvent("Swipe", {direction: "down", fingers: 1});
                else
                    this.emitEvent("Swipe", {direction: "up", fingers: 1});
            } else {
                // A perfect 45 degree swipe?? Not in our book.
            }
        }
    },
    emitEvent: function (eventType, eventDetails) {
        if (eventType == this._prevGestureType &&
            this._upTime - this._prevGestureTime < DOUBLE_GESTURE_MAX_DELAY)
            this._prevGestureDetails.push(eventDetails);
        else
            this._prevGestureDetails = [eventDetails];
        this._prevGestureTime = this._upTime;
        this._prevGestureType = eventType;

        //console.log ("Emitting " + eventType);
        //console.dumpObj(eventDetails);

        let e = this.window.document.createEvent("CustomEvent");
        e.initCustomEvent("TalkToMe::" + eventType, true, true,
                          this._prevGestureDetails);

        this.window.document.dispatchEvent(e);
    },
    _dwellEmit: function () {
        this.emitEvent("Dwell", {x: this._lastX, y: this._lastY});

        if (this._dwellTimeout == 0)
            return;

        this._dwellTimeout = this.window.setTimeout(function (self) {
            return function () {
                try {
                    GestureEventGenerator.prototype._dwellEmit.apply(self, []);
                } catch (e) {
                    console.printException(e);
                }
            };}(this), DWELL_REPEAT_DELAY);
    }
};
