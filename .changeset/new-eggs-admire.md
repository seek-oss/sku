---
'sku': minor
---

Widen support for reusing existing browser tab to more Chromium browsers.

`start` and `start-ssr` scripts would previously only reuse an existing tab in Google Chrome.
This change adds support for the following Chromium browsers:

- Google Chrome,
- Google Chrome Canary,
- Microsoft Edge,
- Brave Browser,
- Vivaldi,
- Chromium,
- Arc.

A tab will be reused if:

* The OS is macOS,
* The user's default browser is a supported Chromium browser,
* The user has an existing tab open in a supported Chromium browser with the exact same URL.

If any of the above is not true, a new tab will be created in the user's default browser.

The supported Chromium browsers are:
