import {settings, SETTINGS_KEY} from "../settings.js";
import {setActionIcon, setActionTitle} from "../utils.js";
import {findSiteIcon, requestSiteAccess} from "./favicon.js";

const ADDON_ID = "LightningMenu";
// settings exported from the MultiButton menu variants are also accepted
const MULTIBUTTON_ADDON_ID = "MultiButton";
const MULTIBUTTON_SETTINGS_KEY = "multibutton-settings";

const DEFAULT_LINK_ICON = "/ui/icons/icon.svg";
const DEFAULT_BUTTON_ICON = "/ui/icons/logo.svg";
const ROW_DRAG_TYPE = "application/x-lightning-menu-row";
const TOAST_TIMEOUT = 6000;
const SAVE_DELAY = 400;

let importingSettings = false;
let draggedRow = null;
let saveTimeout;
let toastTimeout;
let undoAction;
let iconEditorRow = null;

$(init);

async function init() {
    await settings.load();

    document.title = `${_ADDON_NAME} Settings`;
    $("#addon-name").text(_ADDON_NAME);
    $("#addon-version").text(`${_ADDON_NAME} ${browser.runtime.getManifest().version}`);

    const buttonIconURLText = $("#button-icon-url");
    const buttonIconURL = settings.buttonIconURL();
    buttonIconURLText.val(buttonIconURL);
    buttonIconURLText.on("input", changeIcon);
    updateButtonIconPreview(buttonIconURL);

    $("#button-icon-preview").on("error", e => {
        if (!e.target.src.endsWith(DEFAULT_BUTTON_ICON))
            e.target.src = DEFAULT_BUTTON_ICON;
    });

    $("#button-icon-file").on("click", () => $("#button-icon-file-picker").trigger("click"));

    $("#button-icon-file-picker").on("change", e => {
        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                buttonIconURLText.val(reader.result);
                changeIcon();
            };
            reader.readAsDataURL(file);
        }

        e.target.value = "";
    });

    const buttonTitleText = $("#button-title");
    const buttonTitle = settings.buttonTitle() || "";
    buttonTitleText.val(buttonTitle);
    buttonTitleText.on("input", changeTitle);

    const links = settings.links();

    if (links?.length)
        for (const link of links)
            $("#links").append(createRow(link));

    updateEmptyState();

    initLinkList();
    initDragAndDrop();
    initIconEditor();

    $("#add-link").on("click", () => addNewLink());
    $("#add-separator").on("click", addNewSeparator);

    $("#toast-undo").on("click", undo);

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
    updateButtonIconPreview(buttonIconURL);
}

function updateButtonIconPreview(url) {
    $("#button-icon-preview").attr("src", url || DEFAULT_BUTTON_ICON);
}

function changeTitle() {
    const buttonTitle = $("#button-title").val();
    settings.buttonTitle(buttonTitle);
    setActionTitle(buttonTitle);
}

/* rows */

function isSeparator(link) {
    return link.title?.startsWith('-');
}

function createRow(link) {
    const templateId = isSeparator(link)? "#separator-row-template": "#link-row-template";
    const template = $(templateId).prop("content");
    const row = $("li.row", template).clone();

    if (isSeparator(link))
        row.data("title", link.title);
    else {
        $(".title-text", row).val(link.title || "");
        $(".url-text", row).val(link.url || "");
        setRowIcon(row, link.icon);
    }

    labelRow(row);
    return row;
}

function setRowIcon(row, icon) {
    if (icon === DEFAULT_LINK_ICON)
        icon = undefined;

    // .data(key, undefined) is a getter in jQuery, so clearing needs removeData
    if (icon)
        row.data("icon", icon);
    else
        row.removeData("icon");
    $(".link-icon-image", row).attr("src", icon || DEFAULT_LINK_ICON);
}

function labelRow(row) {
    if (row.hasClass("sep"))
        return;

    const title = $(".title-text", row).val() || "new link";
    $(".fav", row).attr("aria-label", `Change icon for ${title}`);
    $(".del", row).attr("aria-label", `Remove ${title}`);
}

function getRowLink(row) {
    row = $(row);

    if (row.hasClass("sep"))
        return {title: row.data("title") || "-"};

    const link = {
        title: $(".title-text", row).val(),
        url: $(".url-text", row).val()
    };

    const icon = row.data("icon");
    if (icon)
        link.icon = icon;

    if (link.title && link.url)
        return link;
}

function addNewLink(after, link = {}) {
    const row = createRow(link);
    row.addClass("new");

    if (after)
        after.after(row);
    else
        $("#links").prepend(row);

    updateEmptyState();
    $(".title-text", row).trigger("focus");
    return row;
}

function addNewSeparator() {
    const row = createRow({title: "-"});
    $("#links").prepend(row);
    flashRow(row);
    updateEmptyState();
    saveSettings();
}

