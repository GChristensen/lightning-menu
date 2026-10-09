# Lightning Menu

A toolbar button with a drop-down menu of links for Firefox and Chrome
(the menu functionality of [MultiButton](https://github.com/GChristensen/multibutton)).

Links, separators (titles starting with "-") and link icons are configured on the options page.

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
