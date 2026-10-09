// Makes the menu mockup interactive: switch the menu between light and dark, toggle the access keys.
(function () {
  "use strict";

  var popup = document.querySelector(".popup");
  var themeChip = document.getElementById("theme-chip");
  var keysChip = document.getElementById("keys-chip");
  if (!popup || !themeChip || !keysChip) return;

  var themeLabel = themeChip.querySelector("span");

  themeChip.addEventListener("click", function () {
    var dark = popup.classList.toggle("dark");
    themeLabel.textContent = dark ? "Dark" : "Light";
  });

  keysChip.addEventListener("click", function () {
    var hidden = popup.classList.toggle("no-keys");
    keysChip.classList.toggle("on", !hidden);
    keysChip.setAttribute("aria-pressed", String(!hidden));
  });
})();
