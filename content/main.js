Components.utils.import("resource://talktome/content/console.js");

try {
    Components.utils.import("resource://talktome/content/input_mangler.js");
} catch (e) {
    console.log("aah " + e);
}
var TalkToMe = {
    _highlightRect: null,

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


            let highlightLayer = document.createElementNS(
                "http://www.w3.org/1999/xhtml", "div");
            highlightLayer.style.pointerEvents = "none";
            highlightLayer.style.MozStackSizing = 'ignore';
            highlightLayer.style.position = "relative";
            stack.appendChild(highlightLayer);

            this._highlightRect = document.createElementNS(
                "http://www.w3.org/1999/xhtml", "div");
            this._highlightRect.style.position = "absolute";
            this._highlightRect.style.borderStyle = "solid";
            this._highlightRect.style.borderColor = "orange";
            this._highlightRect.style.borderRadius = "4px";
            this._highlightRect.style.boxShadow = "1px 1px 1px #444";
            this._highlightRect.style.pointerEvents = "none";
            this._highlightRect.style.display = "none";
            highlightLayer.appendChild(this._highlightRect);

            let inset = document.createElementNS(
                "http://www.w3.org/1999/xhtml", "div");
            inset.style.width = "100%";
            inset.style.height = "100%";
            inset.style.borderRadius = "2px";
            inset.style.boxShadow = "inset 1px 1px 1px #444";
            this._highlightRect.appendChild(inset);

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

    _highlight: function (rect){
        let border = 2;

        this._highlightRect.style.display = "none";
        this._highlightRect.style.borderWidth = border + "px";
        this._highlightRect.style.top = (rect.top - border/2) + "px";
        this._highlightRect.style.left = (rect.left - border/2) + "px";
        this._highlightRect.style.width = (rect.right - rect.left - border) + "px";
        this._highlightRect.style.height = (rect.bottom - rect.top - border) + "px";
        this._highlightRect.style.display = "block";
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
