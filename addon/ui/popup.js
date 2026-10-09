import {settings} from "../settings.js";

const ACCESS_KEYS = "123456789abcdefghijklmnopqrstuvwxyz";

const accessKeyLinks = new Map();

$(init);

async function init() {
    await settings.load();

    const links = settings.links();
    const showAccessKeys = settings.showAccessKeys();

    if (links?.length)
        for (const link of links) {
            if (link.title?.startsWith('-'))
                addSeparator();
            else
                addLink(link, showAccessKeys? ACCESS_KEYS[accessKeyLinks.size]: undefined);
        }

    if (showAccessKeys)
        $(document).on("keydown", openAccessKeyLink);
}

function addLink(options, accessKey) {
    const linksDiv = $("#links");

    const linkTemplate = $("#link-template").prop("content");
    const linkDiv = $(".link", linkTemplate).clone();

    $(".link-anchor", linkDiv)
        .attr("href", options.url)
        .text(options.title)
        .on("click", openLink);

    if (options.icon)
        $(".link-icon-image", linkDiv).attr("src", options.icon);

    if (accessKey) {
        $(".link-access-key", linkDiv).text(`${accessKey}.`).prop("hidden", false);
        accessKeyLinks.set(accessKey, options.url);
    }

    linkDiv.appendTo(linksDiv);
}

function openAccessKeyLink(e) {
    if (e.ctrlKey || e.altKey || e.metaKey)
        return;

    const url = accessKeyLinks.get(e.key.toLowerCase());

    if (url) {
        e.preventDefault();
        openURL(url);
    }
}

function addSeparator() {
    const linksDiv = $("#links");

    const separatorTemplate = $("#separator-template").prop("content");
    const separatorDiv = $(".separator", separatorTemplate).clone();

    separatorDiv.appendTo(linksDiv);
}

async function openLink(e) {
    e.preventDefault();

    await openURL(e.target.href);
}

async function openURL(url) {
    await browser.tabs.create({url, active: true});
    window.close();
}