function isRowEmpty(row) {
    return !row.hasClass("sep") && !$(".title-text", row).val() && !$(".url-text", row).val();
}

function removeRow(row) {
    const prev = row.prev();
    const wasEmpty = isRowEmpty(row);
    const title = row.hasClass("sep")? "Separator": `“${$(".title-text", row).val() || $(".url-text", row).val()}”`;

    focusNeighbour(row);
    row.detach();
    updateEmptyState();
    saveSettings();

    if (!wasEmpty)
        showToast(`${title} removed`, () => {
            if (prev.length && prev.parent().length)
                prev.after(row);
            else
                $("#links").prepend(row);

            updateEmptyState();
            flashRow(row);
            saveSettings();
        });
}

function focusNeighbour(row) {
    const neighbour = row.next().length? row.next(): row.prev();

    if (neighbour.length)
        $(".del", neighbour).trigger("focus");
    else
        $("#add-link").trigger("focus");
}

function moveRow(row, offset) {
    const target = offset < 0? row.prev(): row.next();

    if (target.length) {
        if (offset < 0)
            target.before(row);
        else
            target.after(row);

        flashRow(row);
        saveSettings();
    }
}

function flashRow(row) {
    row.removeClass("moved");
    row[0].offsetWidth; // restart the animation
    row.addClass("moved");
}

function updateEmptyState() {
    $("#links-empty").prop("hidden", $("#links > .row").length > 0);
}

function initLinkList() {
    const list = $("#links");

    list.on("click", ".link-remove", e => {
        removeRow($(e.currentTarget).closest(".row"));
    });

    list.on("click", ".link-insert", e => {
        addNewLink($(e.currentTarget).closest(".row"));
    });

    list.on("click", ".fav", e => {
        openIconEditor($(e.currentTarget).closest(".row"));
    });

    list.on("input", "input", e => {
        labelRow($(e.target).closest(".row"));
        scheduleSave();
    });

    list.on("blur", "input", saveSettings);

    list.on("keydown", ".row", e => {
        const row = $(e.currentTarget);

        if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            moveRow(row, e.key === "ArrowUp"? -1: 1);
            $(e.target).trigger("focus");
        }
        else if (e.key === "Enter" && $(e.target).hasClass("url-text")) {
            e.preventDefault();
            addNewLink(row);
        }
        else if (e.key === "Escape" && row.hasClass("new") && isRowEmpty(row)) {
            e.preventDefault();
            removeRow(row);
        }
    });

    list.on("focusout", ".row.new", e => {
        const row = $(e.currentTarget);

        if (!row[0].contains(e.relatedTarget))
            row.removeClass("new");
    });
}

/* drag and drop */

function initDragAndDrop() {
    const list = $("#links");

    // rows become draggable only while grabbed by the handle, so text in their inputs stays selectable
    list.on("mousedown", ".handle", e => {
        $(e.currentTarget).closest(".row").attr("draggable", "true");
    });

    $(document).on("mouseup", () => {
        if (!draggedRow)
            $("#links > .row[draggable]").removeAttr("draggable");
    });

    list.on("dragstart", ".row", e => {
        const dt = e.originalEvent.dataTransfer;
        const row = $(e.currentTarget);

        if (row.attr("draggable") !== "true")
            return;

        draggedRow = row;
        dt.effectAllowed = "move";
        dt.setData(ROW_DRAG_TYPE, "");
        dt.setDragImage(row[0], 30, row[0].offsetHeight / 2);

        // let the browser capture the drag image before the row turns into a placeholder
        setTimeout(() => {
            row.addClass("dragging");
            list.addClass("dragging-active");
        });
    });

    list.on("dragend", ".row", () => {
        draggedRow?.removeClass("dragging").removeAttr("draggable");
        draggedRow = null;
        list.removeClass("dragging-active");
        clearDropIndicator();
    });

    // the whole card accepts drops, so links can be dropped onto an empty list too
    const dropZone = list.closest(".card");

    dropZone.on("dragover", e => {
        const dt = e.originalEvent.dataTransfer;

        if (!draggedRow && !isExternalLinkDrag(dt))
            return;

        e.preventDefault();
        dt.dropEffect = draggedRow? "move": "copy";

        if (!draggedRow)
            list.addClass("drop-target");

        showDropIndicator(getDropPosition(e.originalEvent.clientY));
    });

    dropZone.on("dragleave", e => {
        if (!dropZone[0].contains(e.originalEvent.relatedTarget)) {
            list.removeClass("drop-target");
            clearDropIndicator();
        }
    });

    dropZone.on("drop", e => {
        const dt = e.originalEvent.dataTransfer;
        const position = getDropPosition(e.originalEvent.clientY);

        list.removeClass("drop-target");
        clearDropIndicator();

        if (draggedRow) {
            e.preventDefault();
            insertAt(draggedRow, position);
            flashRow(draggedRow);
            saveSettings();
        }
        else if (isExternalLinkDrag(dt)) {
            e.preventDefault();
            const link = getDroppedLink(dt);

            if (link) {
                const row = createRow(link);
                insertAt(row, position);
                updateEmptyState();
                flashRow(row);
                saveSettings();
            }
        }
    });
}

