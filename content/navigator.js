Components.utils.import("resource://talktome/content/utils.js");

EXPORTED_SYMBOLS = ["Navigator"];

function Navigator(window, presenter) {
    this.window = window;
    this.presenter = presenter;
}

Navigator.prototype = {
    next: function next () {
        console.log("Navigator.next");
        this.presenter.playTick();
        this._message("Navigate", { direction : "next" });
    },
    prev: function prev () {
        console.log("Navigator.prev");
        this.presenter.playTick();
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
    },
    chromeRight: function chromeRight () {
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
        let mm = this.window.BrowserApp.selectedTab.browser.messageManager;
        mm.sendAsyncMessage("TalkToMe:" + message, details);
    }
};
