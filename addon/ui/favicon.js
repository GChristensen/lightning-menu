// Finds the icon a site declares for a page: <link rel="icon"> and friends, falling back to /favicon.ico

const ALL_URLS = {origins: ["<all_urls>"]};
const FETCH_TIMEOUT = 8000;
const IMAGE_TIMEOUT = 5000;
const PREFERRED_SIZE = 32; // icons are shown at 16px, so 32px covers HiDPI screens

// must be called directly from a user gesture handler, before any await
export function requestSiteAccess() {
    return browser.permissions.request(ALL_URLS);
}

export async function findSiteIcon(pageURL) {
    const url = new URL(pageURL);

    if (!/^https?:$/.test(url.protocol))
        throw new Error("Only http and https pages have site icons");

    let candidates = [];

    try {
        candidates = await getDeclaredIcons(url);
    }
    catch (e) {
        console.error(`Can not read ${url}`, e);
    }

    candidates.push({href: `${url.origin}/favicon.ico`});

    for (const candidate of candidates)
        if (await canLoadImage(candidate.href))
            return candidate.href;
}

async function getDeclaredIcons(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {credentials: "omit", signal: controller.signal});

        if (!response.ok || !response.headers.get("content-type")?.includes("html"))
            return [];

        const html = await response.text();
        // DOMParser does not run scripts or load resources of the parsed page
        const doc = new DOMParser().parseFromString(html, "text/html");
        const base = doc.querySelector("base[href]")?.getAttribute("href");
        const baseURL = base? new URL(base, response.url): new URL(response.url);

        const icons = [];
        for (const link of doc.querySelectorAll("link[rel][href]")) {
            const rel = link.getAttribute("rel").toLowerCase().split(/\s+/);
            const kind = rel.includes("icon")
                ? "icon"
                : rel.includes("apple-touch-icon") || rel.includes("apple-touch-icon-precomposed")
                    ? "touch"
                    : null;

            if (kind)
                icons.push({
                    kind,
                    href: new URL(link.getAttribute("href"), baseURL).href,
                    type: link.getAttribute("type")?.toLowerCase(),
                    size: parseSize(link.getAttribute("sizes"))
                });
        }

        return icons.sort((a, b) => rankIcon(a) - rankIcon(b));
    }
    finally {
        clearTimeout(timeout);
    }
}

// "16x16 32x32" -> 32, "any" -> Infinity (scalable), none -> undefined
function parseSize(sizes) {
    if (!sizes)
        return undefined;

    if (/\bany\b/i.test(sizes))
        return Infinity;

    const values = sizes.match(/\d+(?=x\d+)/gi)?.map(Number) || [];
    return values.length? Math.max(...values): undefined;
}

function isSVG(icon) {
    return icon.type === "image/svg+xml" || /\.svg(\?|#|$)/i.test(icon.href);
}

// lower is better: scalable icons, then the smallest raster icon that is at least 32px,
// then icons of unknown size (often multi-resolution .ico files), then smaller ones
function rankIcon(icon) {
    let rank = icon.kind === "touch"? 1000: 0;

    if (isSVG(icon) || icon.size === Infinity)
        return rank;

    if (icon.size === undefined)
        return rank + 300;

    return rank + (icon.size >= PREFERRED_SIZE
        ? 100 + Math.min(icon.size - PREFERRED_SIZE, 150)
        : 400 + PREFERRED_SIZE - icon.size);
}

function canLoadImage(src) {
    return new Promise(resolve => {
        const image = new Image();
        const timeout = setTimeout(() => done(false), IMAGE_TIMEOUT);

        function done(result) {
            clearTimeout(timeout);
            image.onload = image.onerror = null;
            resolve(result);
        }

        image.onload = () => done(image.naturalWidth > 0);
        image.onerror = () => done(false);
        image.src = src;
    });
}
