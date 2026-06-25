# Wiki.js Theme Injection

This folder contains the CSS override used to make Wiki.js visually align with
the Blastwave homepage.

The stylesheet is designed for Wiki.js v2's built-in CSS override setting. It
does not require a custom Wiki.js build, and it does not replace the default
theme.

## Files

- `inject.css`: Full CSS override for Wiki.js.

## Copy-Paste Install

1. Open Wiki.js as an administrator.
2. Go to `Administration > Theme`.
3. Find the CSS override or injected CSS field.
4. Paste the full contents of `inject.css`.
5. Save and refresh the wiki.

This is the safest option because Wiki.js stores the override directly in its
configuration.

## URL Import Install

If `inject.css` is served as a public static file, the Wiki.js CSS override can
be reduced to one import:

```css
@import url('https://blastwave.space/wiki-theme/inject.css');
```

To use this approach, configure Nginx to serve this folder at
`/wiki-theme/inject.css` and deploy the file alongside the main website.

## Notes

- Wiki.js does not officially support full custom themes in the admin UI.
- The top black Wiki.js header cannot be fully replaced with injected CSS.
- This stylesheet targets common Wiki.js and Vuetify selectors, so future
  Wiki.js updates may require small selector adjustments.
- Keep `inject.css` as the source of truth and re-paste or redeploy it after
  changes.
