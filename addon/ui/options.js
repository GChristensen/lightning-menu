import {settings, SETTINGS_KEY} from "../settings.js";
import {setActionIcon, setActionTitle} from "../utils.js";

const ADDON_ID = "LightningMenu";
// settings exported from the MultiButton menu variants are also accepted
const MULTIBUTTON_ADDON_ID = "MultiButton";
const MULTIBUTTON_SETTINGS_KEY = "multibutton-settings";

let importingSettings = false;

$(init);

async function init() {
    await settings.load();

    const buttonIconURLText = $("#button-icon-url");
    const buttonIconURL = settings.buttonIconURL();
    buttonIconURLText.val(buttonIconURL);
    buttonIconURLText.on("input", changeIcon);

    const buttonTitleText = $("#button-title");
    const buttonTitle = settings.buttonTitle() || "";
    buttonTitleText.val(buttonTitle);
    buttonTitleText.on("input", changeTitle);

    const links = settings.links();

    if (links?.length)
        for (const link of links)
            addLink(link);
    else
        addNewLink();

    const linksTable = $("#links");

    linksTable.on("click", ".link-icon-image", e => {
        setLinkIcon($(e.target));
    });

    linksTable.on("click", ".link-add", e => {
        addNewLink($(e.target).closest("tr.link"));
    });

    linksTable.on("click", ".link-remove", e => {
        removeLink($(e.target).closest("tr.link"));
    });

    linksTable.on("click", ".link-move-up", e => {
        moveUpLink($(e.target).closest("tr.link"));
    });

    linksTable.on("click", ".link-move-down", e => {
        moveDownLink($(e.target).closest("tr.link"));
    });

    $("#export-settings").on("click", exportSettings);
    $("#import-settings").on("click", importSettings);
    $("#import-settings-file-picker").on("change", readSettingsFile);
}

window.onbeforeunload = function() {
    if (!importingSettings)
        saveSettings();

    return undefined;
};

function changeIcon() {
    const buttonIconURL = $("#button-icon-url").val();
    settings.buttonIconURL(buttonIconURL);
    setActionIcon(buttonIconURL);
}

function changeTitle() {
    const buttonTitle = $("#button-title").val();
    settings.buttonTitle(buttonTitle);
    setActionTitle(buttonTitle);
}

async function setLinkIcon(iconImg) {
    const iconURL = prompt("Icon URL:");

    if (iconURL) {
        iconImg.attr("src", iconURL);
        await saveSettings();
    }
}

function addLink(options, sibling) {
    const linkTable = $("#links");

    let linkTemplate = $("#link-row-template").prop("content");
    const linkTR = $("tr.link", linkTemplate).clone();

    if (sibling)
        sibling.after(linkTR);
    else
        linkTR.appendTo(linkTable);

    $(".title-text", linkTR).val(options.title || "");
    $(".url-text", linkTR).val(options.url || "");

    if (options.icon)
        $(".link-icon-image", linkTR)
            .prop("src", options.icon);

    $(".title-text", linkTR).on("blur", saveSettings);
    $(".url-text", linkTR).on("blur", saveSettings);
}

function addNewLink(sibling) {
    const newLink = {};

    if (sibling)
        addLink(newLink, sibling);
    else
        addLink(newLink);
}

function removeLink(object) {
    const title = $(".title-text", object).val();
    const url = $(".url-text", object).val();
    if (!(title || url) || confirm(`Do you really want to remove ${title? `"${title}"`: "this item"}?`)) {
        object.remove();
        saveSettings();

        if (!$("tr.link").length)
            addNewLink();
    }
}

function getLinkOptions(i, linkTR) {
    linkTR = $(linkTR);

    const link = {
        icon: $(".link-icon-image", linkTR).attr("src"),
        title: $(".title-text", linkTR).val(),
        url: $(".url-text", linkTR).val()
    };

    if (link.title && (link.url || link.title.startsWith('-')))
        return link;
}

function moveUpLink(object) {
    const prev = object.prev();
    
    if (prev.length) {
        exchangeLinks(object, prev);
        saveSettings();
    }
}

function moveDownLink(object) {
    const next = object.next();

    if (next.length) {
        exchangeLinks(object, next);
        saveSettings();
    }
}

function exchangeLinks(object, other) {
    const [title, url, icon] = [
        $(".title-text", object).val(),
        $(".url-text", object).val(),
        $(".link-icon-image", object).prop("src")
    ];

    const [otherTitle, otherUrl, otherIcon] = [
        $(".title-text", other).val(),
        $(".url-text", other).val(),
        $(".link-icon-image", other).prop("src")
    ];

    $(".title-text", object).val(otherTitle);
    $(".url-text", object).val(otherUrl);
    $(".link-icon-image", object).prop("src", otherIcon);

    $(".title-text", other).val(title);
    $(".url-text", other).val(url);
    $(".link-icon-image", other).prop("src", icon);
}

async function saveSettings() {
    await settings.load();

    await settings.buttonIconURL($("#button-icon-url").val());

    let links = $("tr.link").map(getLinkOptions);
    links = Array.from(links).filter(l => !!l);
    await settings.links(links);
}

async function exportSettings(e) {
    e.preventDefault();

    let exported = {};
    exported.addon = ADDON_ID;
    exported.version = browser.runtime.getManifest().version;

    exported.settings = await browser.storage.local.get() || {};

    // download link
    let file = new Blob([JSON.stringify(exported, null, 2)], {type: "application/json"});
    let url = URL.createObjectURL(file);
    let filename = "lightning-menu-settings.json";

    let download = await browser.downloads.download({url: url, filename: filename, saveAs: true});

    let download_listener = delta => {
        if (delta.id === download && delta.state && delta.state.current === "complete") {
            browser.downloads.onChanged.removeListener(download_listener);
            URL.revokeObjectURL(url);
        }
    };
    browser.downloads.onChanged.addListener(download_listener);
}

async function importSettings(e) {
    e.preventDefault();

    $("#import-settings-file-picker").click();
}

async function readSettingsFile(e) {
    let reader = new FileReader();
    reader.onload = async function(re) {
        let imported = JSON.parse(re.target.result);

        if (imported.addon === MULTIBUTTON_ADDON_ID) {
            const multiButtonSettings = imported.settings?.[MULTIBUTTON_SETTINGS_KEY];
            imported.settings = multiButtonSettings? {[SETTINGS_KEY]: multiButtonSettings}: {};
        }
        else if (imported.addon !== ADDON_ID) {
            alert("Export format is not supported.");
            return;
        }

        importingSettings = true;
        await browser.storage.local.set(imported.settings);

        browser.runtime.reload();
    };
    reader.readAsText(e.target.files[0]);
}