function isExternalLinkDrag(dt) {
    const types = Array.from(dt.types);
    return types.includes("text/x-moz-url") || types.includes("text/uri-list");
}

function getDroppedLink(dt) {
    // Firefox: "url\ntitle"
    const mozURL = dt.getData("text/x-moz-url");
    let [url, title] = mozURL? mozURL.split("\n"): [];

    if (!url)
        url = dt.getData("text/uri-list")
            .split(/\r?\n/)
            .find(l => l && !l.startsWith("#"));

    if (url)
        return {url, title: title || hostnameOf(url) || url};
}

function hostnameOf(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    }
    catch (e) {
        return null;
    }
}

// returns the row the drop goes before, or {after: lastRow} at the end of the list
function getDropPosition(y) {
    const rows = $("#links > .row").not(".dragging").toArray();

    for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (y < rect.top + rect.height / 2)
            return {before: $(row)};
    }

    if (rows.length)
        return {after: $(rows[rows.length - 1])};

    return {};
}

function insertAt(row, position) {
    if (position.before)
        position.before.before(row);
    else if (position.after)
        position.after.after(row);
    else
        $("#links").append(row);
}

function showDropIndicator(position) {
    clearDropIndicator();

    if (position.before)
        position.before.addClass("drop-before");
    else if (position.after)
        position.after.addClass("drop-after");
}

function clearDropIndicator() {
    $("#links > .row").removeClass("drop-before drop-after");
}

/* icon editor */

function initIconEditor() {
    const editor = $("#icon-editor");
    const source = $("#icon-editor-src");
    const preview = $("#icon-editor-preview");

    source.on("input", () => validateIcon(source.val().trim()));

    preview.on("load", () => {
        const url = source.val().trim();

        if (url)
            setIconStatus(describeIcon(url), "ok");
    });

    preview.on("error", () => {
        if (source.val().trim())
            setIconStatus("Can not load an image from this URL", "error");
    });

    $("#icon-editor-file").on("click", () => $("#icon-editor-file-picker").trigger("click"));

    $("#icon-editor-file-picker").on("change", e => {
        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                source.val(reader.result);
                validateIcon(reader.result);
            };
            reader.readAsDataURL(file);
        }

        e.target.value = "";
    });

    $("#icon-editor-favicon").on("click", e => {
        const pageURL = $(".url-text", iconEditorRow).val().trim();

        if (!pageURL) {
            setIconStatus("Enter the link URL first", "error");
            return;
        }

        if (!/^https?:\/\/[^/]/i.test(pageURL)) {
            setIconStatus("Only http and https pages have site icons", "error");
            return;
        }

        // the permission prompt requires a user gesture, so it is requested before anything is awaited
        useSiteIcon(requestSiteAccess(), pageURL, $(e.currentTarget));
    });

    $("#icon-editor-reset").on("click", () => {
        source.val("");
        validateIcon("");
    });

    $("#icon-editor-cancel").on("click", () => closeIconEditor());

    $("#icon-editor-apply").on("click", () => {
        setRowIcon(iconEditorRow, source.val().trim() || undefined);
        saveSettings();
        closeIconEditor();
    });

    editor.on("keydown", e => {
        if (e.key === "Escape") {
            e.preventDefault();
            closeIconEditor();
        }
        else if (e.key === "Enter" && e.target === source[0]) {
            e.preventDefault();
            $("#icon-editor-apply").trigger("click");
        }
    });

    $(document).on("mousedown", e => {
        if (iconEditorRow && !editor[0].contains(e.target) && !$(".fav", iconEditorRow)[0].contains(e.target))
            closeIconEditor(false);
    });

    $(window).on("resize", () => {
        if (iconEditorRow)
            positionIconEditor();
    });
}

async function useSiteIcon(accessRequest, pageURL, button) {
    const row = iconEditorRow;
    const source = $("#icon-editor-src");

    button.prop("disabled", true);
    setIconStatus("Looking for the site icon…");

    try {
        if (!await accessRequest) {
            setIconStatus("Finding site icons needs permission to access websites", "error");
            return;
        }

        const icon = await findSiteIcon(pageURL);

        if (!iconEditorRow?.is(row))
            return; // the editor was closed or switched to another link meanwhile

        if (icon) {
            source.val(icon);
            validateIcon(icon);
        }
        else
            setIconStatus("This site has no icon that can be loaded", "error");
    }
    catch (e) {
        console.error(e);
        if (iconEditorRow?.is(row))
            setIconStatus(e instanceof TypeError? "Not a valid URL": e.message, "error");
    }
    finally {
        button.prop("disabled", false);
    }
}

