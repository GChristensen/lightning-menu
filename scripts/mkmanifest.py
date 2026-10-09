"""
Generates manifest.json from a template.

Usage: mkmanifest.py TEMPLATE OUTPUT VERSION [REPLICA] [--public]

REPLICA makes a separate copy of the add-on with its own ID and name, e.g. "2":
    lightning-menu-2@gchristensen.github.io, "Lightning Menu 2"
The replica number N also sets the Ctrl+Shift+N hotkey (MacCtrl+Shift+N on Mac) that opens the popup (N=1 without REPLICA).
--public produces the ID of the publicly listed version:
    lightning-menu-we@gchristensen.github.io
"""

import sys

ADDON_NAME = "Lightning Menu"
ADDON_ID = "lightning-menu"

args = [a for a in sys.argv[1:] if not a.startswith("--")]
public = "--public" in sys.argv[1:]

template = args[0]
output = args[1]
version = args[2]
replica = args[3].strip() if len(args) > 3 else ""

name = f"{ADDON_NAME} {replica.upper()}" if replica else ADDON_NAME

addon_id = ADDON_ID
if public:
    addon_id += "-we"
if replica:
    addon_id += "-" + replica

with open(template, "r") as manifest_in:
    manifest_text = manifest_in.read()

manifest_text = manifest_text.replace("$VERSION$", version)
manifest_text = manifest_text.replace("$ADDON_NAME$", name)
manifest_text = manifest_text.replace("$ADDON_ID$", addon_id)
manifest_text = manifest_text.replace("$REPLICA_NUMBER$", replica or "1")

with open(output, "w") as manifest_out:
    manifest_out.write(manifest_text)
