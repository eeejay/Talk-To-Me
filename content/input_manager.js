Components.utils.import("resource://talktome/content/utils.js");
Components.utils.import("resource://talktome/content/gesture_mangler.js");

EXPORTED_SYMBOLS=["InputManager"];

function InputManager (window, navigator) {
    this.window = window;
    this.navigator = navigator;
    this.gestureMangler = new GestureMangler(window);
}

InputManager.prototype.start = function start () {
    this.gestureMangler.enable();
    this.window.addEventListener('keypress',
                                 Callback(this.keypressHandler, this), false);
    this.window.addEventListener('TalkToMe::Swipe',
                                 Callback(this.swipeHandler, this),false);
    this.window.addEventListener('TalkToMe::Tap',
                                 Callback(this.tapHandler, this), false);
    this.window.addEventListener('TalkToMe::Dwell',
                                 Callback(this.dwellHandler, this), false);
};

InputManager.prototype.stop = function stop () {
    this.gestureMangler.disable();
    this.window.removeEventListener('keypress',
                                    Callback(this.keypressHandler, this), false);
    this.window.removeEventListener('TalkToMe::Swipe',
                                    Callback(this.swipeHandler, this),false);
    this.window.removeEventListener('TalkToMe::Tap',
                                    Callback(this.tapHandler, this), false);
    this.window.removeEventListener('TalkToMe::Dwell',
                               Callback(this.dwellHandler, this), false);
};


InputManager.prototype.dwellHandler = function (e) {
    // navigate to item under finger
    let d = e.detail[e.detail.length-1];
    let {x: x, y: y} = this.window.Browser.selectedTab.browser.
        transformClientToBrowser (d.x, d.y);
    this.navigator.toPoint(x, y);
};

InputManager.prototype.tapHandler = function (e) {
    if (e.detail.length != 2) return // not a double tap.
    this.navigator.activate();
}

InputManager.prototype.swipeHandler = function (e) {
    let mm = this.window.Browser.selectedTab.browser.messageManager;
    let detail = e.detail[e.detail.length-1];
    if (detail.fingers == 1) {

        switch (detail.direction) {
        case "right":
            this.navigator.next();
            break;
        case "left":
            this.navigator.prev();
            break;
        default:
            break;
        }
    } else if (detail.fingers == 3) {
        switch (detail.direction) {
        case "right":
            this.navigator.chromeRight();
            break;
        case "left":
            this.navigator.chromeLeft();
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
            this.navigator.next();
            break;
        case e.DOM_VK_UP:
            this.navigator.prev();
            break;
        case e.DOM_VK_LEFT:
            this.navigator.chromeLeft()
            break;
        case e.DOM_VK_RIGHT:
            this.navigator.chromeRight()
            break;
        case 13: // For some reason DOM_VK_ENTER maps to 14 ??
            this.navigator.activate();
            break;
        default:
            break;
        }
    }
};

