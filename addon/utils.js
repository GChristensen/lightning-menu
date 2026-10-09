const DEFAULT_ICON = "/ui/icons/logo.svg";

const DEFAULT_ICON_CHROME = {
    16: "/ui/icons/logo16.png",
    32: "/ui/icons/logo32.png",
    48: "/ui/icons/logo48.png",
    128: "/ui/icons/logo128.png"
};

export function merge(to, from) {
    for (const [k, v] of Object.entries(from)) {
        if (!to.hasOwnProperty(k))
            to[k] = v;
    }
    return to;
}

function getAction() {
    return _MANIFEST_V3? browser.action: browser.browserAction;
}

export async function setActionIcon(icon) {
    const action = getAction();

    if (_CHROME) {
        // Chrome accepts only bundled raster images as a path, so remote icons are passed as ImageData
        const imageData = icon && await loadImageData(icon);

        if (imageData)
            action.setIcon({imageData});
        else
            action.setIcon({path: DEFAULT_ICON_CHROME});
    }
    else if (icon)
        action.setIcon({path: icon});
    else
        action.setIcon({path: DEFAULT_ICON});
}

async function loadImageData(url, size = 32) {
    try {
        const response = await fetch(url);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = new OffscreenCanvas(size, size);
        const context = canvas.getContext("2d");
        context.drawImage(bitmap, 0, 0, size, size);
        return {[size]: context.getImageData(0, 0, size, size)};
    }
    catch (e) {
        console.error(`Can not load the button icon: ${url}`, e);
    }
}

export function setActionTitle(title) {
    const action = getAction();

    if (title)
        action.setTitle({title});
    else
        action.setTitle({title: _ADDON_NAME});
}
