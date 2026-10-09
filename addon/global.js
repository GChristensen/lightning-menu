if (typeof browser === "undefined")
    globalThis.browser = chrome;

// some Chromium browsers also define the browser namespace, so detect Firefox by its own API
globalThis._CHROME = !browser.runtime.getBrowserInfo;

globalThis._MANIFEST = browser.runtime.getManifest()

globalThis._MANIFEST_VERSION = globalThis._MANIFEST.manifest_version;

globalThis._MANIFEST_V3 = globalThis._MANIFEST_VERSION === 3;

globalThis._ADDON_NAME = globalThis._MANIFEST.name;

globalThis._log = console.log.bind(console);
