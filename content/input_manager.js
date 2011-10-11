Components.utils.import("resource://talktome/content/utils.js");

EXPORTED_SYMBOLS=["InputManager"];

function _SidebarToggler (window) {
    let document = window.document;
    this.window = window;

    this._elements = [document.getElementById('controls-sidebar'),
                      document.getElementById('page-stack'),
                      document.getElementById('tabs-sidebar')];
    this._current = 1;
}

_SidebarToggler.prototype = {
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

function InputManager (window) {
    this.window = window;
    this._sidebarToggler = new _SidebarToggler(window);

    window.addEventListener('keypress',
                            Callback(this.keypressHandler, this), false);
    window.addEventListener('TalkToMe::Swipe',
                            Callback(this.swipeHandler, this),false);
    window.addEventListener('TalkToMe::Tap',
                            Callback(this.tapHandler, this), false);
    window.addEventListener('TalkToMe::Dwell',
                            Callback(this.dwellHandler, this), false);
}

InputManager.prototype.dwellHandler = function (e) {
    // navigate to item under finger
    let browser = this.window.Browser.selectedTab.browser;
    let d = e.detail[e.detail.length-1];
    browser.messageManager.sendAsyncMessage(
        "TalkToMe:Navigate", browser.transformClientToBrowser (d.x, d.y));
};

InputManager.prototype.tapHandler = function (e) {
    if (e.detail.length != 2) return // not a double tap.
    let mm = this.window.Browser.selectedTab.browser.messageManager;
    mm.sendAsyncMessage("TalkToMe:Activate");
}

InputManager.prototype.swipeHandler = function (e) {
    let mm = this.window.Browser.selectedTab.browser.messageManager;
    let detail = e.detail[e.detail.length-1];
    if (detail.fingers == 1) {

        switch (detail.direction) {
        case "right":
            console.log ("next");
            this.window.tts.playTick();
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "next" });
            break;
        case "left":
            console.log ("prev");
            this.window.tts.playTick();
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "prev" });
            break;
        default:
            break;
        }
    } else if (detail.fingers == 3) {
        switch (detail.direction) {
        case "right":
            this._sidebarToggler.right();
            break;
        case "left":
            this._sidebarToggler.left();
            break;
        default:
            break;
        }
    }
};

InputManager.prototype.keypressHandler = function (e) {
    if (e.target.nodeName == "html") return;
    if (e.altKey) {
        let mm = this.window.Browser.selectedTab.browser.messageManager;
        switch (e.keyCode) {
        case e.DOM_VK_DOWN:
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "next" });
            console.log ("next");
            break;
        case e.DOM_VK_UP:
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "prev" });
            console.log ("prev");
            break;
        case e.DOM_VK_LEFT:
            this._sidebarToggler.left();
            break;
        case e.DOM_VK_RIGHT:
            this._sidebarToggler.right();
            break;
        case 13: // For some reason DOM_VK_ENTER maps to 14 ??
            mm.sendAsyncMessage("TalkToMe:Activate");
            console.log ("activate");
            break;
        default:
            break;
        }
    }
};

