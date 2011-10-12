Components.utils.import("resource://talktome/content/utils.js");

EXPORTED_SYMBOLS = ["Navigator"];

function Navigator(window, presenter) {
    this.window = window;
    this.presenter = presenter;

    this._horizontalChrome = new _HorizontalChrome (window);
}

Navigator.prototype = {
    next: function next () {
        console.log("Navigator.next");
        this.presenter.tick();
        this._message("Navigate", { direction : "next" });
    },
    prev: function prev () {
        console.log("Navigator.prev");
        this.presenter.tick();
        this._message("Navigate", { direction : "prev" });
    },
    activate: function activate () {
        console.log("Navigator.activate");
        this._message("Activate");
    },
    toPoint: function toPoint (x, y) {
        console.log("Navigator.toPoint (" + x + ", " + y + ")");
        this._message("Navigate", { x: x, y: y });
    },
    chromeLeft: function chromeLeft () {
        this._horizontalChrome.left();
    },
    chromeRight: function chromeRight () {
        this._horizontalChrome.right();
    },
    chromeTop: function chromeTop () {
    },
    chromeBottom: function chromeBottom () {
    },
    toTop: function toTop () {
        throw new Error("not implemented");
    },
    toBottom: function toBottom () {
        throw new Error("not implemented");
    },
    isTop: function isTop () {
        throw new Error("not implemented");
    },
    isBottom: function isBottom () {
        throw new Error("not implemented");
    },
    _message: function _navigate (message, details) {
        let mm = this.window.Browser.selectedTab.browser.messageManager;
        mm.sendAsyncMessage("TalkToMe:" + message, details);
    }
};

function _HorizontalChrome (window) {
    let document = window.document;
    this.window = window;

    this._elements = [document.getElementById('controls-sidebar'),
                      document.getElementById('page-stack'),
                      document.getElementById('tabs-sidebar')];
    this._current = 1;
}

_HorizontalChrome.prototype = {
    left: function left () {
        this._current = Math.max(0, --this._current);
        this.window.Browser.controlsScrollboxScroller
            .ensureElementIsVisible(this._elements[this._current]);
    },
    right: function right () {
        this._current = Math.min(this._elements.length - 1, ++this._current);
        this.window.Browser.controlsScrollboxScroller
            .ensureElementIsVisible(this._elements[this._current]);
    }
}
