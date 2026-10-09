import "./global.js";
import {settings} from "./settings.js";
import {setActionIcon, setActionTitle} from "./utils.js";
import {contextMenu} from "./ui/contextmenu.js";

browser.runtime.onStartup.addListener(() => {});

browser.contextMenus.onClicked.addListener(menuInfo => {
    browser.tabs.create({url: menuInfo.menuItemId, active: true});
});

// top-level await is not allowed in Chrome service workers
(async () => {
    await settings.load();
    await contextMenu.create();
    const buttonTitle = settings.buttonTitle();
    setActionTitle(buttonTitle);
    const buttonIconURL = settings.buttonIconURL();
    setActionIcon(buttonIconURL);
})();
