Components.utils.import("resource://talktome/content/utils.js");
Components.utils.import("resource://talktome/content/speech.js");

EXPORTED_SYMBOLS = ["Presenter"];

function Presenter(window, tts) {
    this.window = window;
    this.tts = tts;

    window.messageManager.addMessageListener(
        "TalkToMe:SpeakNav",
        Callback(function(aMessage) {
            this.speakNav(aMessage.json.phrase);
        } ,this));
    window.messageManager.addMessageListener(
        "TalkToMe:SpeakPoint", Callback(function(aMessage) {
            this.speakPoint(aMessage.json.phrase);
        } ,this));
    window.messageManager.addMessageListener(
        "TalkToMe:ShowBounds", Callback(function(aMessage) {
            this.showBounds(aMessage.json.bounds);
        } ,this));
    window.messageManager.addMessageListener(
        "TalkToMe:SpeakAppState",  Callback(function(aMessage) {
            this.speakAppState(aMessage.json.phrase);
        } ,this));
    window.messageManager.addMessageListener(
        "TalkToMe:Activated",  Callback(function(aMessage) {
            this.playActivate();
        } ,this));
    window.messageManager.addMessageListener(
        "TalkToMe:DeadEnd",  Callback(function(aMessage) {
            this.playThud();
        } ,this));

    this._highlighter = new _Highlighter(window);
}

Presenter.prototype = {
    speakNav: function speakNav (phrase) {
        this.tts.speakContent(phrase);
    },
    speakPoint: function speakPoint (phrase) {
        this.tts.playEarcon("[tick]");
        this.tts.speakContent(phrase);
    },
    showBounds: function showBounds (bounds) {
        this._highlighter.highlight(bounds);
    },
    speakAppState: function speakAppState (phrase) {
        this.tts.speakAppState (phrase);
    },
    playTick: function playTick (phrase) {
        this.tts.playEarcon("[tick]");
    },
    playActivate: function playActivate (phrase) {
        this.tts.playEarcon("[activate]");
    },
    playThud: function playThud (phrase) {
        this.tts.playEarcon("[thud]", TextToSpeech.QUEUE_ADD);
    }
};

function _Highlighter(window) {
    this.window = window;

    // TODO: Make into prefs
    this.padding = 4;
    this.borderWidth = 2;
    this.borderRadius = 4;
    this.borderColor = "orange";
    this.borderShadow = true;

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
    this._highlightRect.style.pointerEvents = "none";
    this._highlightRect.style.display = "none";
    highlightLayer.appendChild(this._highlightRect);

    // style it
    this._highlightRect.style.borderColor = this.borderColor;
    this._highlightRect.style.borderRadius = this.borderRadius + "px";
    this._highlightRect.style.borderWidth = this.borderWidth + "px";
    
    if (this.borderShadow) {
        this._highlightRect.style.boxShadow = "1px 1px 1px #444";

        // Create inset for inner shadow
        let inset = document.createElementNS(
            "http://www.w3.org/1999/xhtml", "div");
        inset.style.width = "100%";
        inset.style.height = "100%";
        inset.style.borderRadius = (this.borderRadius/2) + "px";
        inset.style.boxShadow = "inset 1px 1px 1px #444";
        this._highlightRect.appendChild(inset);
    }

    let contentShowingObserver = document.createElement("observes");
    contentShowingObserver.setAttribute("element", "bcast_contentShowing");
    contentShowingObserver.setAttribute("attribute", "disabled");
    contentShowingObserver.addEventListener(
        "broadcast",
        Callback(function (e) {
            console.log(highlightLayer.getAttribute("disabled") == "true");
            if (highlightLayer.getAttribute("disabled") == "true")
                this.hide ();
            else
                this.show ();
        }, this));
    highlightLayer.appendChild(contentShowingObserver)

    // Hook in to relevant events
    window.Browser.controlsScrollbox.addEventListener(
        'scroll', Callback(this.askForBounds, this));
    window.addEventListener('TabSelect', Callback(this.askForBounds, this));
    window.addEventListener('TabOpen', Callback(this.hide, this));
    window.addEventListener('NavigationPanelShown', Callback(this.hide, this));
    window.addEventListener('NavigationPanelHidden', Callback(this.show, this));
}

_Highlighter.prototype.highlight = function (bounds) {
    let rect = this._transformContentRect(bounds.top - this.padding,
                                          bounds.left - this.padding,
                                          bounds.bottom + this.padding,
                                          bounds.right + this.padding);

    
    let clipping = this._clip(rect);
    
    if (clipping.top != 0 || clipping.left != 0 ||
        clipping.bottom != 0 || clipping.right != 0) {
        let view = this.window.Browser.selectedTab.browser.getRootView();
        view.scrollBy(Math.round(clipping.left || clipping.right),
                      Math.round(clipping.top || clipping.bottom));

        rect = this._transformContentRect(bounds.top - this.padding,
                                          bounds.left - this.padding,
                                          bounds.bottom + this.padding,
                                          bounds.right + this.padding);
    }

    this._highlight(rect);
};

_Highlighter.prototype._clip = function (rect) {
    let bcr = this.window.Browser.selectedTab.browser.getBoundingClientRect();

    return {
        left: ((rect.left >= bcr.left) ? 0 : rect.left - bcr.left),
        top: ((rect.top >= bcr.top) ? 0 : rect.top - bcr.top),
        right: ((rect.right <= bcr.right) ? 0 : rect.right - bcr.right),
        bottom: ((rect.bottom <= bcr.height) ? 0 : rect.bottom - bcr.height)
    };
};

_Highlighter.prototype._transformContentRect = function (top, left, bottom, right) {
    let t1 = this.window.Browser.selectedTab.browser.transformBrowserToClient(
        left, top);
    let t2 = this.window.Browser.selectedTab.browser.transformBrowserToClient(
        right, bottom);
    
    return { top: t1.y,
             left: t1.x,
             bottom: t2.y,
             right: t2.x };
};

_Highlighter.prototype.hide = function (rect) {
    this._highlightRect.style.display = "none";
};

_Highlighter.prototype.show = function (rect) {
    this._highlightRect.style.display = "block";
};

_Highlighter.prototype._highlight = function (rect){    
    this._highlightRect.style.display = "none";
    this._highlightRect.style.top = (rect.top - this.borderWidth/2) + "px";
    this._highlightRect.style.left = (rect.left - this.borderWidth/2) + "px";
    this._highlightRect.style.width =
        (rect.right - rect.left - this.borderWidth) + "px";
    this._highlightRect.style.height =
        (rect.bottom - rect.top - this.borderWidth) + "px";
    this._highlightRect.style.display = "block";
};

_Highlighter.prototype.askForBounds = function () {
    let mm = this.window.Browser.selectedTab.browser.messageManager;
    mm.sendAsyncMessage("TalkToMe:CurrentBounds");
};

_Highlighter.prototype.showBoundsHandler = function (aMessage) {
    this.highlight(aMessage.json.bounds);
}