function openIconEditor(row) {
    if (iconEditorRow?.is(row)) {
        closeIconEditor();
        return;
    }

    closeIconEditor(false);
    iconEditorRow = row;
    row.addClass("icon-editing");
    $(".fav", row).attr("aria-expanded", "true");

    const title = $(".title-text", row).val();
    $("#icon-editor-title").text(title? `Icon for “${title}”`: "Link icon");

    const icon = row.data("icon") || "";
    $("#icon-editor-src").val(icon);
    validateIcon(icon);

    $("#icon-editor").prop("hidden", false);
    positionIconEditor();
    $("#icon-editor-src").trigger("focus").trigger("select");
}

function positionIconEditor() {
    const editor = $("#icon-editor");
    const anchor = $(".fav", iconEditorRow)[0].getBoundingClientRect();
    const width = editor.outerWidth();
    const maxLeft = document.documentElement.clientWidth - width - 16;
    const left = Math.max(16, Math.min(anchor.left - 8, maxLeft));

    editor.css({
        left: left + window.scrollX,
        top: anchor.bottom + window.scrollY + 10
    });
    editor[0].style.setProperty("--arrow-left", `${anchor.left + anchor.width / 2 - left - 7}px`);
}

function closeIconEditor(restoreFocus = true) {
    if (!iconEditorRow)
        return;

    const fav = $(".fav", iconEditorRow);
    fav.attr("aria-expanded", "false");
    iconEditorRow.removeClass("icon-editing");
    iconEditorRow = null;
    $("#icon-editor").prop("hidden", true);

    if (restoreFocus)
        fav.trigger("focus");
}

function validateIcon(url) {
    const preview = $("#icon-editor-preview");

    if (url) {
        setIconStatus("Loading…");
        preview.attr("src", url);
    }
    else {
        setIconStatus("The default icon will be used");
        preview.attr("src", DEFAULT_LINK_ICON);
    }
}

function describeIcon(url) {
    if (url.startsWith("data:")) {
        const type = url.slice(5, url.search(/[;,]/)) || "image";
        return `Valid ${type} data URL · ${formatSize(url.length)}`;
    }

    return "Image loaded";
}

function formatSize(bytes) {
    return bytes < 1024? `${bytes} bytes`: `${(bytes / 1024).toFixed(1)} KB`;
}

function setIconStatus(text, kind) {
    $("#icon-editor-status")
        .text(text)
        .removeClass("ok error")
        .addClass(kind || "");
}

/* toast */

function showToast(text, undo) {
    clearTimeout(toastTimeout);
    undoAction = undo;

    $("#toast-text").text(text);
    $("#toast-undo").prop("hidden", !undo);
    $("#toast").prop("hidden", false);

    toastTimeout = setTimeout(hideToast, TOAST_TIMEOUT);
}

function hideToast() {
    $("#toast").prop("hidden", true);
    undoAction = null;
}

function undo() {
    const action = undoAction;
    hideToast();
    action?.();
}

/* persistence */

function scheduleSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSettings, SAVE_DELAY);
}

async function saveSettings() {
    clearTimeout(saveTimeout);

    await settings.load();

    await settings.buttonIconURL($("#button-icon-url").val());

    const links = $("#links > .row").toArray()
        .map(getRowLink)
        .filter(l => !!l);
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
    // the add-on name includes the replica number, if any (e.g. "Lightning Menu 2")
    let addonSlug = _ADDON_NAME.trim().toLowerCase().replace(/\s+/g, "-");
    let now = new Date();
    let date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
        .map(n => String(n).padStart(2, "0")).join("-");
    let filename = `${addonSlug}-settings-${date}.json`;

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
        let imported;

        try {
            imported = JSON.parse(re.target.result);
        }
        catch (e) {
            showToast("The file is not a valid settings export.");
            return;
        }

        if (imported.addon === MULTIBUTTON_ADDON_ID) {
            const multiButtonSettings = imported.settings?.[MULTIBUTTON_SETTINGS_KEY];
            imported.settings = multiButtonSettings? {[SETTINGS_KEY]: multiButtonSettings}: {};
        }
        else if (imported.addon !== ADDON_ID) {
            showToast("Export format is not supported.");
            return;
        }

        importingSettings = true;
        await browser.storage.local.set(imported.settings);

        browser.runtime.reload();
    };
    reader.readAsText(e.target.files[0]);
    e.target.value = "";
}
