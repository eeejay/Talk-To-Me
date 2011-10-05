Components.utils.import("resource://talktome/content/console.js");

EXPORTED_SYMBOLS=["InputManager"];

function InputManager (window) {
    this.window = window;

    this.window.addEventListener('keypress', this.keypressHandler, false);
    this.window.addEventListener('TalkToMe::Swipe', this.swipeHandler, false);
    this.window.addEventListener('TalkToMe::Tap', this.tapHandler, false);
    this.window.addEventListener('TalkToMe::Dwell', this.dwellHandler, false);
}

InputManager.prototype.dwellHandler = function (e) {
    // navigate to item under finger
    try {
        let browser = this.window.Browser.selectedTab.browser;
        let d = e.detail[e.detail.length-1];
        browser.messageManager.sendAsyncMessage(
            "TalkToMe:Navigate", browser.transformClientToBrowser (d.x, d.y));
    } catch (e) {
        console.printException(e);
    }
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
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "next" });
            console.log ("next");
            break;
        case "left":
            mm.sendAsyncMessage("TalkToMe:Navigate", { direction : "prev" });
            console.log ("prev");
            break;
        default:
            break;
        }
    }
};

InputManager.prototype.keypressHandler = function (e) {
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
        case 13: // For some reason DOM_VK_ENTER maps to 14 ??
            mm.sendAsyncMessage("TalkToMe:Activate");
            console.log ("activate");
            break;
        default:
            break;
        }
    }
};

