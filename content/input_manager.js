Components.utils.import("resource://talktome/content/console.js");

EXPORTED_SYMBOLS=["InputManager"];

function InputManager (window) {
    this.window = window;

    console.log("listening");
    this.window.addEventListener('keypress', this.keypressHandler, false);
    this.window.addEventListener('TalkToMe::Swipe', this.swipeHandler, false);
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
        default:
            break;
        }
    }
};

