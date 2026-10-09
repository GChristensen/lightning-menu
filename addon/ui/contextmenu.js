const SETTINGS_URL = "ui/options.html";

const CTX_MENU_TARGET = _MANIFEST_V3? "action": "browser_action";

class ContextMenu {
    constructor() {
    }

    async create() {
        await this.#clear();

        this.#createContextMenuItem("Settings", SETTINGS_URL);
    }

    #createContextMenuItem(title, url) {
        browser.contextMenus.create({id: url, title, contexts: [CTX_MENU_TARGET]});
    }

    #clear() {
        return browser.contextMenus.removeAll();
    }
}

export const contextMenu = new ContextMenu();
