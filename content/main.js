Components.utils.import("resource://talktome/content/console.js");

try {
    Components.utils.import("resource://talktome/content/input_mangler.js");
} catch (e) {
    console.log("aah " + e);
}
var TalkToMe = {
    _highlight_canvas: null,

    onLoad : function(aEvent) {
        this.input_mangler = new InputMangler(window);
        this.input_mangler.enable();

        window.messageManager.loadFrameScript(
            "resource://talktome/content/content-script.js", true);
        window.messageManager.addMessageListener("TalkToMe:Speak", this);
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

            const padding = 4;

            // translate coords
            let rect = this._transformContentRect(bounds.top - padding,
                                                  bounds.left - padding,
                                                  bounds.bottom + padding,
                                                  bounds.right + padding);


            let clipping = this._clip(rect);

            if (clipping.top != 0 || clipping.left != 0 ||
                clipping.bottom != 0 || clipping.right != 0) {
                let view = window.Browser.selectedTab.browser.getRootView();
                view.scrollBy(Math.round(clipping.left || clipping.right),
                              Math.round(clipping.top || clipping.bottom));

                rect = this._transformContentRect(bounds.top - padding,
                                                  bounds.left - padding,
                                                  bounds.bottom + padding,
                                                  bounds.right + padding);
            }

            this._highlight(rect);
        } catch (e) {
            console.log("Error presenting: " + e);
        }
    },

    _clip: function (rect) {
        let bcr = window.Browser.selectedTab.browser.getBoundingClientRect();

        return {
            left: ((rect.left >= bcr.left) ? 0 : rect.left - bcr.left),
            top: ((rect.top >= bcr.top) ? 0 : rect.top - bcr.top),
            right: ((rect.right <= bcr.right) ? 0 : rect.right - bcr.right),
            bottom: ((rect.bottom <= bcr.bottom) ? 0 : rect.bottom - bcr.bottom)
        };
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
    }
};

// Setup the main event listeners
window.addEventListener("load", function(e) {
    try {
        console.log ("load");
        TalkToMe.onLoad(e);
    } catch (e) {
        console.log ("Error::onLoad: " + e);
    }
}, false);

window.addEventListener("UIReady", function(e) {
  TalkToMe.onUIReady(e);
}, false);

window.addEventListener("UIReadyDelayed", function(e) {
  TalkToMe.onUIReadyDelayed(e);
}, false);
