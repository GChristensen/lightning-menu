# Lightning Menu

A toolbar button with a drop-down menu of links for Firefox and Chrome.

## About

Lightning Menu puts your favorite links one click away. It adds a single button to the browser toolbar.
Click it, or press its keyboard shortcut, and a compact menu of your links opens. Pick a link and it opens in a new tab.

Use it as a lightweight launcher for the sites you visit every day, the internal tools you can never remember the
address of, or any set of links you want at hand without filling up the bookmarks toolbar.

### Features

- **Your own links, your own order.** Add links, give them titles, and group them with separators. Reorder them
  by dragging a row by its handle, or with <kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>Alt</kbd>+<kbd>↓</kbd>.
  Insert a new link anywhere in the list.
- **Drag and drop.** Drop a link from any web page or the address bar onto the settings page to add it.
- **Icons for every link.** Each link shows the site's icon. Find it automatically with "Find site icon", use any
  image URL, or upload a file. Uploaded images are stored as data URLs inside your settings, so they work offline.
- **Customizable toolbar button.** Change the button's title and icon to anything you like.
- **Light and dark themes.** The menu follows the system theme by default, or can be set to always light or always dark.
- **Keyboard friendly.**
  - Open the menu with <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>1</kbd> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>1</kbd> on Mac).
    You can change the shortcut in the browser's extension shortcut settings.
  - Turn on **access keys** to number the links <code>1.</code>–<code>9.</code>, then <code>a.</code>–<code>z.</code>
    Press the key while the menu is open to go straight to the link.
- **Several menus.** Need more than one menu, say one for work and one for personal links? Install separate copies
  (replicas) of the add-on: "Lightning Menu 2", "Lightning Menu 3", and so on. Each copy has its own button,
  links, icon and settings. Each also gets its own shortcut: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>2</kbd>,
  <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>3</kbd>, and so on. See [Building](#building).
- **Private by design.** No accounts, no tracking, no data collection. Your settings are stored locally in your browser.
  The optional permission to access all websites is requested only when you use "Find site icon".
- **Import and export.** Back up your menu to a JSON file and restore it, or move it to another browser.
  Settings exported from MultiButton menus can be imported too.

Open the settings page by right-clicking the toolbar button and choosing **Settings**, or from the browser's add-ons manager.
Changes are saved automatically.

## Building

Generate a manifest for the target browser with [just](https://github.com/casey/just), then build:

```
just firefox            # Firefox MV2, ID: lightning-menu@gchristensen.github.io
just firefox 2          # a separate copy: lightning-menu-2@gchristensen.github.io, "Lightning Menu 2"
just firefox-public     # public version: lightning-menu-we@gchristensen.github.io
just firefox-mv3        # Firefox MV3 (also: firefox-mv3-public)
just chrome             # Chrome MV3
just build              # package ./addon with the current manifest into ./build
just build-chrome       # generate the Chrome manifest and package it
just sign               # sign the Firefox version on AMO (unlisted by default)
```

Settings exported from the MultiButton menu versions can be imported on the options page.
