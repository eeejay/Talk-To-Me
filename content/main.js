Components.utils.import("resource://talktome/content/console.js");

var TalkToMe = {
    _highlight_canvas: null,

    onLoad : function(aEvent) {
        try {
            this._wrapGestureModule ();
        } catch (e) {
            console.log("ERROR: " + e);
        }
        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener("TalkToMe:Speak", this);
    },

    _wrapMouseModule : function () {
        var w = window.wrappedJSObject;
        if (!w.MouseModule)
            return;

        /* borrowed from touching-is-good addon */

        var mmp = w.MouseModule.prototype;
        var mmpHandleEvent = mmp.handleEvent;

        mmp.handleEvent = function wrapped_handleEvent (e) {
            /* Could be useful one day... */
            return mmpHandleEvent.apply(this, [e]);
        }
        
    },

    _wrapGestureModule : function () {
        var w = window.wrappedJSObject;
        if (!w.GestureModule)
            return;

        /* borrowed from touching-is-good addon */

        var gmp = w.GestureModule.prototype;
        var gmpHandleEvent = gmp.handleEvent;

        gmp.handleEvent = function wrapped_handleEvent (e) {
            let mm = window.Browser.selectedTab.browser.messageManager
            if (e.type == "MozSwipeGesture") {
                switch (e.direction) {
                case e.DIRECTION_RIGHT:
                    mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "next" });
                    console.log ("next");
                    break;
                case e.DIRECTION_LEFT:
                    mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "prev" });
                    console.log ("prev");
                    break;
                default:
                    break;
                }
            }

            return gmpHandleEvent.apply(this, [e]);
        }
        
    },

    onUIReady : function(aEvent) {
        try {
            let document = window.document;
            let stack = window.document.getElementById('stack');

            this._highlight_canvas = document.createElementNS(
                "http://www.w3.org/1999/xhtml", "canvas");
            this._highlight_canvas.style.pointerEvents = "none";
            this._highlight_canvas.width = document.documentElement.width;
            this._highlight_canvas.height = document.documentElement.height;
            stack.appendChild(this._highlight_canvas);            
        } catch (e) {
            console.log("Error adding highlighter: " + e);
        }
    },

    onUIReadyDelayed : function(aEvent) {
    },

    receiveMessage: function(aMessage) {
        try {
            let phrase = aMessage.json.phrase;
            let bounds = aMessage.json.bounds;

            tts.speak(phrase);

            // translate coords

            let rect = this._transformContentRect(bounds.top, bounds.left,
                                                  bounds.bottom, bounds.right);


            let clipping = this._clip(rect);
            let view = window.Browser.selectedTab.browser.getRootView();

            let deltaX = clipping.left || clipping.right;
            let deltaY = clipping.top || clipping.bottom;

            view.scrollBy(Math.round(deltaX), Math.round(deltaY));

            rect = this._transformContentRect(bounds.top, bounds.left,
                                              bounds.bottom, bounds.right);

            this._highlight(rect);
        } catch (e) {
            console.log("Error presenting: " + e);
        }
    },

    _clip: function (rect) {
        let bcr = window.Browser.selectedTab.browser.getBoundingClientRect();

        return {left: ((rect.left >= bcr.left) ? 0 : rect.left - bcr.left),
                top: ((rect.top >= bcr.top) ? 0 : rect.top - bcr.top),
                right: ((rect.right <= bcr.right) ? 0 : rect.right - bcr.right),
                bottom: ((rect.bottom <= bcr.bottom) ? 0 : rect.bottom - bcr.bottom)};
    },

    _transformContentRect: function (top, left, bottom, right) {
        let t1 = window.Browser.selectedTab.browser.transformBrowserToClient(
            left, top);
        let t2 = window.Browser.selectedTab.browser.transformBrowserToClient(
            right, bottom);

        return { top: t1.y,
                 left: t1.x,
                 bottom: t2.y,
                 right: t2.x };
    },

    // From https://developer.mozilla.org/en/Canvas_tutorial/Drawing_shapes
    _highlight: function (rect){
        let ctx = this._highlight_canvas.getContext("2d");

        // clear it
        ctx.clearRect(0, 0,
                      this._highlight_canvas.width,
                      this._highlight_canvas.height);
        
        // Style it
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.8)'; 
        ctx.lineWidth = 2;
        const radius = 4;

        let x = rect.left;
        let y = rect.top;
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        ctx.beginPath();  
        ctx.moveTo(x,y+radius);  
        ctx.lineTo(x,y+height-radius);  
        ctx.quadraticCurveTo(x,y+height,x+radius,y+height);  
        ctx.lineTo(x+width-radius,y+height);  
        ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);  
        ctx.lineTo(x+width,y+radius);  
        ctx.quadraticCurveTo(x+width,y,x+width-radius,y);  
        ctx.lineTo(x+radius,y);  
        ctx.quadraticCurveTo(x,y,x,y+radius);  
        ctx.stroke();  
    },

    onKeyPress: function (e) {
        if (e.altKey) {
            let mm = window.Browser.selectedTab.browser.messageManager
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
    }
};

// Setup the main event listeners
window.addEventListener("load", function(e) {
  TalkToMe.onLoad(e);
}, false);

window.addEventListener("UIReady", function(e) {
  TalkToMe.onUIReady(e);
}, false);

window.addEventListener("UIReadyDelayed", function(e) {
  TalkToMe.onUIReadyDelayed(e);
}, false);

window.addEventListener('keypress', function (e) {
    TalkToMe.onKeyPress(e);
}, false);
