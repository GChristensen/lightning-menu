# Set cmd as the default shell
set shell := ["cmd.exe", "/c"]

# Detect Python command
python := if os() == "windows" { "python" } else { "python3" }

version := trim(read("addon/version.txt"))

# Test with Firefox
test:
    cd addon && start web-ext run -p %FIREFOX_PROFILES%/debug --keep-profile-changes

# Test with Firefox Nightly
test-nightly:
    cd addon && start web-ext run -p %FIREFOX_PROFILES%/debug.nightly --firefox=nightly --keep-profile-changes

# Test with Chrome (generate the Chrome manifest first)
test-chrome:
    cd addon && start web-ext run -t chromium

# Sign the Firefox extension (generate a Firefox manifest first)
sign CHANNEL="unlisted":
    cd addon && web-ext sign --channel {{CHANNEL}} -a ../build -i web-ext-artifacts .web-extension-id manifest.json.* {{trim(read(env_var("HOME") + "/.amo/creds"))}}

# Build the extension (generate the manifest for the target browser first)
build:
    cd addon && web-ext build -o -a ../build -i web-ext-artifacts .web-extension-id manifest.json.*

# Build the Chrome extension package (includes the prebuilt replica manifests)
build-chrome: chrome chrome-replicas
    cd addon && web-ext build -o -a ../build -n lightning-menu-chrome-{{version}}.zip -i web-ext-artifacts .web-extension-id manifest.json.chrome manifest.json.firefox*

# Build the landing page into the site's index.html (run `npm install` in ./landing once)
landing:
    cd landing && npm run build

# Build a readable, unminified site index.html (no npm packages needed)
landing-plain:
    cd landing && npm run build:plain

# Set version
set-version VERSION:
    echo {{VERSION}}> ./addon/version.txt

# Get version
get-version:
    type .\addon\version.txt

# Generate Firefox MV2 manifest, REPLICA (e.g. 2) creates an add-on copy with a separate ID: lightning-menu-2
firefox REPLICA="":
    cd addon && {{python}} ../scripts/mkmanifest.py manifest.json.firefox manifest.json {{version}} {{REPLICA}}

# Generate Firefox MV2 manifest for the public version: lightning-menu-we
firefox-public REPLICA="":
    cd addon && {{python}} ../scripts/mkmanifest.py manifest.json.firefox manifest.json {{version}} {{REPLICA}} --public

# Generate Firefox MV3 manifest
firefox-mv3 REPLICA="":
    cd addon && {{python}} ../scripts/mkmanifest.py manifest.json.firefox.mv3 manifest.json {{version}} {{REPLICA}}

# Generate Firefox MV3 manifest for the public version
firefox-mv3-public REPLICA="":
    cd addon && {{python}} ../scripts/mkmanifest.py manifest.json.firefox.mv3 manifest.json {{version}} {{REPLICA}} --public

# Generate Chrome MV3 manifest
chrome REPLICA="":
    cd addon && {{python}} ../scripts/mkmanifest.py manifest.json.chrome manifest.json {{version}} {{REPLICA}}

# Prebuild Chrome MV3 manifests for replicas 2-5: manifest.json.2 ... manifest.json.5
chrome-replicas:
    cd addon && for %N in (2 3 4 5) do {{python}} ../scripts/mkmanifest.py manifest.json.chrome manifest.json.%N {{version}} %N
