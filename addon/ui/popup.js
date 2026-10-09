import {settings} from "../settings.js";

$(init);

async function init() {
    await settings.load();

    const links = settings.links();

    if (links?.length)
        for (const link of links) {
            if (link.title?.startsWith('-'))
                addSeparator();
            else
                addLink(link);
        }
}

function addLink(options) {
    const linksDiv = $("#links");

    const linkTemplate = $("#link-template").prop("content");
    const linkDiv = $(".link", linkTemplate).clone();

    $(".link-anchor", linkDiv)
        .attr("href", options.url)
        .text(options.title)
        .on("click", openLink);

    if (options.icon)
        $(".link-icon-image", linkDiv).attr("src", options.icon);

    linkDiv.appendTo(linksDiv);
}

function addSeparator() {
    const linksDiv = $("#links");

    const separatorTemplate = $("#separator-template").prop("content");
    const separatorDiv = $(".separator", separatorTemplate).clone();

    separatorDiv.appendTo(linksDiv);
}

async function openLink(e) {
    e.preventDefault();

    await browser.tabs.create({url: e.target.href, active: true});
    window.close();
}
